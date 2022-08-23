const { AssetCache } = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblRtXBod9CC0mivK";
const HIGH_CAPACITY_UNIT = 4;  // Bedrooms

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
        if (record.get("_CITY") !== undefined) {
          cityStr = record.get("_CITY")[0];
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
  let cities = [...new Set(filterOptions.map(o => o.city))];
  cities = cities.filter(x => x);
  let openStatuses = [...new Set(filterOptions.map(o => o.openStatus))];
  openStatuses = openStatuses.filter(x => x);
  let unitTypes = [...new Set(filterOptions.map(o => o.unitType))];
  unitTypes = unitTypes.filter(x => x);
  let allPopulationsServed = filterOptions.map(o => o.populationsServed);
  allPopulationsServed = [...new Set(allPopulationsServed.flat())];
  allPopulationsServed = allPopulationsServed.filter(x => x);

  let filterVals = [];
  filterVals.push(new FilterSection("City", "city",
    cities.map(x => new FilterCheckbox(x))));

  // Special handling for some unit types
  // Any "{N} Bedroom" entries that have HIGH_CAPACITY_UNIT or greater bedrooms
  // will get grouped  together into one filter checkbox.
  const unitTypeOptions = [];
  const bedroomSizes = [];
  let bedroomStr = "";
  for (const unitType of unitTypes) {
    const match = unitType.match(/^(\d) ?(bedroom|br)$/i);
    if (match) {
      bedroomSizes.push({num: parseInt(match[1]), str: unitType});
      bedroomStr = match[2];
    }
  }
  const catchallSize = Math.min(Math.max(...bedroomSizes.map(x => x.num)),
    HIGH_CAPACITY_UNIT);
  // Only do grouping if the unit types list includes units with at least
  // HIGH_CAPACITY_UNIT bedrooms.
  if (catchallSize >= HIGH_CAPACITY_UNIT) {
    // Get all unit types that will be grouped together
    const groupedSizes = bedroomSizes.filter(x => x.num >= catchallSize);
    for (const bedroomSize of groupedSizes) {
      const idx = unitTypes.indexOf(bedroomSize.str);
      // Remove it from the unit types list so it can be grouped instead.
      unitTypes.splice(idx, 1);
    }
    // Make a single entry out of all the grouped sizes.
    const groupedStr = groupedSizes.map(x => x.str).join(", ")
    unitTypeOptions.push(new FilterCheckbox(groupedStr, `${HIGH_CAPACITY_UNIT}+ ${bedroomStr}`));
  }
  unitTypeOptions.push(...unitTypes.map(x => new FilterCheckbox(x)));
  filterVals.push(new FilterSection("Type of Unit", "unitType",
    unitTypeOptions));
  
  filterVals.push(new FilterSection("Availability", "availability",
      openStatuses.map(x => new FilterCheckbox(x))));
  filterVals.push(new FilterSection("Populations Served", "populationsServed",
      allPopulationsServed.map(x => new FilterCheckbox(x))));

  console.log("Got filter options.");
  let filterData = { filterValues: filterVals };

  await asset.save(filterData, "json");
  return filterData;
}