const GTRANSLATE_BASE = 'https://cdn.gtranslate.net/widgets/latest/';
const TRANSLATE_ELEMENT_RESOURCE = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2';
const TRANSLATE_API_BASE = 'https://translate.googleapis.com/_/translate_http/_/js';

exports.handler = async function(event) {
  let rewrite = null;
  const endpoint = event.queryStringParameters.q
  if (endpoint.startsWith(GTRANSLATE_BASE)) {
    rewrite = function(content) {
      return content.replace(TRANSLATE_ELEMENT_RESOURCE, `/tp?q=${TRANSLATE_ELEMENT_RESOURCE}`);
    };
  } else if (endpoint == TRANSLATE_ELEMENT_RESOURCE) {
    rewrite = function(content) {
      return content.replace(/_loadJs\('(https:.*?)'\);/, "_loadJs('\\/tp?q=$1');");
    };
  } else if (endpoint.startsWith(TRANSLATE_API_BASE)) {
    rewrite = function(content) {
      const ret = content.replaceAll('https://www.google.com/images/cleardot.gif', 'https://');
      return ret.replace(/src=.*?\/gen204\?.*?;/g, 'src="";');
    };
  } else {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid parameter'
    }
  }
  console.log(`Getting response for ${endpoint}`);
  const resp = await fetch(endpoint);
  let content = await resp.text();
  content = rewrite(content);

  return {
    statusCode: resp.status,
    body: content,
    headers: {
      "Content-type": resp.headers.get('Content-type'),
    }
  };
}