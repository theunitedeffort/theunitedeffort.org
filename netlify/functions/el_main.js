
exports.handler = async function(event) {
  const endpoint = event.queryStringParameters.q
  console.log(event.queryStringParameters)
  console.log(endpoint)
  if (!endpoint.startsWith('https://translate.googleapis.com')) {
    return {
    	statusCode: 403,
    	body: 'Forbidden'
    }
  }
  console.log(`Getting response for ${endpoint}`);
  const resp = await fetch(endpoint);
  let content = await resp.text();
  content = content.replaceAll('https://www.google.com/images/cleardot.gif', 'https://');
  content = content.replace(/src=.*?\/gen204\?.*?;/g, 'src="";');

  return {
    statusCode: resp.status,
    body: content,
    headers: {
      "Content-type": resp.headers.get('Content-type'),
    }
  };
}