const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
// This requirement is somehow not propagated from affordable-housing.11tydata.js
// so include it here to be sure it makes it into the serverless bundle.
const EleventyFetch = require("@11ty/eleventy-fetch");


module.exports = function(eleventyConfig) {
  // Pull in custom filters and shortcodes.
  eleventyConfig.addPlugin(require("./src/config/eleventy-base-config.js"));

  // Pass through static assets and client-side js files.
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });
  eleventyConfig.addPassthroughCopy({ "src/site/_includes/js/*.js": "/js" });

  // Eleventy Serverless plugin
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless",
    functionsDir: "./netlify/functions/",
    copy: [
      "_generated-serverless-collections.json",
      // Files/directories that start with a dot
      // are not bundled by default.
      { from: ".cache", to: "cache" },
    ],
  });

  // Sass pipeline
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: function(contents, includePath) {
      let includePaths = [this.config.dir.includes];
      return () => {
        let ret = sass.renderSync({
          file: includePath,
          includePaths,
          data: contents,
          outputStyle: "compressed"
        });
        return ret.css.toString("utf8");
      }
    }
  });

  return {
    dir: {
      input: "src/site",
      output: "dist"
    }
  }
};