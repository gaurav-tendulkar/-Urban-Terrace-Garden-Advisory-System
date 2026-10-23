const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  reporter: [
    ['list'],
    ['./tests/markdown-reporter.cjs'],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  outputDir: 'TEST_RESULTS/.artifacts',
  webServer: [
    {
      command: 'node backend/server.js',
      url: 'http://127.0.0.1:4317/health',
      reuseExistingServer: false,
      env: { PORT: '4317' },
      timeout: 30_000,
    },
    {
      command: 'npm run dev:frontend -- --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173/chat',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
