const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_CHANGE_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";
const HOUSING_DATABASE_TABLE = "tbl8LUgXQoTYEw2Yh";
const UNITS_TABLE = "tblRtXBod9CC0mivK";

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
    return records[0]._rawJson;
  });
}

const markInProgressInQueue = async(recordId) => {
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let now = new Date();
  return table.update(recordId, {"IN_PROGRESS_DATETIME": now.toISOString()});
}

const fetchNextHousingId = async(campaign) => {
  // TODO: allow in progress items to be returned if forced.
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  const staleInProgress = new Date(Date.now() - (8 * 60 * 60 * 1000));
  //const inProgressTtlStr = inProgressExpiration.toISOString();
  console.log((new Date()).toISOString());
  console.log(staleInProgress);
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
  console.log(filterFormula);
  return table.select({
    fields: ["ID", "_DISPLAY_ID", "IN_PROGRESS_DATETIME", "COMPLETED_DATETIME"],
    filterByFormula: filterFormula,
    sort: [{field: "_MANAGEMENT_COMPANY", direction: "asc"},
           {field: "_DISPLAY_ID", direction: "asc"}],
  })
  .all()
  .then(records => {
    console.log(JSON.stringify(records.map(x => x.fields), null, 2));
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
    console.log(JSON.stringify(completedItems.map(x => x.fields), null, 2));
    console.log("------------");
    console.log(JSON.stringify(inProgressItems.map(x => x.fields), null, 2));
    console.log("------------");
    console.log(JSON.stringify(todoItems.map(x => x.fields), null, 2));
    return {
      numCompleted: completedItems.length,
      numInProgress: inProgressItems.length,
      numTodo: todoItems.length,
      numTotal: records.length,
      thisProperty: {
        id: todoItems.length > 0 ? todoItems[0].get("_DISPLAY_ID")[0] : "",
        recordId: todoItems.length > 0 ? todoItems[0].id : "",
      },
    };
  });
}

exports.handler = async function(event) {
  console.log(event.path);
  // Get the campaign name from the URL
  const paramsStr = event.path.split("next-property/")[1];
  const params = paramsStr.split("/");
  let campaign = "";
  let housingId = "";
  let data = {housing: {}, units: [], queue: {}};
  if (params.length >= 1) {
    campaign = params[0];
  }
  if (params.length >= 2) {
    // TODO: mark this ID as in progress if it exists in the queue.
    housingId = params[1];
  }
  if (!housingId) {
    console.log("fetching next ID");
    data.queue = await fetchNextHousingId(campaign);
    housingId = data.queue.thisProperty.id;
  }

  if (housingId) {
    console.log("fetching unit records and housing record for ID: " + housingId);
    let housingData = await Promise.all([fetchHousingRecord(housingId), fetchUnitRecords(housingId)]);
    if (data.queue.thisProperty) {
      console.log("updating in progress status for ID: " + housingId);
      await markInProgressInQueue(data.queue.thisProperty.recordId);
    }
    data.housing = housingData[0];
    data.units = housingData[1];
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};