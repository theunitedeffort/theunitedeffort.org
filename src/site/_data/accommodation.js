const { AssetCache } = require("@11ty/eleventy-fetch");
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const UNITS_TABLE = "tblRtXBod9CC0mivK";


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let units = [];
  let locations = [];
  let cities = [];
  let populations = [];

  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        
        // collect some of the available options for populating filtering later
        cities.push(record.get("City (from Housing)")?.[0]);
        populations = populations.concat(record.get("POPULATIONS_SERVED (from Housing)"));

        // generate a location from every unit and add ut to a locations array that we'll dedupe later
        locations.push({
          id: record.get("ID (from Housing)")?.[0] || "",
          aptName: record.get("APT_NAME")?.[0] || "",
          address: record.get("Address (from Housing)")?.[0] || "",
          city: record.get("City (from Housing)")?.[0] || "",
          locCoords: record.get("LOC_COORDS (from Housing)")?.[0] || "",
          phone: record.get("Phone (from Housing)")?.[0] || "",
          website: record.get("URL (from Housing)")?.[0] || "",
          email: record.get("EMAIL (from Housing)")?.[0] || "",
          units_count: record.get("UNITS_CNT (from Housing)")?.[0] || "",
          populations_served: record.get("POPULATIONS_SERVED (from Housing)") || "",
          wheelchairAccessibleOnly: record.get("HAS_WHEELCHAIR_ACCESSIBLE_UNITS (from Housing)")?.[0] ? "on" : ""
        }); 

        // add the unit info to a units object 
        units.push({
          id: record.get("ID (from Housing)")?.[0] || "",
          type: record.get("TYPE") || "",
          status: record.get("STATUS") || "",
          ami_rent: record.get("ami_rent") || "",
          ami_max_income: record.get("ami_max_income") || "",
          RENT_PER_MONTH_USD: record.get("RENT_PER_MONTH_USD") || "",
          MIN_INCOME_RENT_FACTOR: record.get("MIN_INCOME_RENT_FACTOR") || "",
          MAX_YEARLY_INCOME_HH_1_USD: record.get("MAX_YEARLY_INCOME_HH_1_USD") || "",
          MAX_YEARLY_INCOME_HH_3_USD: record.get("MAX_YEARLY_INCOME_HH_3_USD") || "",
          MAX_YEARLY_INCOME_HH_2_USD: record.get("MAX_YEARLY_INCOME_HH_2_USD") || "",
          MAX_OCCUPANCY: record.get("MAX_OCCUPANCY") || "",
          PERCENT_AMI: record.get("PERCENT_AMI") || ""
        });
      });


      // dedupe arrays
      locations = [...new Set(locations.map(a => JSON.stringify(a)))].map(a => JSON.parse(a));
      cities = [...new Set(cities)];
      populations = [...new Set(populations)];

      // add the associated units to each location object
      for (const location of locations) {
        location.units = units.filter(({ id }) => id === location.id );
      }

      return [units, locations, cities, populations];
    });

};



module.exports = async function() {
  
  // Development cache management
  let asset = new AssetCache("affordable_housing_data");
  let cacheDuration = "1m";
  // if(process.env.ELEVENTY_SERVERLESS) {
  //   asset.cacheDirectory = "cache"; 
  //   cacheDuration = "*";
  // }

  // Return data from the cache if it is fresh enough
  if(asset.isCacheValid(cacheDuration)) {
    return asset.getCachedValue(); 
  } 

  // Otherwise we can fetch, cache, and return the data from Airtable
  let [units, locations, cities, populations] = await fetchDataFromAirtable();
  const data = {
    units: units, 
    locations: locations,
    cities: cities,
    populations: populations
  }
  await asset.save(data, "json");
  return data;

}
