module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(require("./eleventy-base-config.js"));

  return {
    dir: {
      input: "src/site/static/eligibility.liquid",
      output: "test/dist",
      includes: "../_includes"
    }
  }
};