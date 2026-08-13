import { configINVHUBQA, type AppConfig } from './config_INVHUB_QA';
import { configSRITEST } from './config_SRI_TEST';

export const testSettings = {
  testConfig: 'SRI_TEST',
  envUrl: 'https://ih-sri-test.symphonyai.dev',
  loginUrl: 'https://ih-sri-test.symphonyai.dev/login',
  testUserEmail: 'sanchit.argade@symphonyai.com',
  loginTestTimeoutMs: 180000,
  adminTestTimeoutMs: 180000,
  adminQueueRule: 'Round Robin',
  adminQueueNamePrefix: 'AutoQueue',
  adminTeamNamePrefix: 'AutoTeam',
  adminTagNamePrefix: 'AutoTag',
  adminConfigExpectedSections: ['Currency', 'Date Formats', 'Transactions Lookback Period'],
  adminConfigMinSectionMatch: 2,
  adminWorkflowExpectedStages: ['Actions', 'Precondition', 'Make Decision Template'],
  adminWorkflowScanLimit: 8,
  otpFetchCommand: 'powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\get-otp.ps1',
  otpRegex: '(\\d{6})',
  otpFetchTimeoutSec: 90,
  otpFetchPollSec: 3,
} as const;

const configMap: Record<string, AppConfig> = {
  INVHUB_QA: configINVHUBQA,
  SRI_TEST: configSRITEST,
};

const selectedConfigName = process.env.TEST_CONFIG?.trim() || testSettings.testConfig;
const selectedConfig = configMap[selectedConfigName];

if (!selectedConfig) {
  const availableConfigs = Object.keys(configMap).join(', ');
  throw new Error(
    `Unsupported TEST_CONFIG: ${selectedConfigName}. Supported values: ${availableConfigs}`,
  );
}

selectedConfig.loginUrl = process.env.LOGIN_URL?.trim() || testSettings.loginUrl;
selectedConfig.userEmail = process.env.TEST_USER_EMAIL?.trim() || testSettings.testUserEmail;

export const appConfig: AppConfig = selectedConfig;
