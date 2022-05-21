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
//
// TODO(trevorshannon): Only fetch filter options at build time, not on every
// page load.
const fetchFilterOptions = async() => {
  let records = [];
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
        records.push({
          city: cityStr,
          openStatus: record.get("STATUS"),
          unitType: record.get("TYPE"),
        })
      });
      return records;
    });
};

// Returns an object containing a list of FilterSections with each FilterSection
// having a unique list of FilterCheckboxes encompassing all the values
// available in the Airtable data at that time.
module.exports = async function() {
  let asset = new AssetCache("affordable_housing_filters");
  // This cache duration will only be used at build time.
  let cacheDuration = "1m";
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
  let cities = [...new Set(filterOptions.map(({ city }) => city))];
  cities = cities.filter(city => city !== undefined);
  let openStatuses = [...new Set(filterOptions.map(({ openStatus }) => openStatus))];
  openStatuses = openStatuses.filter(openStatus => openStatus !== undefined);
  let unitTypes = [...new Set(filterOptions.map(({ unitType }) => unitType))];
  unitTypes = unitTypes.filter(unitType => unitType !== undefined);

  let filterVals = [
    new FilterSection("City", "city", cities.map((x) => new FilterCheckbox(x))),
    new FilterSection("Type of Unit", "unitType",
      unitTypes.map((x) => new FilterCheckbox(x))),
    new FilterSection("Availability", "availability",
      openStatuses.map((x) => new FilterCheckbox(x))),
    // The age filter is not a direct mapping from values in Airtable,
    // so hard-code the values here.
    new FilterSection("Ages Served", "age",
      [new FilterCheckbox("Youth Only"),
       new FilterCheckbox("Seniors Only"),
       new FilterCheckbox("No Age Restriction")])
  ];
  console.log("Got filter options.");
  let filterData = { filterValues: filterVals };

  await asset.save(filterData, "json");
  return filterData;
}