exports.handler = async function(event) {
  const endpoint = 'https://cdn.gtranslate.net/widgets/latest/dropdown.js';
  console.log(`Getting response for ${endpoint}`);
  const resp = await fetch(endpoint);
  let content = await resp.text();
  content = content.replace('https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2', 'http://localhost:8888/translate_a_element');

  return {
    statusCode: resp.status,
    body: content,
    headers: {
      "Content-type": resp.headers.get('Content-type'),
    }
  };
}