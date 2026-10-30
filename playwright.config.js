const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 45000,
  use: { baseURL: "http://127.0.0.1:3040", headless: true, trace: "retain-on-failure" },
  webServer: {
    command: "node server/tests/browserServer.js",
    url: "http://127.0.0.1:3040/api",
    timeout: 120000,
    reuseExistingServer: false,
  },
});
