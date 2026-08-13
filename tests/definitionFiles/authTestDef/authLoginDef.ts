import { expect, test, type Page } from '@playwright/test';
import { appConfig, testSettings } from '../../configFiles/config';
import { resolveOtpOrThrow } from '../../utils/otp';

// Constants for auth login tests
const EMAIL_INPUT_TIMEOUT = 30_000;
const SEND_CODE_TIMEOUT = 30_000;
const OTP_INPUT_TIMEOUT = 30_000;
const OTP_VERIFY_TIMEOUT = 150_000;
const DASHBOARD_LOAD_TIMEOUT = 5_000;
const SESSION_IDLE_WAIT_MS = 10_000;

function configureLoginTestTimeoutFromEnv(): void {
  const timeoutFromEnv = process.env.LOGIN_TEST_TIMEOUT_MS?.trim();
  const timeoutMs = Number.parseInt(timeoutFromEnv || String(testSettings.loginTestTimeoutMs), 10);

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    test.setTimeout(timeoutMs);
  }
}

configureLoginTestTimeoutFromEnv();

export class AuthLoginDef {
  private otpRequestedAtIso?: string;

  constructor(private readonly page: Page) {}

  async openLoginPage(): Promise<void> {
    try {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch {
      await this.page.goto(appConfig.loginUrl, { waitUntil: 'commit', timeout: 45_000 });
    }

    await expect(this.page.locator(appConfig.selectors.emailInput)).toBeVisible({
      timeout: EMAIL_INPUT_TIMEOUT,
    });
  }

  async verifyLoginPageDisplayed(): Promise<void> {
    const emailInput = this.page.locator(appConfig.selectors.emailInput).first();
    const sendCodeButton = this.page.locator(appConfig.selectors.sendCodeButton).first();
    await expect(emailInput).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
    await expect(sendCodeButton).toBeVisible({ timeout: SEND_CODE_TIMEOUT });
  }

  async enterEmail(email: string): Promise<void> {
    const emailInput = this.page.locator(appConfig.selectors.emailInput).first();
    await expect(emailInput).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
    await emailInput.fill(email);

    const filledValue = await emailInput.inputValue();
    expect(filledValue).toBe(email);
  }

  async requestOtp(): Promise<void> {
    if (!appConfig.userEmail) {
      throw new Error('Set TEST_USER_EMAIL in .env');
    }

    this.otpRequestedAtIso = new Date().toISOString();
    await this.page.locator(appConfig.selectors.sendCodeButton).click();

    const otpInput = this.page.locator(appConfig.selectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
  }

  async verifyOtpInputReady(): Promise<void> {
    const otpInput = this.page.locator(appConfig.selectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
    const isEnabled = await otpInput.isEnabled();
    expect(isEnabled).toBe(true);
  }

  async submitOtp(): Promise<void> {
    const otpInput = this.page.locator(appConfig.selectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });

    if (this.otpRequestedAtIso) {
      process.env.OTP_NOT_BEFORE_ISO = this.otpRequestedAtIso;
    }
    const otp = await resolveOtpOrThrow();

    await otpInput.fill(otp);
    await this.page.locator(appConfig.selectors.verifyButton).click();
  }

  async verifyRedirectToDashboard(): Promise<void> {
    await this.page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: OTP_VERIFY_TIMEOUT });
    await expect(this.page).toHaveURL(new RegExp(`${appConfig.postLoginPath}.*$`));
    await this.page.waitForTimeout(DASHBOARD_LOAD_TIMEOUT);
  }

  async verifyDashboardElementsVisible(): Promise<void> {
    const dashboardElement = this.page.locator((appConfig.selectors as any).dashboardButton).first();
    const adminElement = this.page.locator(appConfig.selectors.adminSection).first();

    const dashboardVisible = await dashboardElement.isVisible().catch(() => false);
    const adminVisible = await adminElement.isVisible().catch(() => false);

    expect(dashboardVisible || adminVisible).toBe(true);
  }

  async submitWrongOtp(wrongOtp: string): Promise<void> {
    const otpInput = this.page.locator(appConfig.selectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
    await otpInput.fill(wrongOtp);
    await this.page.locator(appConfig.selectors.verifyButton).click();
  }

  async verifyErrorMessageDisplayed(): Promise<void> {
    const errorMessage = this.page.locator((appConfig.selectors as any).invalidCredentialsMessage).first();
    await expect(errorMessage).toBeVisible({ timeout: SEND_CODE_TIMEOUT });
  }

  async waitForSessionTimeout(): Promise<void> {
    const sessionTimeoutMs = (appConfig as any).sessionTimeoutMs || 900000; // 15 minutes default
    console.log(`Waiting ${sessionTimeoutMs}ms for session to timeout...`);
    await this.page.waitForTimeout(sessionTimeoutMs);
  }

  async attemptActionWhileIdle(): Promise<void> {
    // Navigate to a protected page to trigger session timeout check
    await this.page.goto(appConfig.postLoginPath);
  }

  async verifySessionExpired(): Promise<void> {
    // Session expired should redirect to login page
    await this.page.waitForURL(new RegExp(appConfig.loginUrl), { timeout: 30_000 });
    await expect(this.page).toHaveURL(new RegExp(appConfig.loginUrl));
  }

  async remainIdleAndReload(): Promise<void> {
    // Wait for session idle period
    await this.page.waitForTimeout(SESSION_IDLE_WAIT_MS);
    // Reload page to test session persistence
    await this.page.reload();
  }

  async verifyDashboardAccessible(): Promise<boolean> {
    const currentUrl = this.page.url();
    const dashboardElement = this.page.locator((appConfig.selectors as any).dashboardButton).first();
    const isOnDashboard = currentUrl.includes(appConfig.postLoginPath);
    const isDashboardVisible = await dashboardElement.isVisible().catch(() => false);
    return isOnDashboard || isDashboardVisible;
  }

  async verifyAdminSectionAccessible(): Promise<boolean> {
    const adminButton = this.page.locator(appConfig.selectors.adminSection).first();
    return await adminButton.isVisible().catch(() => false);
  }

  async verifyNotOnLoginPage(): Promise<void> {
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain(appConfig.loginUrl);
  }

  async clickUserProfileIcon(): Promise<void> {
    const email = appConfig.userEmail?.trim();
    const emailRegex = email ? new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const candidateIcons = [
      emailRegex ? this.page.getByRole('button', { name: emailRegex }).first() : null,
      this.page.locator('[role="complementary"] button:has-text("@")').first(),
      this.page.locator('[role="complementary"] [role="button"]').filter({ hasText: /@/ }).first(),
      this.page.locator((appConfig.selectors as any).userProfileIcon).first(),
    ].filter(Boolean) as Array<ReturnType<Page['locator']>>;

    for (const candidate of candidateIcons) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        return;
      }
    }

    throw new Error('Unable to find the user profile/login icon in the sidebar.');
  }

  async verifyUserMenuDropdown(): Promise<void> {
    const userMenu = this.page.locator((appConfig.selectors as any).userMenu).first();
    await expect(userMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }

  async clickLogoutButton(): Promise<void> {
    const userMenu = this.page.locator((appConfig.selectors as any).userMenu).first();
    const logoutCandidates = [
      userMenu.getByRole('menuitem', { name: /logout|log out/i }).first(),
      userMenu.getByRole('button', { name: /logout|log out/i }).first(),
      this.page.getByRole('menuitem', { name: /logout|log out/i }).first(),
      this.page.getByRole('button', { name: /logout|log out/i }).first(),
      this.page.locator((appConfig.selectors as any).logoutButton).first(),
    ];

    for (const candidate of logoutCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        return;
      }
    }

    throw new Error('Logout option was not visible after opening the user menu.');
  }

  async verifyLoggedOut(): Promise<void> {
    // Wait for redirect to login page after logout
    await this.page.waitForURL(new RegExp(appConfig.loginUrl), { timeout: SEND_CODE_TIMEOUT });
    await expect(this.page).toHaveURL(new RegExp(appConfig.loginUrl));
    
    // Verify login form is visible
    const emailInput = this.page.locator(appConfig.selectors.emailInput).first();
    await expect(emailInput).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }

  async loginAsRole(roleEmail: string): Promise<void> {
    await this.openLoginPage();
    await this.enterEmail(roleEmail);
    await this.requestOtp();
    await this.submitOtp();
    await this.verifyRedirectToDashboard();
  }

  async verifyInvestigationsMenuVisible(): Promise<void> {
    const investigationsMenu = this.page.locator((appConfig.selectors as any).investigationsMenu).first();
    await expect(investigationsMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }

  async verifyAdminMenuNotVisible(): Promise<void> {
    const adminMenu = this.page.locator((appConfig.selectors as any).adminMenu).first();
    const isVisible = await adminMenu.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  }

  async verifyAdminMenuVisible(): Promise<void> {
    const adminMenu = this.page.locator((appConfig.selectors as any).adminMenu).first();
    await expect(adminMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }
}
