export type AppConfig = {
  envName: string;
  loginUrl: string;
  postLoginPath: string;
  userEmail: string;
  investigatorEmail?: string;
  sessionTimeoutMs?: number;
};

export const configINVHUBQA: AppConfig = {
  envName: 'INVHUB_QA',
  loginUrl: process.env.LOGIN_URL?.trim() || 'https://qa.invhub.fseng.net/login',
  postLoginPath: '/investigation/open-investigations',
  userEmail: process.env.TEST_USER_EMAIL?.trim() || '',
  investigatorEmail: process.env.INVESTIGATOR_EMAIL?.trim() || process.env.TEST_USER_EMAIL?.trim() || '',
  sessionTimeoutMs: Number.parseInt(process.env.SESSION_TIMEOUT_MS?.trim() || '900000', 10),
};
