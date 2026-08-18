import { test } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { LoginDef } from '../../definitionFiles/loginTestDef/loginTestDef';

// ✅ Add after imports
test.afterEach(async ({ page }) => {
  const loginDef = new LoginDef(page);
  await loginDef.saveFinalTokens();
});

// ✅ This test IS testing the login flow — OTP steps are intentional
test(`Simple Login Smoke Test - ${appConfig.envName} @login @smoke @regression @login_TC0001`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  await test.step('Open login page', async () => {
    await loginDef.openLoginPage();
  });
  await test.step('Request OTP for configured user', async () => {
    await loginDef.requestOtpForConfiguredUser();
  });
  await test.step('Submit OTP and verify login', async () => {
    await loginDef.submitOtpAndVerify();
  });
  await test.step('Validate redirect to application UI', async () => {
    await loginDef.verifyRedirectToApplicationUi();
  });
});