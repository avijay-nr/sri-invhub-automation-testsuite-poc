import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { testSettings } from './tests/configFiles/config';

dotenv.config();

// ✅ Per-environment session file
const env = process.env.TEST_ENV || 'QA-Dev';
const sessionFile = `./auth/session-${env}.json`;

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,        
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.env_url?.trim() || testSettings.envUrl,
    headless: true,
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized']
    }
  },

  projects: [
    {
      name: 'setup',
      testDir: './auth',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'tests',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: sessionFile,   // ✅ dynamic per env!
        viewport: null,
      },
    },
  ],
});