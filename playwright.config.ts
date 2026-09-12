import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Audio rendering makes these tests heavy; more parallel browsers than this starve the Firefox driver.
  workers: 2,
  reporter: [['list']],
  use: { baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/rc-audio-lab/', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'npm run preview -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/rc-audio-lab/', reuseExistingServer: !process.env.CI },
})
