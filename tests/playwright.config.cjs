const { defineConfig } = require('@playwright/test');

const targets = {
  local: 'http://127.0.0.1:4173/',
  published: 'https://rrazx7-bit.github.io/-rrazx7-bit-ui-ux_programing_project_/'
};

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'responsive.spec.cjs',
  timeout: 45000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    locale: 'ko-KR',
    deviceScaleFactor: 1,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: Object.entries(targets).flatMap(([target, baseURL]) =>
    [1100, 769, 768, 390].map(width => ({
      name: `${target}-${width}`,
      use: { baseURL, viewport: { width, height: 900 } }
    }))
  ),
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory ..',
    url: targets.local,
    reuseExistingServer: false
  }
});
