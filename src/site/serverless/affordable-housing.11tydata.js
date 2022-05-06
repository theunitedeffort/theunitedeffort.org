var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblNLrf8RTiZdY5KN";

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
          unitType: record.get("TYPE")
        })
      });
      return records;
    });
};

// Returns an object containing a list of FilterSections with each FilterSection
// having a unique list of FilterCheckboxes encompassing all the values
// available in the Airtable data at that time.
module.exports = async function() {
  console.log("Fetching filter options.");
  let filterOptions = await fetchFilterOptions();
  let cities = [...new Set(filterOptions.map(({ city }) => city))];
  cities = cities.filter(city => city !== undefined);
  let openStatuses = [...new Set(filterOptions.map(({ openStatus }) => openStatus))];
  // Don't allow Waitlist Closed to be a filter option as most people will not want to 
  // specifically search for places with a closed waitlist.
  openStatuses = openStatuses.filter(openStatus => (
    openStatus !== undefined && openStatus !== "Waitlist Closed"));
  let unitTypes = [...new Set(filterOptions.map(({ unitType }) => unitType))];
  unitTypes = unitTypes.filter(unitType => unitType !== undefined);

  let filterVals = [
    new FilterSection("City", "city", cities.map((x) => new FilterCheckbox(x))),
    new FilterSection("Type of Unit", "unitType",
      unitTypes.map((x) => new FilterCheckbox(x))),
    new FilterSection("Availability", "availability",
      openStatuses.map((x) => new FilterCheckbox(x)))
  ];
  console.log("Got filter options.");
  return { filterValues: filterVals };
}