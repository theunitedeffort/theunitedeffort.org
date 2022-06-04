const { AssetCache } = require("@11ty/eleventy-fetch");
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const UNITS_TABLE = "tblRtXBod9CC0mivK";



// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let data = [];
  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        data.push(record.fields)

        // data.push({
        //   id: record.get("ID (from Housing)")?.[0] || "",
        //   aptName: record.get("APT_NAME")?.[0] || "",
        //   address: record.get("Address (from Housing)")?.[0] || "",
        //   city: record.get("City (from Housing)")?.[0] || "",
        //   units: [{unitType: record.get("TYPE"), openStatus: record.get("STATUS")}],
        //   locCoords: record.get("LOC_COORDS (from Housing)")?.[0] || "",
        //   phone: record.get("Phone (from Housing)")?.[0] || "",
        //   website: record.get("URL (from Housing)")?.[0] || "",
        //   email: record.get("EMAIL (from Housing)")?.[0] || ""
        // })


      });
      return data;
    });

};





module.exports = async function() {

  let asset = new AssetCache("affordable_housing_filters");
  // This cache duration will only be used at build time.
  let cacheDuration = "1m";
  if(process.env.ELEVENTY_SERVERLESS) {
    // Use the serverless cache location specified in .eleventy.js
    asset.cacheDirectory = "cache"; 
    cacheDuration = "*";  // Infinite duration (data refreshes at each build)
  }

  let units = await fetchDataFromAirtable();
  await asset.save(units, "json");
  return units


}
