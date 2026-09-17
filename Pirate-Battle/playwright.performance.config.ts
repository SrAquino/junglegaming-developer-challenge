import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PERFORMANCE_BASE_URL ?? 'http://127.0.0.1:4187'

export default defineConfig({
  testDir: './tests/performance',
  timeout: 210_000,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'docs/performance/playwright-report' }],
  ],
  outputDir: 'test-results/performance',
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: process.env.PERFORMANCE_BASE_URL ? undefined : {
    command: 'node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4187 --strictPort',
    url: 'http://127.0.0.1:4187',
    reuseExistingServer: false,
  },
})
