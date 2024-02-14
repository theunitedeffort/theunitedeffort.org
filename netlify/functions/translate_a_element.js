exports.handler = async function(event) {
  const endpoint = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2';
  console.log(`Getting response for ${endpoint}`);
  const resp = await fetch(endpoint);
  let content = await resp.text();
  content = content.replace(/_loadJs\('(https:.*?)'\);/, "_loadJs('\\/el_main?q=$1');");

  return {
    statusCode: resp.status,
    body: content,
    headers: {
      "Content-type": resp.headers.get('Content-type'),
    }
  };
}