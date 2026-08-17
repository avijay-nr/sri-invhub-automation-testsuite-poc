import { expect, test, type Page } from '@playwright/test';
import { appConfig, testSettings } from '../../configFiles/config';
import { resolveOtpOrThrow } from '../../utils/otp';

const authSelectors = {
  emailInput: 'input[placeholder="Email"]',
  sendCodeButton: 'button:has-text("Send verification code")',
  otpInput: 'input[placeholder*="verification" i], input[placeholder="000000"], input[placeholder*="otp" i], input[name*="otp" i], input[id*="otp" i]',
  verifyButton: 'button:has-text("Verify")',
  adminSection: 'a[href*="/admin"], button:has-text("Admin")',
  dashboardButton: 'button:has-text("Investigation Queue"), button:has-text("Dashboard"), button:has-text("Home"), a[href*="/investigation"]',
  investigationsMenu: 'a[href*="/investigation"], button:has-text("Investigations"), button:has-text("Investigation Queue"), [role="menuitem"]:has-text("Investigations")',
  adminMenu: 'a[href*="/admin"], button:has-text("Admin"), [role="menuitem"]:has-text("Admin")',
  userProfileIcon: 'header button:last-of-type, nav button:last-of-type, [role="navigation"] button:last-of-type, button[class*="user"], button[class*="profile"], [class*="header"] button:not([class*="menu"])',
  userMenu: '[role="menu"], [role="menuitem"], [class*="dropdown"], [class*="menu"]',
  logoutButton: 'button:has-text("Logout"), button:has-text("Log out"), button:has-text("logout"), a:has-text("Logout"), a:has-text("Log out"), div:has-text("Logout"), [class*="logout"]',
  invalidCredentialsMessage: '[role="alert"], [data-testid*="error" i], .alert, .error, [class*="error" i]',
};

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

    await expect(this.page.locator(authSelectors.emailInput)).toBeVisible({
      timeout: EMAIL_INPUT_TIMEOUT,
    });
  }

  async verifyLoginPageDisplayed(): Promise<void> {
    const emailInput = this.page.locator(authSelectors.emailInput).first();
    const sendCodeButton = this.page.locator(authSelectors.sendCodeButton).first();
    await expect(emailInput).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
    await expect(sendCodeButton).toBeVisible({ timeout: SEND_CODE_TIMEOUT });
  }

  async enterEmail(email: string): Promise<void> {
    const emailInput = this.page.locator(authSelectors.emailInput).first();
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
    await this.page.locator(authSelectors.sendCodeButton).click();

    const otpInput = this.page.locator(authSelectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
  }

  async verifyOtpInputReady(): Promise<void> {
    const otpInput = this.page.locator(authSelectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
    const isEnabled = await otpInput.isEnabled();
    expect(isEnabled).toBe(true);
  }

  async submitOtp(): Promise<void> {
    const otpInput = this.page.locator(authSelectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });

    if (this.otpRequestedAtIso) {
      process.env.OTP_NOT_BEFORE_ISO = this.otpRequestedAtIso;
    }
    const otp = await resolveOtpOrThrow();

    await otpInput.fill(otp);
    await this.page.locator(authSelectors.verifyButton).click();
  }

  async verifyRedirectToDashboard(): Promise<void> {
    await this.page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: OTP_VERIFY_TIMEOUT });
    await expect(this.page).toHaveURL(new RegExp(`${appConfig.postLoginPath}.*$`));
    await this.page.waitForTimeout(DASHBOARD_LOAD_TIMEOUT);
  }

  async verifyDashboardElementsVisible(): Promise<void> {
    const dashboardElement = this.page.locator(authSelectors.dashboardButton).first();
    const adminElement = this.page.locator(authSelectors.adminSection).first();

    const dashboardVisible = await dashboardElement.isVisible().catch(() => false);
    const adminVisible = await adminElement.isVisible().catch(() => false);

    expect(dashboardVisible || adminVisible).toBe(true);
  }

  async submitWrongOtp(wrongOtp: string): Promise<void> {
    const otpInput = this.page.locator(authSelectors.otpInput).first();
    await expect(otpInput).toBeVisible({ timeout: OTP_INPUT_TIMEOUT });
    await otpInput.fill(wrongOtp);
    await this.page.locator(authSelectors.verifyButton).click();
  }

  async verifyErrorMessageDisplayed(): Promise<void> {
    const errorMessage = this.page.locator(authSelectors.invalidCredentialsMessage).first();
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
    const dashboardElement = this.page.locator(authSelectors.dashboardButton).first();
    const isOnDashboard = currentUrl.includes(appConfig.postLoginPath);
    const isDashboardVisible = await dashboardElement.isVisible().catch(() => false);
    return isOnDashboard || isDashboardVisible;
  }

  async verifyAdminSectionAccessible(): Promise<boolean> {
    const adminButton = this.page.locator(authSelectors.adminSection).first();
    return await adminButton.isVisible().catch(() => false);
  }

  async verifyNotOnLoginPage(): Promise<void> {
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain(appConfig.loginUrl);
  }

async clickUserProfileIcon(): Promise<void> {
  const email = appConfig.userEmail?.trim() || '';
  const userNamePart = email.split('@')[0] || '';

  // ✅ Wait for sidebar to fully render after fresh login
  await this.page.locator('button, [role="button"]').filter({
    hasText: new RegExp(userNamePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  }).first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});

  const emailRegex = email ? new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const candidateIcons = [
    emailRegex ? this.page.getByRole('button', { name: emailRegex }).first() : null,
    this.page.locator('button').filter({ hasText: new RegExp(userNamePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first(),
    this.page.locator('[role="complementary"] button:has-text("@")').first(),
    this.page.locator('[role="complementary"] [role="button"]').filter({ hasText: /@/ }).first(),
    this.page.locator(authSelectors.userProfileIcon).first(),
  ].filter(Boolean) as Array<ReturnType<Page['locator']>>;

  for (const candidate of candidateIcons) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      await this.page.waitForTimeout(1_000);
      return;
    }
  }
  throw new Error('Unable to find the user profile/login icon in the sidebar.');
}

  async verifyUserMenuDropdown(): Promise<void> {
    const userMenu = this.page.locator(authSelectors.userMenu).first();
    await expect(userMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }

async clickLogoutButton(): Promise<void> {
  await this.page.waitForTimeout(1_500);

  // ✅ Zoom out to 67% so full sidebar fits on screen
  await this.page.evaluate(() => {
    document.body.style.zoom = '0.67';
  });

  await this.page.waitForTimeout(500);

  // Step 1: Exact text match
  const logoutLink = this.page.getByText('Logout', { exact: true }).first();
  if (await logoutLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await logoutLink.click();
    // ✅ Restore zoom after click
    await this.page.evaluate(() => { document.body.style.zoom = '1'; });
    return;
  }

  // Step 2: JS force-click fallback
  const clicked = await this.page.evaluate(() => {
    const el = [...document.querySelectorAll('a, button, li, div, span')]
      .find(e => e.textContent?.trim() === 'Logout');
    if (el) {
      (el as HTMLElement).click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await this.page.evaluate(() => { document.body.style.zoom = '1'; });
    return;
  }

  // Step 3: Playwright fallback
  const logoutCandidates = [
    this.page.getByRole('menuitem', { name: /logout|log\s*out|sign\s*out/i }).first(),
    this.page.getByRole('button', { name: /logout|log\s*out|sign\s*out/i }).first(),
    this.page.locator(authSelectors.logoutButton).first(),
  ];

  for (const candidate of logoutCandidates) {
    if (await candidate.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await candidate.click({ force: true });
      await this.page.evaluate(() => { document.body.style.zoom = '1'; });
      return;
    }
  }

  const bodyText = await this.page.locator('body').textContent().catch(() => '');
  throw new Error(
    `Logout option was not visible after all attempts.\nPage text (first 500 chars): "${bodyText?.slice(0, 500)}"`
  );
}

  async verifyLoggedOut(): Promise<void> {
    // Wait for redirect to login page after logout
    await this.page.waitForURL(new RegExp(appConfig.loginUrl), { timeout: SEND_CODE_TIMEOUT });
    await expect(this.page).toHaveURL(new RegExp(appConfig.loginUrl));
    
    // Verify login form is visible
    const emailInput = this.page.locator(authSelectors.emailInput).first();
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
    const investigationsMenu = this.page.locator(authSelectors.investigationsMenu).first();
    await expect(investigationsMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }

  async verifyAdminMenuNotVisible(): Promise<void> {
    const adminMenu = this.page.locator(authSelectors.adminMenu).first();
    const isVisible = await adminMenu.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  }

  async verifyAdminMenuVisible(): Promise<void> {
    const adminMenu = this.page.locator(authSelectors.adminMenu).first();
    await expect(adminMenu).toBeVisible({ timeout: EMAIL_INPUT_TIMEOUT });
  }
}
