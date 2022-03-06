// const { builder } = require('@netlify/functions');

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


const pageTemplate = (data) => {

  console.log(`DATA`, data);


  return `
  <html>
    <body>
      <code>${ data }</code>
    <body>
  </html>
  `;
};
let data;

async function fetchData(housingID) {
  // return await fetchData(housingID);
  base('Housing')
    .select({
      filterByFormula: `ID = "${housingID}"`
    }).firstPage(function(err, records) {
      data = records[0].get('ADDRESS');
      console.log("first", data);
    });

  console.log("fetch", data);
  return data;

}




exports.handler = async function(event) {

  const housingID = event.path.split("housing/")[1];

  await fetchData(housingID);
  console.log(data);

  // return housingList;

  return {
    statusCode: 200,
    body: "foo"
  };


};