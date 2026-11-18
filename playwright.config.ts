import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:3000',
    channel: process.env.PLAYWRIGHT_CHANNEL
  }
})
