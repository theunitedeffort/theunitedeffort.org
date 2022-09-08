const EleventyFetch = require("@11ty/eleventy-fetch");

const OPERATOR_ID_MAP = {
  "SC": "VTA",
  "MV": "MVgo",
};

const fetchTransitData = async(operator_id) => {
  if (!OPERATOR_ID_MAP.hasOwnProperty(operator_id)) {
    return [];
  }
  const endpoint = `https://api.511.org/transit/stops?api_key=${process.env.SF_BAY_511_API_KEY}&operator_id=${operator_id}&format=json`;
  
  // For some reason the response includes a zero width space at
  // the beginning, so the built-in eleventy-fetch json parsing
  // (type: "json") will not work.
  let options = {type: "text", duration: "1h"};
  if (process.env.ELEVENTY_SERVERLESS) {
    options.duration = "*"; // Infinite duration (data refreshes at each build)
    // Use the serverless cache location specified in .eleventy.js
    options.directory = "cache";
  }
  let response = await EleventyFetch(endpoint, options);
  let data = JSON.parse(response.trim());
  return data.Contents.dataObjects.ScheduledStopPoint.map(x => ({
    name: x.Name,
    lat: x.Location.Latitude,
    lng: x.Location.Longitude,
    operator: OPERATOR_ID_MAP[operator_id],
  }));
}

module.exports = async function() {
  let vta_transit = await fetchTransitData("SC");
  let mvgo_transit = await fetchTransitData("MV");
  
  return {transitData: [].concat(vta_transit, mvgo_transit)};
}