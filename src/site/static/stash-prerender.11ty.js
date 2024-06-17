exports.data = function() {
  return {
    permalink: './_generated-serverless-collections.json',
    permalinkBypassOutputDir: true,
    layout: false,
    eleventyExcludeFromCollections: true,
  };
};

exports.render = function(data) {
  const housingEntries = {};
  for (const entry of data.collections.prerenderHousing) {
    const snippets = entry.templateContent.split('${BADGES}');
    housingEntries[entry.data.apartment.id] = {
      'heading': snippets[0], 'contacts': snippets[1],
    };
  }

  return JSON.stringify({
    housingListItems: housingEntries,
  });
};
