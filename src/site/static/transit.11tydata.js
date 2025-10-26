const eleventyFetch = require('@11ty/eleventy-fetch');

const MAX_FETCH_ATTEMPTS = 5;
const OPERATOR_ID_MAP = {
  'SC': 'VTA',
  'MV': 'MVgo',
};

// https://www.pupismyname.com/articles/fetch-retry/
const eleventyFetchRetry = async (url, options, attempts=1) => {
  try {
    return await eleventyFetch(url, options);
  } catch (e) {
    console.error(`attempt ${attempts} of ${MAX_FETCH_ATTEMPTS}: ${e.message}`);
    if (attempts >= MAX_FETCH_ATTEMPTS) {
      console.error(`Fetch failed for ${url}`);
      throw e;
    } else {
      attempts++;
      console.error(`Retrying ${url}`);
      return await eleventyFetchRetry(url, options, attempts);
    }
  }
};

const fetchTransitData = async (operatorId) => {
  if (!Object.prototype.hasOwnProperty.call(OPERATOR_ID_MAP, operatorId)) {
    return [];
  }
  if (!process.env.SF_BAY_511_API_KEY) {
    console.warn('Warning: SF_BAY_511_API_KEY environment variable is not ' +
      'defined. Public transit data will not be available.');
    return [];
  }
  const endpoint = `https://api.511.org/transit/stops?api_key=${process.env.SF_BAY_511_API_KEY}&operator_id=${operatorId}&format=json`;

  // For some reason the response includes a zero width space at
  // the beginning, so the built-in eleventy-fetch json parsing
  // (type: "json") will not work.
  const options = {type: 'text', duration: '1h'};
  console.log(`Fetching "${operatorId}" transit data`);
  const response = await eleventyFetchRetry(endpoint, options);
  console.log(`Got "${operatorId}" transit data`);
  const data = JSON.parse(response.trim());
  return data.Contents.dataObjects.ScheduledStopPoint.map((x) => ({
    name: x.Name,
    lat: x.Location.Latitude,
    lng: x.Location.Longitude,
    operator: OPERATOR_ID_MAP[operatorId],
  }));
};

module.exports = async function() {
  const [vtaTransit, mvgoTransit] = await Promise.all(
    [fetchTransitData('SC'), fetchTransitData('MV')]);

  return {transitData: [].concat(vtaTransit, mvgoTransit)};
};
