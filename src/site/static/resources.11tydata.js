const { AssetCache } = require("@11ty/eleventy-fetch");
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let data = [];
  const table = base("tblyp7AurXeZEIW4J"); // Resources table
  return table.select({
      view: "API list all"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        if (record.get("Show on website")) {
          data.push(record.fields)
        }
      });
      return data;
    });

};


module.exports = async function() {
  let asset = new AssetCache("airtable_resources");
  if (asset.isCacheValid("1d")) {
    console.log("Using cached resources.")
    return await asset.getCachedValue();
  }
  console.log("Fetching resources.");
  let res = await fetchDataFromAirtable();
  let ret = {resources: res};
  await asset.save(ret, "json");
  return ret;
}
