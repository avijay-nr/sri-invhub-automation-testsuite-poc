import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { testSettings } from './tests/configFiles/config';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 0,
  workers: 1, // Run tests sequentially (one by one), not in parallel
  reporter: 'html',
  use: {
    baseURL: process.env.env_url?.trim() || testSettings.envUrl,
    headless: true,
    trace: 'retain-on-failure',
  }
});
