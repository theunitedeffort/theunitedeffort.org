const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_CHANGE_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";


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
      nextPropertyId: todoItems.length ? todoItems[0].get("_DISPLAY_ID")[0] : "",
    };
  });
}

exports.handler = async function(event) {
  console.log(event.path);
  // get the housing ID from the URL
  const campaign = event.path.split("next-property/")[1];
  let data = await fetchNextHousingId(campaign);
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};
