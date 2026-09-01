const eleventyFetch = require('@11ty/eleventy-fetch');

const MAX_FETCH_ATTEMPTS = 5;
const BACKOFF_FACTOR = 2;
const INITIAL_WAIT_MS = 1000;

// https://www.pupismyname.com/articles/fetch-retry/
const eleventyFetchRetry = async (url, options, attempts=1, wait=0) => {
  try {
    return await eleventyFetch(url, options);
  } catch (e) {
    console.error(`attempt ${attempts} of ${MAX_FETCH_ATTEMPTS}: ${e.message}`);
    if (attempts >= MAX_FETCH_ATTEMPTS) {
      console.error(`Fetch failed for ${url}`);
      throw e;
    } else {
      attempts++;
      wait = wait ? wait * BACKOFF_FACTOR : INITIAL_WAIT_MS;
      console.error(`Retrying after ${wait} ms: ${url}`);
      await new Promise((resolve) => setTimeout(resolve, wait));
      return await eleventyFetchRetry(url, options, attempts, wait);
    }
  }
};

module.exports = {eleventyFetchRetry};
