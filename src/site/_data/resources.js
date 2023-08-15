const {AssetCache} = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base('app1uIzz4pZe9IM21');

const RESOURCES_TABLE = 'tblHB03iabcT6uYQP';

// TODO: Move this into a shared location for housing.js and resources.js
// A group of checkboxes for filtering housing results.
function FilterSection(heading, name, options) {
  this.heading = heading;
  this.name = name;
  this.options = options;
}

// A single checkbox for filtering housing results.
function FilterCheckbox(name, label, selected) {
  this.name = name;
  this.label = label || name;
  this.selected = selected || false;
}

const fetchResourceRecords = async () => {
  const resources = [];
  const table = base(RESOURCES_TABLE);

  return table.select({
    fields: [
      'ID',
      'NAME',
      'ORGANIZATION',
      'CATEGORY',
      'ADDRESS',
      'CITY',
      'PHONE',
      'EMAIL',
      'URL',
    ],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        resources.push({
          id: record.get('ID'),
          name: record.get('NAME'),
          organization: record.get('ORGANIZATION'),
          categories: record.get('CATEGORY'),
          addresses: [record.get('ADDRESS')],
          city: record.get('CITY'),
          phones: [record.get('PHONE')],
          website: record.get('URL'),
          emails: [record.get('EMAIL')],
        });
      });
      return resources;
    });
};

const resourceData = async () => {
  console.log('Fetching resources data.');
  const resources = await fetchResourceRecords();
  console.log(`got ${resources.length} resources.`);

  // Pre-sort the list so that templates don't need to later.
  return resources.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
};

const filterOptions = (resources) => {
  const categories = [...new Set(resources.map((r) => r.categories).flat()
    .filter((c) => c))];

  const filterVals = [];
  filterVals.push(new FilterSection('Category', 'category',
    categories.map((x) => new FilterCheckbox(x))));

  return filterVals;
};

// Returns an object containing a list of FilterSections with each FilterSection
// having a unique list of FilterCheckboxes encompassing all the values
// available in the Airtable data at that time.
module.exports = async function() {
  const asset = new AssetCache('resources_data');
  // This cache duration will only be used at build time.
  let cacheDuration = '1h';
  if (process.env.ELEVENTY_SERVERLESS) {
    // Use the serverless cache location specified in .eleventy.js
    asset.cacheDirectory = 'cache';
    cacheDuration = '*'; // Infinite duration (data refreshes at each build)
  }
  if (asset.isCacheValid(cacheDuration)) {
    console.log('Returning cached resources and filter data.');
    const data = await asset.getCachedValue();
    return data;
  }

  const resources = await resourceData();
  const filterVals = filterOptions(resources);

  const data = {filterValues: filterVals, resourceList: resources};

  await asset.save(data, 'json');
  return data;
};
