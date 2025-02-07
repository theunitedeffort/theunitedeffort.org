// Generates an ical file based on obfuscated query parameters

const SECRET = process.env.ICS_OBFUSCATION_KEY;
// TODO: check if the key exists

exports.handler = async function(event) {
  const path = event.path;
  console.log(event);
  const params = event.queryStringParameters;
  const obfuscated = params.data;
  if (!obfuscated) {
    return {
      statusCode: 400,
      body: "Bad Request",
    }
  }
  const rxbytes = [];
  for (let i = 0; i < obfuscated.length; i += 2) {
    rxbytes.push(parseInt(obfuscated.slice(i, i+2), 16));
  }
  console.log(rxbytes.length);

  let key = SECRET;
  while (key.length < rxbytes.length) {
    key += key;
  }
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const plainBytes = [];
  let checksum = 0;
  for (let i = 0; i < rxbytes.length; i++) {
    plainBytes.push(rxbytes[i] ^ keyBytes[i]);
  }
  const sentChecksum = plainBytes.pop();
  for (const val of plainBytes) {
    checksum = checksum ^ val;
  }
  console.log(`checksum sent is ${sentChecksum}, computed checksum is ${checksum}`);
  if (sentChecksum != checksum) {
    return {
      statusCode: 400,
      body: "Bad Request",
    }
  }
  console.log(plainBytes);

  const decoded = decoder.decode(Uint8Array.from(plainBytes))
  console.log(decoded);

  icalParams = new URLSearchParams(decoded);

  // TODO: check all params are present
  const ical = (
    'BEGIN:VCALENDAR\r\n' +
    'VERSION:2.0\r\n' +
    'PRODID:-//UEO//NONSGML Volunteer signup//EN\r\n' +
    'BEGIN:VEVENT\r\n' +
    `DTSTART:${icalParams.get('s')}\r\n` +
    `DTEND:${icalParams.get('e')}\r\n` +
    `DTSTAMP:${icalParams.get('t')}\r\n` +
    `SUMMARY:${icalParams.get('m')}\r\n` +
    `DESCRIPTION:${icalParams.get('d')}\r\n` +
    `LOCATION:${icalParams.get('l')}\r\n` +
    `UID:${icalParams.get('u')}\r\n` +
    'END:VEVENT\r\n' +
    'END:VCALENDAR\r\n'
  );

  return {
    statusCode: 200,
    body: ical,
    headers: {
      "Content-type": "text/calendar",
      "Content-Disposition": "attachment; filename=event.ics",
    }
  };
}