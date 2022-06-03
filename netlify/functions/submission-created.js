exports.handler = async function(event) {
  console.log(event);
  console.log(JSON.stringify(event, null, 2));
};
