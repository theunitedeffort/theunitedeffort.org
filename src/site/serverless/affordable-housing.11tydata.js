const { AssetCache } = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);



// Lookup data for this item from the Airtable API
const fetchHousingList = async() => {
  let housingList = [];
  const table = base("tbl4X57cCTxhRxoPs"); // Housing Database table

  return table.select({
      view: "API all housing"
    })
    .all()
    .then(records => {
      // console.log(`records`, records);
      records.forEach(function(record) {
        housingList.push({
          id: record.get("ID"),
          apt_name: record.get("APT_NAME"),
        })
      });
      return housingList;
    });

};


module.exports = async function() {
  let asset = new AssetCache("airtable_housing_database");
  if (asset.isCacheValid("1s")) {
    return asset.getCachedValue(); // a promise
  }
  console.log("Fetching housing list.")
  let housing = await fetchHousingList();
  await asset.save(housing, "json");
  return {housingdatabase: housing};
}
