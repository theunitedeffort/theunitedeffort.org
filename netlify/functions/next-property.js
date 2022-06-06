const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_DATABASE_TABLE = "tbl8LUgXQoTYEw2Yh";


const fetchNextHousingId = async(thisHousingID) => {
  const table = base(HOUSING_DATABASE_TABLE);
  return table.select({
    fields: ["DISPLAY_ID"],
    filterByFormula: `{DISPLAY_ID} > "${thisHousingID}"`,
    sort: [{field: "DISPLAY_ID", direction: "asc"}],
    maxRecords: 1,
  })
  .all()
  .then(records => {
    if (records[0]) {
      return records[0].fields["DISPLAY_ID"];
    }
    return "";
  });
}

exports.handler = async function(event) {
  console.log(event.path);
  // get the housing ID from the URL
  const housingID = event.path.split("next-property/")[1];
  let nextHousingId = await fetchNextHousingId(housingID);
  let data = {nextId: nextHousingId};
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};
