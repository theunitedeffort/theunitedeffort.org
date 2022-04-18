var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Lookup data for this query from the Airtable API
const fetchData = async(query) => {
  const table = base("tblNLrf8RTiZdY5KN"); // Units table
  return table.select({
      view: "API all units",
      filterByFormula: query
    })
    .all()
    .then(records => {
      housingList = [];
      records.forEach(function(record) {
        housingList.push({
          id: record.get("ID (from Housing)"),
          apt_name: record.get("Address (from Housing)"),
        })
      });

      // return a set of de-duped results
      return Array.from(
        new Set(housingList.map((obj) => JSON.stringify(obj)))
      ).map((string) => JSON.parse(string));

    });
};




exports.handler = async function(event) {

  const { city, unitType } = event.queryStringParameters;

  let parameters = [];

  if (unitType) {
    let rooms = unitType.split(",");
    let roomsQuery = rooms.map((x) => `{TYPE} = '${x} Bedroom'`)
    parameters.push(`OR(${roomsQuery.join(",")})`);
  }

  if (city) {
    let cities = city.split(",");
    let cityQuery = cities.map((x) => `{City (from Housing)} = '${x}'`)
    parameters.push(`OR(${cityQuery.join(",")})`);
  }


  let query = `AND(${parameters.join(",")})`;
  console.log(query);

  // query the DB
  let data = await fetchData(query);
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};
