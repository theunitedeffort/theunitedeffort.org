const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "yfze3r",
  e2e: {
    baseUrl: 'http://localhost:8888',
    setupNodeEvents(on, config) {
      // https://www.ryanjyost.com/advanced-cypress-tips/
      on(`task`, {
        error(message) {
          console.error("\x1b[31m", "ERROR:", message, "\x1b[0m");
          return null;
        },
        warn(message) {
          console.warn("\x1b[33m", "WARNING:", message, "\x1b[0m");
          return null;
        },
      });
    },
  },
});
