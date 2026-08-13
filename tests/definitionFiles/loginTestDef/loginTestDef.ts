import { expect, test, type Page } from '@playwright/test';
import { appConfig, testSettings } from '../../configFiles/config';
import { resolveOtpOrThrow } from '../../utils/otp';

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

  constructor(private readonly page: Page) {}

  async openLoginPage(): Promise<void> {
    try {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'commit', timeout: 45_000 });
    }

    await expect(this.page.locator(appConfig.selectors.emailInput)).toBeVisible({ timeout: 30_000 });
  }

  async requestOtpForConfiguredUser(): Promise<void> {
    if (!appConfig.userEmail) {
      throw new Error('Set TEST_USER_EMAIL in .env');
    }

    await this.page.locator(appConfig.selectors.emailInput).fill(appConfig.userEmail);
    this.otpRequestedAtIso = new Date().toISOString();
    await this.page.locator(appConfig.selectors.sendCodeButton).click();
  }

  async submitOtpAndVerify(): Promise<void> {
    const otpInput = this.page.locator(appConfig.selectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: 30_000 });

    if (this.otpRequestedAtIso) {
      process.env.OTP_NOT_BEFORE_ISO = this.otpRequestedAtIso;
    }
    const otp = await resolveOtpOrThrow();

    await otpInput.fill(otp);
    await this.page.locator(appConfig.selectors.verifyButton).click();
  }

  async verifyRedirectToApplicationUi(): Promise<void> {
    await this.page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: 150_000 });
    await expect(this.page).toHaveURL(new RegExp(`${appConfig.postLoginPath}.*$`));
    await this.page.waitForTimeout(5_000);
  }
}
