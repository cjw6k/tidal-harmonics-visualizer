import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for animation capture
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single worker for deterministic capture
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173/tidal-harmonics-visualizer/',
    trace: 'on-first-retry',
    video: 'off', // We capture frames manually
    screenshot: 'off', // We capture frames manually
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/tidal-harmonics-visualizer/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
