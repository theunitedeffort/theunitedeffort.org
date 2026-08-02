const eleventyFetch = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const GLOSSARY_TABLE = 'tblTVtBsMxCNoUIAB';

const fetchGlossary = async () => {
  console.log('Fetching glossary');
  const dataMap = {};
  const table = base(GLOSSARY_TABLE);
  return table.select({
    view: 'API list all',
    sort: [{field: 'Term'}],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        const term = record.get('Term');
        if (term === null) {
          return;
        }
        const slug = term.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        dataMap[record.getId()] = {
          term: term,
          slug: slug,
          definition: record.get('Definition') || "",
          caseSensitive: record.get('Term is case sensitive'),
          synonyms: record.get('Synonyms') || [],
          synonymOf: record.get('Synonym of'),
        };
      });
    const data = [];
    for (const [id, entry] of Object.entries(dataMap)) {
      // Put synonyms within main glossary entries and ignore terms that
      // are synonyms of other terms.
      if (entry.synonymOf) {
        continue;
      }
      entry.synonyms = entry.synonyms.map((id) => dataMap[id]);
      data.push(entry);
    }
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
  return eleventyFetch(fetchGlossary, {
    requestId: 'airtable_glossary',
    duration: '1h',
    type: 'json'
  });
};
