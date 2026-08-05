import { configINVHUBQA, type AppConfig } from './config_INVHUB_QA';
import { configSRITEST } from './config_SRI_TEST';

const configMap: Record<string, AppConfig> = {
  INVHUB_QA: configINVHUBQA,
  SRI_TEST: configSRITEST,
};

const selectedConfigName = process.env.TEST_CONFIG?.trim() || 'INVHUB_QA';
const selectedConfig = configMap[selectedConfigName];

if (!selectedConfig) {
  const availableConfigs = Object.keys(configMap).join(', ');
  throw new Error(
    `Unsupported TEST_CONFIG: ${selectedConfigName}. Supported values: ${availableConfigs}`,
  );
}

export const appConfig: AppConfig = selectedConfig;
