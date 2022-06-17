const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_CHANGE_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";
const HOUSING_DATABASE_TABLE = "tbl8LUgXQoTYEw2Yh";
const UNITS_TABLE = "tblRtXBod9CC0mivK";
const MAX_IN_PROGRESS_DURATION_HRS = 8;

const fetchUnitRecords = async(housingID) => {
  const table = base(UNITS_TABLE);
  return table.select({
    filterByFormula: `{ID (from Housing)} = "${housingID}"`
  })
  .all()
  .then(records => {
    return records.map(x => x._rawJson);
  });
}

const fetchHousingRecord = async(housingID) => {
  const table = base(HOUSING_DATABASE_TABLE);
  return table.select({
    filterByFormula: `{DISPLAY_ID} = "${housingID}"`
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return;
    }
    return records[0]._rawJson;
  });
}

const fetchQueueRecordId = async(campaign, housingID) => {
  if (!housingID) {
    return;
  }
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  return records = table.select({
    fields: [],
    sorts : [{field: "ID", direction: "desc"}],
    filterByFormula: `AND({CAMPAIGN} = "${campaign}", {_DISPLAY_ID} = "${housingID}")`,
    maxRecords: 1,
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return;
    }
    return records[0].id;
  });
}

const markInProgressInQueue = async(recordId) => {
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let now = new Date();
  return table.update(recordId, {"IN_PROGRESS_DATETIME": now.toISOString()});
}

const fetchQueueData = async(campaign) => {
  // TODO: allow in progress items to be returned if forced.
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  const staleInProgress = new Date(Date.now() - (MAX_IN_PROGRESS_DURATION_HRS * 60 * 60 * 1000));
  // let filterFormula = `
  //   AND(
  //     {CAMPAIGN} = "${campaign}",
  //     {COMPLETED_DATETIME} = BLANK(),
  //     OR(
  //       {IN_PROGRESS_DATETIME} = BLANK(),
  //       IS_BEFORE({IN_PROGRESS_DATETIME}, "${inProgressExpirationStr}")
  //     )
  //   )`;
  let filterFormula = `{CAMPAIGN} = "${campaign}"`;
  return table.select({
    fields: ["ID", "_DISPLAY_ID", "IN_PROGRESS_DATETIME", "COMPLETED_DATETIME"],
    filterByFormula: filterFormula,
    sort: [{field: "_MANAGEMENT_COMPANY", direction: "asc"},
           {field: "_DISPLAY_ID", direction: "asc"}],
  })
  .all()
  .then(records => {
    let numTotalItems = records.length;
    let completedItems = [];
    let inProgressItems = [];
    let todoItems = [];
    for (record of records) {
      if (record.get("COMPLETED_DATETIME")) {
        completedItems.push(record);
      } else if (record.get("IN_PROGRESS_DATETIME") && Date.parse(record.get("IN_PROGRESS_DATETIME")) > staleInProgress) {
        inProgressItems.push(record);
      } else {
        todoItems.push(record);
      }
    }
    let queueData = {
      numCompleted: completedItems.length,
      numInProgress: inProgressItems.length,
      numTodo: todoItems.length,
      numTotal: records.length,
      thisItem: {
        housingId: todoItems.length > 0 ? todoItems[0].get("_DISPLAY_ID")[0] : "",
        recordId: todoItems.length > 0 ? todoItems[0].id : "",
      },
    };
    console.log(queueData);
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
  let data = {housing: {}, units: [], queue: {}};
  if (params.length >= 1) {
    campaign = params[0];
  }
  if (params.length >= 2) {
    housingId = params[1];
  }

  console.log("fetching queue data");
  let queueData = await Promise.all([fetchQueueRecordId(campaign, housingId), fetchQueueData(campaign)]);
  let queueRecordIdOverride = queueData[0]; // Get the matching queue item for the given housing ID (if there is one).
  console.log(`queueRecordIdOverride = ${queueRecordIdOverride}`);
  data.queue = queueData[1];

  if (queueRecordIdOverride) {
    // A housing ID was given explicitly in the URL, and it matches an existing queue item.  Thus,
    // override whatever the queue says is next up with the queue record data for the housing ID given.
    data.queue.thisItem.recordId = queueRecordIdOverride;
    data.queue.thisItem.housingId = housingId;
  }

  if (!housingId) {
    // Set the housing ID based on the next property in the queue.
    housingId = data.queue.thisItem.housingId;
  }

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
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};