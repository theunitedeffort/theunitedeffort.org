const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
  const endpoint = `https://api.511.org/transit/stops?api_key=${process.env.SF_BAY_511_API_KEY}&operator_id=SC&format=json`;
  
  // For some reason the response includes a zero width space at
  // the beginning, so the built-in eleventy-fetch json parsing
  // (type: "json") will not work.
  let options = {type: "text", duration: "1m", verbose: true};
  if(process.env.ELEVENTY_SERVERLESS) {
    options.duration = "*"; // Infinite duration (data refreshes at each build)
    // Use the serverless cache location specified in .eleventy.js
    options.directory = "cache";
  }
  let response = await EleventyFetch(endpoint, options);
  let data = JSON.parse(response.trim());
  let transit = data.Contents.dataObjects.ScheduledStopPoint.map(x => ({
    name: x.Name,
    lat: x.Location.Latitude,
    lng: x.Location.Longitude,
  }));
  return {transitData: transit};
}