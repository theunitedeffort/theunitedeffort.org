const { AssetCache } = require("@11ty/eleventy-fetch");
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const UNITS_TABLE = "tblRtXBod9CC0mivK";


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let units = [];
  let locations = [];
  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        
        // generate a location from every unit and add ut to a locations array that we'll dedupe later
        locations.push({
          id: record.get("ID (from Housing)")?.[0] || "",
          aptName: record.get("APT_NAME")?.[0] || "",
          address: record.get("Address (from Housing)")?.[0] || "",
          city: record.get("City (from Housing)")?.[0] || "",
          locCoords: record.get("LOC_COORDS (from Housing)")?.[0] || "",
          phone: record.get("Phone (from Housing)")?.[0] || "",
          website: record.get("URL (from Housing)")?.[0] || "",
          email: record.get("EMAIL (from Housing)")?.[0] || ""
        }); 

        // add the unit info to a units object 
        let unit = record.fields;
        unit.id = record.get("ID (from Housing)")[0]
        units.push(unit);
      });


      // dedupe locations array
      locations = [...new Set(locations.map(a => JSON.stringify(a)))].map(a => JSON.parse(a));

      // add the associated units to each location object
      for (const location of locations) {
        location.units = units.filter(({ id }) => id === location.id );
      }

      return [units, locations];
    });

};



module.exports = async function() {
  
  // Development cache management
  let asset = new AssetCache("affordable_housing_data");
  let cacheDuration = "1h";
  // if(process.env.ELEVENTY_SERVERLESS) {
  //   asset.cacheDirectory = "cache"; 
  //   cacheDuration = "*";
  // }

  // Return data from the cache if it is fresh enough
  if(asset.isCacheValid(cacheDuration)) {
    return asset.getCachedValue(); 
  } 

  // Otherwise we can fetch, cache, and return the data from Airtable
  let [units, locations] = await fetchDataFromAirtable();
  await asset.save({ units: units, locations: locations}, "json");
  return { units: units, locations: locations};

}
