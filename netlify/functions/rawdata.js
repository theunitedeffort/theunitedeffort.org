const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

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

exports.handler = async function(event) {
  console.log(event.path);
  // get the housing ID from the URL
  const housingID = event.path.split("rawdata/")[1];
  let unitsRecords = await fetchUnitRecords(housingID);
  let housingRecord = await fetchHousingRecord(housingID);
  let data = {housing: housingRecord, units: unitsRecords};
  // console.log(JSON.stringify(data, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};
