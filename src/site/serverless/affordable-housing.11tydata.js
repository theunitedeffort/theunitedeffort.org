const { AssetCache } = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblRtXBod9CC0mivK";

// A group of checkboxes for filtering housing results.
function FilterSection(heading, name, options) {
  this.heading = heading;
  this.name = name;
  this.options = options;
}

// A single checkbox for filtering housing results.
function FilterCheckbox(name, selected = false) {
  this.name = name;
  this.selected = selected;
}

// Gets values from all housing units that are relevant to future filtering of 
// results.
const fetchFilterOptions = async() => {
  let options = [];
  const table = base(UNITS_TABLE);

  return table.select({
      view: "API all units",
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        // TODO(trevorshannon): Figure out how to deal with empty data properly.
        let cityStr = "";
        if (record.get("City (from Housing)") !== undefined) {
          cityStr = record.get("City (from Housing)")[0];
        }
        options.push({
          city: cityStr,
          openStatus: record.get("STATUS"),
          unitType: record.get("TYPE"),
          populationsServed: record.get("_POPULATIONS_SERVED"),
        })
      });
      return options;
    });
};

// Returns an object containing a list of FilterSections with each FilterSection
// having a unique list of FilterCheckboxes encompassing all the values
// available in the Airtable data at that time.
module.exports = async function() {
  let asset = new AssetCache("affordable_housing_filters");
  // This cache duration will only be used at build time.
  let cacheDuration = "1d";
  if(process.env.ELEVENTY_SERVERLESS) {
    // Use the serverless cache location specified in .eleventy.js
    asset.cacheDirectory = "cache"; 
    cacheDuration = "*";  // Infinite duration (data refreshes at each build)
  }
  if (asset.isCacheValid(cacheDuration)) {
    console.log("Returning cached filter options.");
    let filters = await asset.getCachedValue();
    return filters;
  }
  console.log("Fetching filter options.");
  let filterOptions = await fetchFilterOptions();
  let cities = [...new Set(filterOptions.map(o => o.city))];
  cities = cities.filter(x => x);
  let openStatuses = [...new Set(filterOptions.map(o => o.openStatus))];
  openStatuses = openStatuses.filter(x => x);
  let unitTypes = [...new Set(filterOptions.map(o => o.unitType))];
  unitTypes = unitTypes.filter(x => x);
  let allPopulationsServed = filterOptions.map(o => o.populationsServed);
  allPopulationsServed = [...new Set(allPopulationsServed.flat())];
  allPopulationsServed = allPopulationsServed.filter(x => x);

  let filterVals = [
    new FilterSection("City", "city", cities.map(x => new FilterCheckbox(x))),
    new FilterSection("Type of Unit", "unitType",
      unitTypes.map(x => new FilterCheckbox(x))),
    new FilterSection("Availability", "availability",
      openStatuses.map(x => new FilterCheckbox(x))),
    new FilterSection("Populations Served", "populationsServed",
      allPopulationsServed.map(x => new FilterCheckbox(x))),
    
  ];
  console.log("Got filter options.");
  let filterData = { filterValues: filterVals };

  await asset.save(filterData, "json");
  return filterData;
}