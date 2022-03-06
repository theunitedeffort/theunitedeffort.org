var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Make a definition list from all the data returned about this item
const unitDetails = (data) => {
  let rows = [];
  for (item in data) {
    let unit = data[item].record;
    console.log(`unit`, unit);

    rows.push(`
      <td>${unit.TYPE}</td>
      <td>${unit.MAX_OCCUPANCY}</td>
      <td>${unit.STATUS}</td>
      <td>${unit.RENTS}</td>
      <td>${unit.min_income}</td>
      <td>${unit.max_income}</td>
      <td>${unit["City (from Housing)"][0]}</td>
      <td>${unit["Address (from Housing)"][0]}</td>
      <td>${unit["Phone (from Housing)"][0]}</td>
      <td><a href="${unit["URL (from Housing)"][0]}">${unit["URL (from Housing)"][0]}</a></td>
    `);
  }
  return `<tr>${rows.join("</tr><tr>")}<tr>`;
}


const pageTemplate = (data) => {
  return `
  <html>
    <body>
      <table>${ unitDetails(data) }</table>
    <body>
  </html>
  `;
};


// Lookup data for this item from the Airtable API
const fetchData = async(housingID) => {
  const table = base("tblNLrf8RTiZdY5KN"); // Units table
  return table.select({
      view: "API all units",
      filterByFormula: `HOUSING_LIST_ID = "${housingID}"`
    })
    .all()
    .then(records => {
      let units = [];
      for (record in records) {
        // console.log(`record`, JSON.stringify(records[record]));

        units.push({
          record: (records[record].fields)
        })

      }
      return units;


    });
};




exports.handler = async function(event) {

  // get the housing ID from the URL
  const housingID = event.path.split("units/")[1];

  // Look up the property in the DB
  let data = await fetchData(housingID);
  return {
    statusCode: 200,
    body: pageTemplate(data)
  };

};
