import { test, expect } from '@playwright/test';
import { appConfig, testSettings } from '../tests/configFiles/config';
import { resolveOtpOrThrow } from '../tests/utils/otp';
import * as fs from 'fs';

const authSelectors = {
  emailInput: 'input[placeholder="Email"]',
  sendCodeButton: 'button:has-text("Send verification code")',
  otpInput: 'input[placeholder*="verification" i], input[placeholder="000000"], input[placeholder*="otp" i], input[name*="otp" i], input[id*="otp" i]',
  verifyButton: 'button:has-text("Verify")',
};

const sessionFile = './auth/session.json';

test.setTimeout(testSettings.loginTestTimeoutMs || 180_000);

test('login and save session', async ({ browser }) => {

  // ✅ Step 1: Check if existing session is still valid
  if (fs.existsSync(sessionFile)) {
    console.log('Session file exists. Checking if still valid...');

    const context = await browser.newContext({ storageState: sessionFile });
    const page = await context.newPage();

    try {
      await page.goto(appConfig.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      // If we land on the app (not login page), session is still good!
      await page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: 15_000 });
      console.log('✅ Existing session is still valid — skipping OTP login!');
      await context.close();
      return; // ← EXIT EARLY, no OTP needed!
    } catch {
      console.log('⚠️ Session expired. Performing fresh login...');
      await context.close();
    }
  }

  // ✅ Step 2: Fresh login (only if session expired/missing)
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(appConfig.loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  } catch {
    await page.goto(appConfig.loginUrl, { waitUntil: 'commit', timeout: 45_000 });
  }
  await expect(page.locator(authSelectors.emailInput)).toBeVisible({ timeout: 30_000 });

  // Enter email
  await page.locator(authSelectors.emailInput).fill(appConfig.userEmail!);

  // Click send OTP
  const otpRequestedAt = new Date().toISOString();
  await page.locator(authSelectors.sendCodeButton).click();

  // Wait for OTP input
  const otpInput = page.locator(authSelectors.otpInput).first();
  await expect(otpInput).toBeVisible({ timeout: 30_000 });

  // Fetch & submit OTP
  process.env.OTP_NOT_BEFORE_ISO = otpRequestedAt;
  const otp = await resolveOtpOrThrow();
  await otpInput.fill(otp);
  await page.locator(authSelectors.verifyButton).click();

  // Wait for redirect
  await page.waitForURL(`**${appConfig.postLoginPath}*`, { timeout: 150_000 });
  await page.waitForTimeout(5_000);

  // Save session
  await context.storageState({ path: sessionFile });
  console.log('✅ Fresh session saved to:', sessionFile);
  await context.close();
});