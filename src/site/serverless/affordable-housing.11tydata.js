const { AssetCache } = require("@11ty/eleventy-fetch");

const fetchTransitData = async() => {
  const endpoint = `https://api.511.org/transit/stops?api_key=${process.env.SF_BAY_511_API_KEY}&operator_id=SC&format=json`;
  let response = await fetch(endpoint);
  let transitData = await response.json();
  return transitData.Contents.dataObjects.ScheduledStopPoint.map(x => ({
    name: x.Name,
    lat: x.Location.Latitude,
    lng: x.Location.Longitude,
  }));
}

module.exports = async function() {
  let asset = new AssetCache("transit_data");
  // This cache duration will only be used at build time.
  let cacheDuration = "1m";
  if(process.env.ELEVENTY_SERVERLESS) {
    // Use the serverless cache location specified in .eleventy.js
    asset.cacheDirectory = "cache"; 
    cacheDuration = "*";  // Infinite duration (data refreshes at each build)
  }
  if (asset.isCacheValid(cacheDuration)) {
    console.log("Returning cached serverless data.");
    let data = await asset.getCachedValue();
    return data;
  }
  console.log("Fetching transit data.");
  let transit = await fetchTransitData();
  console.log("Got transit data.");

  let data = { transitData: transit };

  await asset.save(data, "json");
  return data;
}