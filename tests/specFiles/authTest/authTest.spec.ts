import { test, expect } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { AuthLoginDef } from '../../definitionFiles/authTestDef/authLoginDef';

// TC-AUTH-001: Valid Login with SSO
test(`TC-AUTH-001: Valid Login with SSO - ${appConfig.envName}`, async ({ page }) => {
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
test(`TC-AUTH-002: Invalid Login - Wrong OTP - ${appConfig.envName}`, async ({ page }) => {
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


test(`TC-AUTH-003: Session Timeout - ${appConfig.envName}`, async ({ page }) => {
  const authLoginDef = new AuthLoginDef(page);

  await test.step('Step 1: Login and verify session is active', async () => {
    await authLoginDef.openLoginPage();
    await authLoginDef.enterEmail(appConfig.userEmail);
    await authLoginDef.requestOtp();
    await authLoginDef.submitOtp();
    await authLoginDef.verifyRedirectToDashboard();
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
      await page.locator(appConfig.selectors.adminSection).first().click().catch(() => {});
    }
    await authLoginDef.verifyNotOnLoginPage();
  });
});

// TC-AUTH-004
test(`TC-AUTH-004: Logout - ${appConfig.envName}`, async ({ page }) => {
  const authLoginDef = new AuthLoginDef(page);

  await test.step('Step 1: Login and verify logged in', async () => {
    await authLoginDef.openLoginPage();
    await authLoginDef.enterEmail(appConfig.userEmail);
    await authLoginDef.requestOtp();
    await authLoginDef.submitOtp();
    await authLoginDef.verifyRedirectToDashboard();
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

// TC-AUTH-005: Role-Based Access Control
test(`TC-AUTH-005: Role-Based Access Control - Verify Admin Access - ${appConfig.envName}`, async ({ page }) => {
  const authLoginDef = new AuthLoginDef(page);

  await test.step('Step 1: Login as user with Admin role', async () => {
    const userEmail = (appConfig as any).investigatorEmail || appConfig.userEmail;
    if (!userEmail) {
      throw new Error('INVESTIGATOR_EMAIL or TEST_USER_EMAIL must be set in .env');
    }
    
    await authLoginDef.loginAsRole(userEmail);
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
