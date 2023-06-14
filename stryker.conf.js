const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  disableTypeChecks: false,
  mutate: ["src/site/_includes/js/eligibility.js"],
  timeoutMS: 15000,
};

module.exports = config;
