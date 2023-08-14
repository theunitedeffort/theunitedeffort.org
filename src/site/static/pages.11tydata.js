const {AssetCache} = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);


const fetchSection = (id) => {
  const table = base('tblAkC6dlPJc4o0Je'); // sections table
  return table.find(id).then((record) => {
    // console.log(`CONTENT`, id, record.get("Content"));
    if (record.get('Type') == 'Markdown page') {
      return record.get('Markdown');
    } else {
      return record.get('Content');
    }
  });
};


// Fetch content for our pages from Airtable
const fetchPages = async () => {
  const pages = [];
  const data = [];
  const table = base('tblTqhITQfO1MJQaE'); // Structured pages table

  return table.select({
    view: 'API page content',
  })
    .all()
    .then(async (records) => {
      for (const record of records) {
        // Temporarily ignore the public assistance index page during content
        // migration.
        // TODO: After migration, delete /public-assistance Airtable record,
        // then remove this special handling.
        if (record.get('Page path') === '/public-assistance') {
          continue;
        }
        if (record.get('Status') == 'Published') {
          const name = record.get('Page title');
          const path = record.get('Page path');
          const sectionID = record.get('Section')[0];
          const content = await fetchSection(sectionID);

          if (!data[name]) {
            data[name] = {
              url: path,
              sections: [],
              name: name,
            };
          }

          data[name].sections.push({
            type: record.get('Type')[0].replace(' ', '-'),
            content: content,
          });
        }
      }

      // Collect each page array into our pages array
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const element = data[key];
          pages.push(element);
        }
      }

      return pages;
    });
};

// Fetch the list of general resources from the Airtable API.
const fetchGeneralResources = async () => {
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
  const asset = new AssetCache('airtable_pages');
  if (asset.isCacheValid('1h')) {
    console.log('Returning cached pages data.');
    return await asset.getCachedValue();
  }
  console.log('Fetching pages.');
  const [pageList, resourceList] = await Promise.all(
    [fetchPages(), fetchGeneralResources()]);
  const ret = {pages: pageList, partialsData: {resources: resourceList}};
  await asset.save(ret, 'json');
  return ret;
};
