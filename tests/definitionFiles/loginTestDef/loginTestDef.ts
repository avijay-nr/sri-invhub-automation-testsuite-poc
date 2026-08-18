import { expect, test, type Page } from '@playwright/test';
import { appConfig, testSettings } from '../../configFiles/config';
import { resolveOtpOrThrow } from '../../utils/otp';
import * as fs from 'fs';
import * as path from 'path';

const authSelectors = {
  emailInput: 'input[placeholder="Email"]',
  sendCodeButton: 'button:has-text("Send verification code")',
  otpInput: 'input[placeholder*="verification" i], input[placeholder="000000"], input[placeholder*="otp" i], input[name*="otp" i], input[id*="otp" i]',
  verifyButton: 'button:has-text("Verify")',
};

// ✅ Per-environment session file — no cross-env conflicts!
const env = process.env.TEST_ENV || 'QA-Dev';
const SESSION_FILE = path.resolve(`./auth/session-${env}.json`);

function configureLoginTestTimeoutFromEnv(): void {
  const timeoutFromEnv = process.env.LOGIN_TEST_TIMEOUT_MS?.trim();
  const timeoutMs = Number.parseInt(timeoutFromEnv || String(testSettings.loginTestTimeoutMs), 10);
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    test.setTimeout(timeoutMs);
  }
}

configureLoginTestTimeoutFromEnv();

export class LoginDef {
  private otpRequestedAtIso?: string;

  private readonly baseUrl: string = appConfig.loginUrl.replace(/\/login.*$/, '');
  private readonly appUrl: string = `${appConfig.loginUrl.replace(/\/login.*$/, '')}${appConfig.postLoginPath}`;

  constructor(private readonly page: Page) {}

  async openLoginPage(): Promise<void> {
    try {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'commit', timeout: 45_000 });
    }
    await expect(this.page.locator(authSelectors.emailInput)).toBeVisible({ timeout: 30_000 });
  }

  async requestOtpForConfiguredUser(): Promise<void> {
    if (!appConfig.userEmail) {
      throw new Error('Set TEST_USER_EMAIL in .env');
    }
    await this.page.locator(authSelectors.emailInput).fill(appConfig.userEmail);
    this.otpRequestedAtIso = new Date().toISOString();
    await this.page.locator(authSelectors.sendCodeButton).click();
  }

  async submitOtpAndVerify(): Promise<void> {
    const otpInput = this.page.locator(authSelectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: 30_000 });
    if (this.otpRequestedAtIso) {
      process.env.OTP_NOT_BEFORE_ISO = this.otpRequestedAtIso;
    }
    const otp = await resolveOtpOrThrow();
    await otpInput.fill(otp);
    await this.page.locator(authSelectors.verifyButton).click();
  }

  async verifyRedirectToApplicationUi(): Promise<void> {
    await this.page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: 150_000 });
    await expect(this.page).toHaveURL(new RegExp(`${appConfig.postLoginPath}.*$`));
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private async saveUpdatedTokensToSession(): Promise<void> {
    try {
      if (!fs.existsSync(SESSION_FILE)) {
        console.log(`ℹ️ session-${env}.json not found — skipping token save`);
        return;
      }

      const accessToken = await this.page.evaluate(() => localStorage.getItem('accessToken'));
      const refreshToken = await this.page.evaluate(() => localStorage.getItem('refreshToken'));

      if (!accessToken || !refreshToken) {
        console.log('ℹ️ No tokens in localStorage — skipping token save');
        return;
      }

      const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));

      if (session.origins) {
        for (const origin of session.origins) {
          if (origin.localStorage) {
            for (const entry of origin.localStorage) {
              if (entry.name === 'accessToken') entry.value = accessToken;
              if (entry.name === 'refreshToken') entry.value = refreshToken;
            }
          }
        }
      }

      fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
      console.log(`💾 Rotated tokens saved to session-${env}.json`);
    } catch (err) {
      console.log('⚠️ Could not save updated tokens to session file:', err);
    }
  }

  /**
   * ✅ Listens to ALL GraphQL responses from the app.
   * Captures token rotation IMMEDIATELY the moment app rotates them.
   */
  async startTokenRotationWatcher(): Promise<void> {
    this.page.on('response', async (response) => {
      try {
        if (!response.url().includes('/graphql')) return;
        if (response.request().method() !== 'POST') return;

        const body = await response.text().catch(() => '');
        if (!body) return;

        const json = JSON.parse(body);
        const tokens = json?.data?.refreshToken as Record<string, string> | undefined;

        if (tokens?.accessToken && tokens?.refreshToken) {
          console.log('🔄 App rotated tokens — intercepted & saving immediately!');

          if (!fs.existsSync(SESSION_FILE)) return;

          const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));

          if (session.origins) {
            for (const origin of session.origins) {
              if (origin.localStorage) {
                for (const entry of origin.localStorage) {
                  if (entry.name === 'accessToken') entry.value = tokens.accessToken;
                  if (entry.name === 'refreshToken') entry.value = tokens.refreshToken;
                }
              }
            }
          }

          fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
          console.log(`💾 Intercepted rotation saved to session-${env}.json ✅`);
        }
      } catch {
        // ignore — not every graphql response is a token rotation
      }
    });
  }

  /**
   * ✅ SIMPLIFIED! No more tryRefreshToken — let the APP handle it!
   *
   * Flow:
   * 1. Navigate to appUrl with session (tokens in localStorage)
   * 2. App JS sees expired AT → refreshes using RT → auto-navigates
   * 3. Our interceptor catches new tokens → saves to session-{env}.json
   * 4. We just check: are we on the app or login page?
   */
  async loginIfNeeded(): Promise<void> {
    console.log(`ℹ️ Navigating to app: ${this.appUrl}`);

    // ✅ Start watching for token rotations BEFORE navigation
    await this.startTokenRotationWatcher();

    // ✅ Navigate directly to the app — let it handle token refresh!
    try {
      await this.page.goto(this.appUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch {
      // ERR_ABORTED is fine — app may be redirecting after refresh
      console.log('ℹ️ Navigation interrupted — app may be handling auth...');
    }

    // ✅ Give app time to refresh tokens and settle
    await this.page.waitForTimeout(5_000);

    // ✅ Check: did app handle it, or are we on login page?
    const onLoginPage = await this.page
      .locator(authSelectors.emailInput)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!onLoginPage) {
      // 🎉 App refreshed tokens itself — we're in!
      console.log('✅ App loaded — no OTP needed!');
      await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await this.saveUpdatedTokensToSession();
      return;
    }

    // ⚠️ App couldn't refresh — OTP fallback (last resort)
    console.log('⚠️ App redirected to login — performing full OTP login...');
    await this.requestOtpForConfiguredUser();
    await this.submitOtpAndVerify();
    await this.verifyRedirectToApplicationUi();
    await this.saveUpdatedTokensToSession();
  }

  async saveFinalTokens(): Promise<void> {
    await this.saveUpdatedTokensToSession();
  }
}