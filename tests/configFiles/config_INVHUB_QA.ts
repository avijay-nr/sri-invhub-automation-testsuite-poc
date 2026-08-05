export type AppConfig = {
  envName: string;
  loginUrl: string;
  postLoginPath: string;
  userEmail: string;
  selectors: {
    emailInput: string;
    sendCodeButton: string;
    otpInput: string;
    verifyButton: string;
  };
};

export const configINVHUBQA: AppConfig = {
  envName: 'INVHUB_QA',
  loginUrl: process.env.LOGIN_URL?.trim() || 'https://qa.invhub.fseng.net/login',
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
