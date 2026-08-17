import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { testSettings } from './tests/configFiles/config';

dotenv.config();

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
        channel: 'chrome',
        storageState: './auth/session.json',
        viewport: null,
      },
    },
  ],
});