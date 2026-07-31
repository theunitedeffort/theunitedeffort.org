const eleventyFetch = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const GLOSSARY_TABLE = 'tblTVtBsMxCNoUIAB';

const fetchGlossary = async () => {
  const data = [];
  const table = base(GLOSSARY_TABLE);
  return table.select({
    view: 'API list all',
    sort: [{field: 'Term'}],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        const term = record.get('Term');
        if (term !== null) {
          const slug = term.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          data.push({
            term: term,
            slug: slug,
            definition: record.get('Definition'),
            caseSensitive: record.get('Term is case sensitive'),
          });
        }
      });
      return data;
    });
};

module.exports = async function() {
  // Only housing pages run serverless, so there is no need to fetch
  // all this content when this data file is executed from a serverless
  // environment.
  if (process.env.ELEVENTY_SERVERLESS) {
    return {};
  }
  const asset = new eleventyFetch.AssetCache('airtable_glossary');
  if (asset.isCacheValid('1m')) {
    return await asset.getCachedValue();
  }
  console.log('Fetching glossary');
  const glossary = await fetchGlossary();
  // console.log(JSON.stringify(glossary, null, 2));
  await asset.save(glossary, 'json');
  return glossary;
};
