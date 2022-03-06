var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Make a definition list from all the data returned about this item
const listDetails = (details) => {
  let rows = [];
  for (item in details) {
    rows.push(`<dt>${item}</dt><dd>${details[item]}</dd>`)
  }
  return `<dl>${rows.join("")}</dl>`;
}


const pageTemplate = (data) => {
  return `
  <html>
    <body>
      <code>${ listDetails(data) }</code>
    <body>
  </html>
  `;
};


// Lookup data for this item from the Airtable API
const fetchData = async(housingID) => {
  const table = base("tbl4X57cCTxhRxoPs"); // Housing table
  return table.select({
      view: "API all housing",
      filterByFormula: `ID = "${housingID}"`
    })
    .all()
    .then(records => {
      let record = records[0];
      return {
        id: record.get("ID"),
        apt_name: record.get("APT_NAME"),
        record: record.fields
      };
    });
};




exports.handler = async function(event) {

  // get the housing ID from the URL
  const housingID = event.path.split("affordable-housing/")[1];

  // Look up the property in the DB
  let data = await fetchData(housingID);
  return {
    statusCode: 200,
    body: pageTemplate(data)
  };

};
