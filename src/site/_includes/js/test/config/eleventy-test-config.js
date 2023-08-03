module.exports = function(eleventyConfig) {
  // Pull in custom filters and shortcodes.
  eleventyConfig.addPlugin(
    require('../../../../../config/eleventy-base-config.js'));

  return {
    dir: {
      input: 'src/site/static/benefits-eligibility',
      output: 'test/dist',
      includes: '../../_includes',
    },
  };
};
