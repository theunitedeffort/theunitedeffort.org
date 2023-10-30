// ecfr.gov provides an API for accessing the code of federal regulations, but
// the endpoints require the user to provide the date of a specific release
// of the regulations.  There is no support for a 'current' or 'latest' keyword
// so this function adds in that missing functionality.
//
// Replacing the date in an eCFR API path (https://www.ecfr.gov/developers/documentation/api/v1)
// with the string 'current' will get the latest release for the regulations
// of interest.
//
// This function expects the same path and paramters as the eCFR API endpoints.

const ECFR_BASE_URL = 'https://www.ecfr.gov';
const SUMMARY_ENDPOINT = 'api/versioner/v1/titles.json';

async function getDateForCurrent(title) {
	console.log(`Getting date for latest version of title ${title}`);
  const endpoint = `${ECFR_BASE_URL}/${SUMMARY_ENDPOINT}`;
  const resp = await fetch(endpoint);
  const summary = await resp.json();
  const titleSummary = summary.titles.find((t) => t.number == title);
  if (!titleSummary) {
  	return;
  }
  const date = titleSummary.latest_issue_date;
  console.log(`Latest date is ${date}`);
  return date;
}

exports.handler = async function(event) {
	let path = event.path.replace(/\/ecfr\//g, '');
	const currentRegex = /\/current\//;
	const titleRegex = /title-(\d+)/;
	console.log(`Path is ${path}`);
	if (currentRegex.test(path) && titleRegex.test(path)) {
		console.log('finding latest date');
		const title = titleRegex.exec(path)[1];
		const date = await getDateForCurrent(title);
		if (date) {
      path = path.replace(currentRegex, `/${date}/`);
      console.log(`Updated path to ${path}`);
		}
	}
	const endpoint = `${ECFR_BASE_URL}/${path}?${event.rawQuery}`;
	console.log(`Getting response for ${endpoint}`);
  const resp = await fetch(endpoint);
  const content = await resp.text();

	return {
    statusCode: resp.status,
    body: content,
    headers: {
      "Content-type": resp.headers.get('Content-type'),
    }
  };
}