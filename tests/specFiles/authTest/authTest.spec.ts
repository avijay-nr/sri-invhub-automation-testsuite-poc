import { test, expect } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { AuthLoginDef } from '../../definitionFiles/authTestDef/authLoginDef';
import { LoginDef } from '../../definitionFiles/loginTestDef/loginTestDef';

// ✅ Add this at the top (after imports)
test.afterEach(async ({ page }) => {
  const loginDef = new LoginDef(page);
  await loginDef.saveFinalTokens();
});

// TC-AUTH-001: Valid Login with SSO
// ✅ INTENTIONAL OTP — this test IS testing the login flow
test(`Valid Login with SSO - ${appConfig.envName} @auth @smoke @regression @auth_TC0001`, async ({ page }) => {
  const authLoginDef = new AuthLoginDef(page);
  await test.step('Step 1: Navigate to application URL', async () => {
    await authLoginDef.openLoginPage();
    await expect(page).toHaveURL(new RegExp(appConfig.loginUrl));
  });
  await test.step('Step 2: Verify login page displayed', async () => {
    await authLoginDef.verifyLoginPageDisplayed();
  });
  await test.step('Step 3: Enter username (email)', async () => {
    await authLoginDef.enterEmail(appConfig.userEmail);
  });
  await test.step('Step 4: Request authentication code (SSO/OTP)', async () => {
    await authLoginDef.requestOtp();
  });
  await test.step('Step 5: Verify OTP input field is visible and ready', async () => {
    await authLoginDef.verifyOtpInputReady();
  });
  await test.step('Step 6: Enter authentication code and click verify', async () => {
    await authLoginDef.submitOtp();
  });
  await test.step('Step 7: Verify redirect to dashboard/home page', async () => {
    await authLoginDef.verifyRedirectToDashboard();
  });
  await test.step('Step 8: Verify dashboard/home page elements are visible', async () => {
    await authLoginDef.verifyDashboardElementsVisible();
  });
});

// TC-AUTH-002: Invalid Login - Wrong OTP
// ✅ INTENTIONAL OTP — this test IS testing wrong OTP behavior
test(`Invalid Login - Wrong OTP - ${appConfig.envName} @auth @regression @auth_TC0002`, async ({ page }) => {
  const authLoginDef = new AuthLoginDef(page);
  await test.step('Step 1: Navigate to login page', async () => {
    await authLoginDef.openLoginPage();
    await expect(page).toHaveURL(new RegExp(appConfig.loginUrl));
  });
  await test.step('Step 2: Enter valid username', async () => {
    await authLoginDef.enterEmail(appConfig.userEmail);
  });
  await test.step('Step 3: Request authentication code', async () => {
    await authLoginDef.requestOtp();
  });
  await test.step('Step 4: Enter wrong OTP code', async () => {
    const wrongOtp = '000000';
    await authLoginDef.submitWrongOtp(wrongOtp);
  });
  await test.step('Step 5: Verify error message', async () => {
    await authLoginDef.verifyErrorMessageDisplayed();
  });
});

// TC-AUTH-003: Session Timeout
// ✅ Uses loginIfNeeded() — no OTP needed, just needs to be logged in
test(`Session Timeout - ${appConfig.envName} @auth @regression @auth_TC0003`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  const authLoginDef = new AuthLoginDef(page);
  await test.step('Step 1: Login and verify session is active', async () => {
    await loginDef.loginIfNeeded();
    expect(await authLoginDef.verifyDashboardAccessible()).toBe(true);
  });
  await test.step('Step 2: Remain idle and reload page', async () => {
    await authLoginDef.remainIdleAndReload();
  });
  await test.step('Step 3: Verify session is still active after reload', async () => {
    expect(await authLoginDef.verifyDashboardAccessible()).toBe(true);
  });
  await test.step('Step 4: Verify can still perform actions while session active', async () => {
    const isAdminVisible = await authLoginDef.verifyAdminSectionAccessible();
    if (isAdminVisible) {
      await page.getByRole('button', { name: /^admin$/i }).first().click().catch(() => {});
    }
    await authLoginDef.verifyNotOnLoginPage();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-AUTH-004: Logout
// ⚠️ ISOLATED — uses its own fresh browser context with NO shared storageState
// This prevents the logout from invalidating the session for ALL tests after it
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TC-AUTH-004 - isolated logout context', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // ← fresh context, no shared session

  test(`Logout - ${appConfig.envName} @auth @smoke @regression @auth_TC0004`, async ({ page }) => {
    const loginDef = new LoginDef(page);
    const authLoginDef = new AuthLoginDef(page);
    await test.step('Step 1: Login and verify logged in', async () => {
      // Full OTP login required here — isolated context has no session
      await loginDef.openLoginPage();
      await loginDef.requestOtpForConfiguredUser();
      await loginDef.submitOtpAndVerify();
      await loginDef.verifyRedirectToApplicationUi();
    });
    await test.step('Step 2: Click user profile/avatar icon', async () => {
      await authLoginDef.clickUserProfileIcon();
    });
    await test.step('Step 3: Click Logout option', async () => {
      await authLoginDef.clickLogoutButton();
    });
    await test.step('Step 4: Verify redirect to login page', async () => {
      await authLoginDef.verifyLoggedOut();
    });
  });
});

// TC-AUTH-005: Role-Based Access Control
// ✅ Uses loginIfNeeded() — no OTP needed, just needs to be logged in
test(`Role-Based Access Control - Verify Admin Access - ${appConfig.envName} @auth @smoke @regression @auth_TC0005`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  const authLoginDef = new AuthLoginDef(page);
  await test.step('Step 1: Login as user with Admin role', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Step 2: Verify dashboard loads', async () => {
    await expect(page).toHaveURL(new RegExp(appConfig.postLoginPath));
  });
  await test.step('Step 3: Verify Investigations menu is visible', async () => {
    await authLoginDef.verifyInvestigationsMenuVisible();
  });
  await test.step('Step 4: Verify Admin menu is visible for Admin role', async () => {
    await authLoginDef.verifyAdminMenuVisible();
  });
});