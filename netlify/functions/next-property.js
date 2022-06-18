const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_CHANGE_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";
const HOUSING_DATABASE_TABLE = "tbl8LUgXQoTYEw2Yh";
const UNITS_TABLE = "tblRtXBod9CC0mivK";
const MAX_IN_PROGRESS_DURATION_HRS = 8;

// Gets all records data about the units within the property with housing ID 
// 'housingId'.  Returns a list of record objects or an empty list if
// no units records are found.
const fetchUnitRecords = async(housingId) => {
  const table = base(UNITS_TABLE);
  return table.select({
    filterByFormula: `{ID (from Housing)} = "${housingId}"`
  })
  .all()
  .then(records => {
    return records.map(x => x._rawJson);
  });
}

// Gets the record data corresponding to the property with housing ID 
// 'housingId'.  
// If no property exists with the given housing ID, returns nothing.
const fetchHousingRecord = async(housingId) => {
  // TODO: Error handling.
  const table = base(HOUSING_DATABASE_TABLE);
  return table.select({
    filterByFormula: `{DISPLAY_ID} = "${housingId}"`
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return;
    }
    return records[0]._rawJson;
  });
}

// Gets the Airtable record ID string for the queue item belonging to
// updates campaign 'campaign' and with housing ID 'housingId'.
// If more than one such record exists, this returns the newest one.
// If no such record exists, returns an empty string.
const fetchQueueRecordId = async(campaign, housingId) => {
  // TODO: Error handling.
  if (!housingId) {
    return "";
  }
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let filterStr = `
    AND(
      {CAMPAIGN} = "${campaign}",
      {_DISPLAY_ID} = "${housingId}"
    )`;
  return records = table.select({
    fields: [],
    sorts : [{field: "ID", direction: "desc"}],
    filterByFormula: filterStr,
    maxRecords: 1,
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return "";
    }
    return records[0].id;
  });
}

// Updates the given queue item with record ID 'recordId' to have
// an in-progress timestamp of now.
const markInProgressInQueue = async(recordId) => {
  // TODO: Handle bad record ID.
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let now = new Date();
  return table.update(recordId, {"IN_PROGRESS_DATETIME": now.toISOString()});
}

// Gets data about the current state of the property updates queue for
// the updates campaign 'campaign'. This data includes information about
// the next property up in the queue.
const fetchQueueData = async(campaign) => {
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  const staleInProgress = new Date(
    Date.now() - (MAX_IN_PROGRESS_DURATION_HRS * 60 * 60 * 1000));
  let filterFormula = `{CAMPAIGN} = "${campaign}"`;
  return table.select({
    fields: ["ID", "_DISPLAY_ID", "IN_PROGRESS_DATETIME", "COMPLETED_DATETIME"],
    filterByFormula: filterFormula,
    // Sort by management company to ensure that sequential properties
    // in the queue have similar-looking websites for easier data-hunting
    // by our volunteers.
    sort: [{field: "_MANAGEMENT_COMPANY", direction: "asc"},
           {field: "_DISPLAY_ID", direction: "asc"}],
  })
  .all()
  .then(records => {
    let completed = [];
    let inProgress = [];
    let todo = [];
    // Group queue items into "completed", "in progress", and "to-do" based
    // on stored timestamps of transitions between these states.
    for (record of records) {
      if (record.get("COMPLETED_DATETIME")) {
        completed.push(record);
      // If an item has been marked as "in progress" for over
      // MAX_IN_PROGRESS_DURATION_HRS, it should be considered no longer in 
      // progress.
      } else if (record.get("IN_PROGRESS_DATETIME") && 
          Date.parse(record.get("IN_PROGRESS_DATETIME")) > staleInProgress) {
        inProgress.push(record);
      } else {
        todoItems.push(record);
      }
    }
    let queueData = {
      numCompleted: completed.length,
      numInProgress: inProgress.length,
      numTodo: todo.length,
      numTotal: records.length,
      thisItem: {
        housingId: todo.length > 0 ? todo[0].get("_DISPLAY_ID")[0] : "",
        recordId: todo.length > 0 ? todo[0].id : "",
      },
    };
    return queueData;
  });
}

exports.handler = async function(event) {
  console.log(event.path);
  // Get the campaign name and optional housing ID from the URL
  const paramsStr = event.path.split("next-property/")[1];
  const params = paramsStr.split("/");
  let campaign = "";
  let housingId = "";
  let data;
  if (params.length >= 1) {
    campaign = params[0];
  }
  if (params.length >= 2) {
    housingId = params[1];
  }

  if (campaign) {
    console.log("fetching queue data");
    let queueData = await Promise.all([
      fetchQueueRecordId(campaign, housingId),
      fetchQueueData(campaign)
    ]);
    // Get the matching queue item for the given housing ID (if there is one).
    let queueRecordIdOverride = queueData[0]; 
    console.log(`queueRecordIdOverride = ${queueRecordIdOverride}`);
    data.queue = queueData[1];

    if (housingId) {
      // A housing ID was given explicitly in the URL, and it matches an 
      // existing queue item.  Thus, override whatever the queue says is next up
      // with the queue record data for the housing ID given in the URL.
      data.queue.thisItem.recordId = queueRecordIdOverride;
      data.queue.thisItem.housingId = housingId;
    } else {
      // Set the housing ID based on the next property in the queue.
      housingId = data.queue.thisItem.housingId;
    }
    console.log(data.queue);

    // Get all the data for the housing ID.
    console.log("fetching unit records and housing record for ID: " + housingId);
    let housingData = await Promise.all([fetchHousingRecord(housingId), fetchUnitRecords(housingId)]);
    data.housing = housingData[0];
    data.units = housingData[1];

    // If there is a matching queue record for this housing ID, update it to
    // be in progress.
    if (data.queue.thisItem.recordId) {
      console.log("updating in progress status for ID: " + housingId);
      await markInProgressInQueue(data.queue.thisItem.recordId);
      // TODO: Get these updated counts from the queue?
      data.queue.numInProgress += 1;
      data.queue.numTodo -= 1;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};