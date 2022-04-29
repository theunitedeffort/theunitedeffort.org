var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblNLrf8RTiZdY5KN";

// TODO(trevorshannon): Only fetch filter options at build time, not on every page load.
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
          open_status: record.get("STATUS"),
          unit_type: record.get("TYPE")
        })
      });
      return records;
    });
};

module.exports = async function() {
  console.log("Fetching filter options.");
  let filter_options = await fetchFilterOptions();
  let cities = [...new Set(filter_options.map(({city}) => city))];
  cities = cities.filter(city => city !== undefined);
  let open_statuses = [...new Set(filter_options.map(({open_status}) => open_status))];
  open_statuses = open_statuses.filter(open_status => open_status !== undefined);
  let unit_types = [...new Set(filter_options.map(({unit_type}) => unit_type))];
  unit_types = unit_types.filter(unit_type => unit_type !== undefined);

  let filter_vals = {
    city: cities.map((x) => ({name: x, selected: false})),
    open_status: open_statuses.map((x) => ({name: x, selected: false})),
    unit_type: unit_types.map((x) => ({name: x, selected: false}))
  };
  return {filter_values: filter_vals};
}
