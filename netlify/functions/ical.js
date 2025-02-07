// Generates an ical file based on obfuscated query parameters

const SECRET = process.env.ICS_OBFUSCATION_KEY;

function serverError() {
  return {
    statusCode: 500,
    body: "Server Error",
  }
}

function badRequest() {
  return {
    statusCode: 400,
    body: "Bad Request",
  }
}

function sanitize(str) {
  return str.replace(/[\r\n]/g, '');
}

function deobfuscate(obfuscated, secret) {
  // Convert from hex to decimal
  const rxbytes = [];
  for (let i = 0; i < obfuscated.length; i += 2) {
    rxbytes.push(parseInt(obfuscated.slice(i, i+2), 16));
  }

  // Ensure key is at least as long as the message.
  let key = secret;
  while (key.length < rxbytes.length) {
    key += key;
  }

  // De-obfuscate the received data.
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const bytes = [];
  for (let i = 0; i < rxbytes.length; i++) {
    bytes.push(rxbytes[i] ^ keyBytes[i]);
  }
  // Strip off the checksum from the message.
  const sentChecksum = bytes.pop();
  // Verify checksum sent matches checksum computed.
  const checksum = bytes.reduce((acc, currVal) => acc ^ currVal, 0);
  if (sentChecksum != checksum) {
    console.warn(`checksum sent is ${sentChecksum}, computed checksum is ${checksum}`);
    return badRequest();
  }

  // Convert from byte array to regular string.
  const decoder = new TextDecoder();
  return decoder.decode(Uint8Array.from(bytes))
}

exports.handler = async function(event) {
  if (!SECRET) {
    return serverError();
  }
  const path = event.path;
  const requestParams = event.queryStringParameters;
  const obfuscated = requestParams.data;
  if (!obfuscated) {
    console.warn(`Missing data parameter. Event path: ${path}`);
    return badRequest();
  }
  console.log(`Received: ${obfuscated}`);
  const deobfuscated = deobfuscate(obfuscated, SECRET);
  console.log(`Deobfuscated: ${deobfuscated}`);

  params = new URLSearchParams(deobfuscated);
  const now = new Date();
  const tsString = (
    `${now.getUTCFullYear()}` +
    `${now.getUTCMonth()}`.padStart(2, '0') +
    `${now.getUTCDate()}`.padStart(2, '0') +
    'T' +
    `${now.getUTCHours()}`.padStart(2, '0') +
    `${now.getUTCMinutes()}`.padStart(2, '0') +
    `${now.getUTCSeconds()}`.padStart(2, '0') +
    'Z'
  );
  const requiredParams = ['s', 'e', 'm', 'd', 'l', 'u'];
  if (!requiredParams.every((v) => params.has(v))) {
    console.warn(`Missing required parameter. params: ${params}`);
    return badRequest();
  }
  const ical = (
    'BEGIN:VCALENDAR\r\n' +
    'VERSION:2.0\r\n' +
    'PRODID:-//UEO//NONSGML Volunteer signup//EN\r\n' +
    'BEGIN:VEVENT\r\n' +
    `DTSTAMP:${tsString}\r\n` +
    `DTSTART:${sanitize(params.get('s'))}\r\n` +
    `DTEND:${sanitize(params.get('e'))}\r\n` +
    `SUMMARY:${sanitize(params.get('m'))}\r\n` +
    `DESCRIPTION:${sanitize(params.get('d'))}\r\n` +
    `LOCATION:${sanitize(params.get('l'))}\r\n` +
    `UID:${sanitize(params.get('u'))}\r\n` +
    'END:VEVENT\r\n' +
    'END:VCALENDAR\r\n'
  );

  return {
    statusCode: 200,
    body: ical,
    headers: {
      'Content-type': 'text/calendar',
      'Content-Disposition': 'attachment; filename=event.ics',
    }
  };
}