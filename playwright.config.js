// @ts-check
const { defineConfig } = require('@playwright/test');

// No build step to run — this just serves the static site exactly the way
// it's been served by hand all through this project's history and points
// Playwright at it. See PROJECT_STATE.md's "Module dependency notes": the
// app must be served over http(s)://, not opened via file://, since it uses
// native ES modules.
module.exports = defineConfig({
  testDir: './tests',
  // Deliberately serial, not fullyParallel. Confirmed by testing: running
  // all 7 specs in parallel (the default 7 workers) against `python -m
  // http.server` intermittently failed several tests under simple resource
  // contention (multiple real-time game-loop tests, e.g. Neon Arena's 20s
  // round, competing for CPU) even though each one passes reliably alone.
  // This suite is small enough that serial execution costs under a minute —
  // reliability matters far more here than shaving that time off.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8934',
    viewport: { width: 1600, height: 1000 },
  },
  webServer: {
    command: 'python -m http.server 8934',
    url: 'http://localhost:8934',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
    stdout: 'ignore', // python's http.server logs every single asset request — noisy, not useful here
  },
});
