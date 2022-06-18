var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_WRITE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const AFFORDABLE_HOUSING_CHANGES_TABLE = "tblXy0hiHoda5UVSR";
const AFFORDABLE_HOUSING_CHANGES_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";

const createFormResponseRecord = async(formResponses, createdAt) => {
  // TODO: Error handling. 
  let table = base(AFFORDABLE_HOUSING_CHANGES_TABLE);
  return table.create({
    "CAMPAIGN": formResponses.update_campaign || "",
    "FORM_RESPONSE_JSON": JSON.stringify(formResponses),
    "FORM_SUBMITTED_DATETIME": createdAt,
  });
}

const markCompleteInQueue = async(recordId) => {
  // TODO: Error handling. 
  let table = base(AFFORDABLE_HOUSING_CHANGES_QUEUE_TABLE);
  let now = new Date();
  return table.update(recordId, {"COMPLETED_DATETIME": now.toISOString()});
}

exports.handler = async function(event) {
  console.log("handling form response.");
  let eventBody = JSON.parse(event.body);
  let formResponses = eventBody.payload.data;
  let createdAt = eventBody.payload.created_at;
  let recordId = eventBody.payload.data.queue_record_id;
  console.log("creating form response record");
  await createFormResponseRecord(formResponses, createdAt);
  console.log("form response record created");
  if (recordId) {
    // TODO: check that the form response was in fact recorded successfully.
    console.log("updating queue");
    await markCompleteInQueue(recordId);
    console.log("queue updated");
  } else {
    console.log("no queue record id to update");
  }

  return {
    statusCode: 200,
    body: "",
  };
};
