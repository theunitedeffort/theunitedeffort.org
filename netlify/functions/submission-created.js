var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_WRITE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// TODO: also update queue to mark this item as complete.
const AFFORDABLE_HOUSING_CHANGES_TABLE = "tblXy0hiHoda5UVSR";

const createFormResponseRecord = async(formResponses, createdAt) => {
  // TODO: error handling. 
  let table = base(AFFORDABLE_HOUSING_CHANGES_TABLE);
  return table.create({
    "CAMPAIGN": formResponses.campaign || "",
    "FORM_RESPONSE_JSON": JSON.stringify(formResponses),
    "FORM_SUBMITTED_DATETIME": createdAt,
  });
}

// TODO: need form completion time stored.
exports.handler = async function(event) {
  console.log("handling form response.");
  //console.log(event);
  let eventBody = JSON.parse(event.body);
  //console.log(eventBody);
  
  let formResponses = eventBody.payload.data;
  let createdAt = eventBody.payload.created_at;
  //console.log(formResponses);
  console.log("creating record");
  await createFormResponseRecord(formResponses, createdAt);
  console.log("record created");

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "success" }),
  };
};
