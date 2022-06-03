var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const AFFORDABLE_HOUSING_CHANGES_TABLE = "tblXy0hiHoda5UVSR";

exports.handler = async function(event) {
  console.log(event.body.payload);
  let table = base(AFFORDABLE_HOUSING_CHANGES_TABLE);
  let formResponses = event.body.payload.data;
  console.log(JSON.parse(formResponses));
  // TODO: error handling. 
  table.create({
    "CAMPAIGN": "First Campaign",
    "FORM_RESPONSE_JSON": formResponses,
  }, function(err, record) {
    if (err) {
      console.error(err);
    }
  });
};
