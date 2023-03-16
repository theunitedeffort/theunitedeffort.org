// https://answers.netlify.com/t/include-request-ip-address-on-event-object/1820/6
exports.handler = function(event, context, callback) {
  console.log(`{\ncontext: ${JSON.stringify(context,null,2)},\nevent: ${JSON.stringify(event,null,2)}\n}`)
  callback(null, {
  statusCode: 200,
  // TODO: Remove event.headers['client-ip'] (dev only)
  body: JSON.stringify({'clientIp': event.headers['x-nf-client-connection-ip'] || event.headers['client-ip']})
  });
}