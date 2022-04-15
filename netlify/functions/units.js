var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Make a definition list from all the data returned about this item
const metaData = (data) => {
  if (data[0]) {
    let meta = data[0].record;
    return `<dl>    
    <dt>Address</dt><dd>${meta["Address (from Housing)"]?.[0]|| " "}</dd>
    <dt>City</dt><dd>${meta["City (from Housing)"]?.[0]|| " "}</dd>
    <dt>Phone</dt><dd>${meta["Phone (from Housing)"]?.[0] || " "} </dd>
    <dt>Number of units</dt><dd>${meta["UNITS_CNT (from Housing)"]?.[0] || " "}</dd>
    <dt>Website</dt><dd><a href="${meta["URL (from Housing)"]?.[0] || " "}">${meta["URL (from Housing)"]?.[0] || " "}</a></dd>
    </dl>`;
  }
}


// Make a definition list from all the data returned about this item
const unitDetails = (data) => {
  let rows = [];
  for (item in data) {
    let unit = data[item].record;
    rows.push(`
      <td>${unit.TYPE}</td>
      <td>${unit.MAX_OCCUPANCY}</td>
      <td>${unit.STATUS}</td>
      <td>${unit.RENTS}</td>
      <td>${unit.min_income}</td>
      <td>${unit.max_income}</td>
    `);
  }
  return `<tr>${rows.join("</tr><tr>")}<tr>`;
}


const pageTemplate = (data) => {
  return `
  <html>
    <head>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
      <header>
        <a href="/">Home</a> |
        <a href="/affordable-housing/">Affordable housing list</a>
      </header>
      ${metaData(data)}
      <table>
        <thead>
          <tr>
            <td>Home type</td>
            <td>Max occupancy</td>
            <td>Status</td>
            <td>Rents ($)</td>
            <td>Min income</td>
            <td>Max income</td>
          </tr>
        </thead>
        <tbody>
        ${ unitDetails(data) }
        </tbody>
      </table>
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

        units.push({
          record: (records[record].fields)
        })

      }
      return units;


    });
};




exports.handler = async function(event) {

  // get the housing ID from the URL
  const props = event.path.split("affordable-housing/")[1];
  let housingID;

  const json = props.includes(".json");
  if (json) {
    housingID = props.split(".")[0];
  } else {
    housingID = props;
  }


  // Look up the property in the DB
  let data = await fetchData(housingID);
  if (json) {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json"
      }
    };
  } else {
    return {
      statusCode: 200,
      body: pageTemplate(data)
    };
  }


};
