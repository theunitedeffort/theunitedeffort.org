const EleventyFetch = require("@11ty/eleventy-fetch");

const OPERATOR_ID_MAP = {
  "SC": "VTA",
  "MV": "MVgo",
};

const fetchTransitData = async(operator_id) => {
  if (!OPERATOR_ID_MAP.hasOwnProperty(operator_id)) {
    return [];
  }
  if (!process.env.SF_BAY_511_API_KEY) {
    console.warn('Warning: SF_BAY_511_API_KEY environment variable is not defined. Public transit data will not be available.');
    return [];
  }
  const endpoint = `https://api.511.org/transit/stops?api_key=${process.env.SF_BAY_511_API_KEY}&operator_id=${operator_id}&format=json`;
  
  // For some reason the response includes a zero width space at
  // the beginning, so the built-in eleventy-fetch json parsing
  // (type: "json") will not work.
  const options = {type: "text", duration: "1h"};
  const response = await EleventyFetch(endpoint, options);
  const data = JSON.parse(response.trim());
  return data.Contents.dataObjects.ScheduledStopPoint.map(x => ({
    name: x.Name,
    lat: x.Location.Latitude,
    lng: x.Location.Longitude,
    operator: OPERATOR_ID_MAP[operator_id],
  }));
}

module.exports = async function() {
  if (process.env.SITE_CONTEXT == 'test') {
    return {transitData: []}
  }
  const [vta_transit, mvgo_transit] = await Promise.all(
    [fetchTransitData("SC"), fetchTransitData("MV")]);
  
  return {transitData: [].concat(vta_transit, mvgo_transit)};
}