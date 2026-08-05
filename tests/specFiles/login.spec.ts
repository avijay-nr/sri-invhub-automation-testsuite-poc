import { test } from '@playwright/test';
import { appConfig } from '../configFiles/config';
import { LoginDef } from '../definitionFiles/loginDef';

test(`simple login smoke - ${appConfig.envName}`, async ({ page }) => {
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
