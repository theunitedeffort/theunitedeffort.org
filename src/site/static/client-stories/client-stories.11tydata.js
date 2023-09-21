const {AssetCache} = require('@11ty/eleventy-fetch');
const Image = require("@11ty/eleventy-img");
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);


// Fetch the list of stories from the Airtable API.
const fetchStories = async () => {
  const data = [];
  const table = base('tblD0j9sZoGc41MSQ'); // Client stories table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        if (record.get('Status') == 'Published') {
          data.push(record.fields);
        }
      });
      return data;
    });
};


module.exports = async function() {
  const asset = new AssetCache('airtable_stories');
  if (asset.isCacheValid('1h')) {
    console.log('Returning cached stories data.');
    return await asset.getCachedValue();
  }
  console.log('Fetching stories.');
  const storyList = await fetchStories();
  for (const story of storyList) {
    if (story['Photo'] && story['Photo'].length > 0) {
      const stats = await Image(story['Photo'][0].url, {
        widths: [500, 200],
        urlPath: "/images/",
        outputDir: "./dist/images/",
      });
      story.image = stats.jpeg[1];
      story.thumb = stats.jpeg[0];
    }
  }
  const ret = {stories: storyList};
  await asset.save(ret, 'json');
  return ret;
};
