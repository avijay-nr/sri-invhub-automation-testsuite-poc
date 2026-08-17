import { type AppConfig } from './config_INVHUB_QA';

export const configSRITEST: AppConfig = {
  envName: 'SRI_TEST',
  loginUrl: 'https://ih-sri-dev.symphonyai.dev/login',
  postLoginPath: '/investigation/open-investigations',
  userEmail: '',
  investigatorEmail: process.env.INVESTIGATOR_EMAIL?.trim() || process.env.TEST_USER_EMAIL?.trim() || '',
  sessionTimeoutMs: Number.parseInt(process.env.SESSION_TIMEOUT_MS?.trim() || '900000', 10),
};
