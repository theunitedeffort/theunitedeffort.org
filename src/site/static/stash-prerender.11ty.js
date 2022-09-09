exports.data = function() {
  return {
    permalink: "./_generated-serverless-collections.json",
    permalinkBypassOutputDir: true,
    layout: false,
    eleventyExcludeFromCollections: true,
  };
};

exports.render = function(data) {
  const entries = {};
  for(const entry of data.collections.prerender) {
    entries[entry.data.apartment.id] = entry.templateContent;
  }

  return JSON.stringify({housingListItems: entries});
};