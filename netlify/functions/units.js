const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const pageTemplate = require("./includes/base.js");

const NO_RENT_STRING = "Call for rent";
const NO_MIN_INCOME_STRING = "Call for info";
const NO_MAX_INCOME_STRING = NO_MIN_INCOME_STRING;


// Make a definition list from all the data returned about this item
const metaData = (data) => {
  if (data[0]) {
    let meta = data[0].record;
    return `<dl>    
    <dt>Address</dt><dd>${meta["Address (from Housing)"]?.[0]|| " "}</dd>
    <dt>City</dt><dd>${meta["City (from Housing)"]?.[0]|| " "}</dd>
    <dt>Phone</dt><dd>${meta["Phone (from Housing)"]?.[0] || " "} </dd>
    <dt>Number of units</dt><dd>${meta["UNITS_CNT (from Housing)"]?.[0] || " "}</dd>
    <dt>Website</dt><dd><a href="${meta["URL (from Housing)"]?.[0] || " "}" target="_BLANK" rel="noopener">${meta["URL (from Housing)"]?.[0] || " "}</a></dd>
    </dl>`;
  }
}

const formatCurrency = (value) => {
  return value.toLocaleString("en-US", {
    style: "currency", 
    maximumFractionDigits: 0, 
    minimumFractionDigits: 0, 
    currency: "USD"});
}

// Make a definition list from all the data returned about this item
const unitDetails = (data) => {
  let rows = [];
  for (item in data) {
    let unit = data[item].record;
    let rentStr = NO_RENT_STRING;
    let minIncomeStr = NO_MIN_INCOME_STRING;
    let maxIncomeStr = NO_MAX_INCOME_STRING;
    if (unit.RENT_PER_MONTH_USD) {
      rentStr = formatCurrency(unit.RENT_PER_MONTH_USD);
    }
    if (unit.MIN_INCOME_PER_YR_USD) {
      minIncomeStr = formatCurrency(unit.MIN_INCOME_PER_YR_USD);
    }
    if (unit.MAX_INCOME_PER_YR_USD) {
      maxIncomeStr = formatCurrency(unit.MAX_INCOME_PER_YR_USD);
    }
    rows.push(`
      <td>${unit.MAX_OCCUPANCY}</td>
      <td>${unit.STATUS}</td>
      <td>${rentStr}</td>
      <td>${minIncomeStr}</td>
      <td>${maxIncomeStr}</td>
    `);
  }
  return `<tr>${rows.join("</tr><tr>")}<tr>`;
}


const unitTables = (data) => {
  //let aptName = data[0].record["APT_NAME"]?.[0] || " ";
  let aptName = "The Apartment Name";  // TODO(trevorshannon)
  let tables = [];
  let unitTypes = Object.keys(data).sort();
  for (idx in unitTypes) {
    tables.push(`
      <h3>${unitTypes[idx]}</h3>
      <table>
        <thead>
          <tr>
            <td>Max occupancy</td>
            <td>Status</td>
            <td>Rent (per month)</td>
            <td>Min income (per year)</td>
            <td>Max income (per year)</td>
          </tr>
        </thead>
        <tbody>
        ${unitDetails(data[unitTypes[idx]])}
        </tbody>
      </table>
    `);
  }
  return `
      <h1>${aptName}</h1>
      ${metaData(data)}
      ${tables.join("")}
  `;
};


// Lookup data for this item from the Airtable API
const fetchData = async(housingID) => {
  const table = base("tblNLrf8RTiZdY5KN"); // Units table
  let newunits = {};
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
        let unitKey = records[record].fields.TYPE;
        newunits[unitKey] = newunits[unitKey] || [];
        newunits[unitKey].push({record: records[record].fields});
      }
      console.log(newunits);
      return newunits;
    });
};




exports.handler = async function(event) {

  // get the housing ID from the URL
  const props = event.path.split("affordable-housing/")[1];
  let housingID;

  // determine if we'll return a view of the json data
  const json = props.includes(".json");
  if (json) {
    housingID = props.split(".")[0];
  } else {
    housingID = props;
  }


  // Look up the property in the DB
  let data = await fetchData(housingID);
  console.log(data);
  if (json) {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json"
      }
    };
  } else {
    const units = unitTables(data);
    return {
      statusCode: 200,
      body: pageTemplate(units)
    };
  }
};
