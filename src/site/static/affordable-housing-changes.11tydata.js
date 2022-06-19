const { AssetCache } = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable(
	{ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_DATABASE_SCHEMA_TABLE = "tblfRhO6C1Pi0Ljwc";

const fetchHousingSchema = async() => {
  const table = base(HOUSING_DATABASE_SCHEMA_TABLE);

  return table.select({
    fields: ["HOUSING_DATABASE_FIELDS_JSON", "UNITS_FIELDS_JSON"],
    maxRecords: 1,
    sort: [{field: "ID", direction: "asc"}]
  })
  .all()
  .then(records => {
    housingDbFields = JSON.parse(
    	records[0].get("HOUSING_DATABASE_FIELDS_JSON"));
    unitsFields = JSON.parse(records[0].get("UNITS_FIELDS_JSON"));
    return {
      housing: Object.fromEntries(housingDbFields.map((x) => [x.name, x])),
      units: Object.fromEntries(unitsFields.map((x) => [x.name, x])),
    };
  });
};

// Returns an object with field metadata for the housing database and the
// units tables.
module.exports = async function() {
  let asset = new AssetCache("affordable_housing_fields");
  if (asset.isCacheValid("1d")) {
    console.log("Using cached affordable housing fields.");
    return await asset.getCachedValue();
  }
  console.log("Fetching affordable housing fields.");
  let fields = await fetchHousingSchema();
  await asset.save(fields, "json");
  return fields;
}