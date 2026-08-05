import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: process.env.env_url?.trim(),
    headless: true,
    trace: 'retain-on-failure',
  }
});
