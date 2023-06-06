const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "yfze3r",
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: false,
  },
});
