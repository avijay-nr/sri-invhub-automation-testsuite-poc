import { type AppConfig } from './config_INVHUB_QA';

export const configSRITEST: AppConfig = {
  envName: 'SRI_TEST',
  loginUrl: process.env.LOGIN_URL?.trim() || 'https://ih-sri-test.symphonyai.dev/login',
  postLoginPath: '/investigation/open-investigations',
  userEmail: process.env.TEST_USER_EMAIL?.trim() || '',
  selectors: {
    emailInput: 'input[placeholder="Email"]',
    sendCodeButton: 'button:has-text("Send verification code")',
    otpInput:
      'input[placeholder*="verification" i], input[placeholder="000000"], input[placeholder*="otp" i], input[name*="otp" i], input[id*="otp" i]',
    verifyButton: 'button:has-text("Verify")',
  },
};
