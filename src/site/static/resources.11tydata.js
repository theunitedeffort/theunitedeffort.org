const {AssetCache} = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async () => {
  const data = [];
  const table = base('tblyp7AurXeZEIW4J'); // Resources table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        // TODO: Remove this context check after migration from
        // public assistance programs to resources is complete.
        // This check exists so we can view a development
        // version of the site with all the newly-migrated resources
        // but still hide them from the production site.
        if (process.env.CONTEXT !== 'production' ||
            record.get('Show on website')) {
          data.push(record.fields);
        }
      });
      return data;
    });
};


module.exports = async function() {
  const asset = new AssetCache('airtable_resources');
  if (asset.isCacheValid('1h')) {
    console.log('Using cached resources.');
    return await asset.getCachedValue();
  }
  console.log('Fetching resources.');
  const res = await fetchDataFromAirtable();
  const ret = {resources: res};
  await asset.save(ret, 'json');
  return ret;
};
