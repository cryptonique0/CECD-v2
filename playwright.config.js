// playwright.config.js
// Playwright E2E test config

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__integration_tests__',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
