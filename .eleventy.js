const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

module.exports = function(eleventyConfig) {


  return {
    dir: {
      input: "src",
      output: "dist"
    }
  }
};