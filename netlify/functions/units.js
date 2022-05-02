const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const pageTemplate = require("./includes/base.js");

const NO_RENT_STRING = "Call for rent";
const NO_MIN_INCOME_STRING = "Call for info";
const NO_MAX_INCOME_STRING = NO_MIN_INCOME_STRING;


// Make a definition list from all the data returned about this item
const metaData = (units) => {
  let aptName = units.metadata.aptName || "Apartment Listing";
  let heading = `<h1>${aptName}</h1>`
  let definitions = [];
  for (key in units.metadata) {
    if (key === 'aptName') { continue; }
    definitions.push(`<dt>${key}</dt><dd>${units.metadata[key]}</dd>`);
    // TODO (trevorshannon): add link a tag.
  }
  return `
    ${heading}
    <dl>${definitions.join("")}</dl>`;
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


const unitTables = (units) => {
  let tables = [];
  let unitTypes = Object.keys(units.data).sort();
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
        ${unitDetails(units.data[unitTypes[idx]])}
        </tbody>
      </table>
    `);
  }
  return `
      ${metaData(units)}
      ${tables.join("")}
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
      let units = {"metadata": {}, "data": []};
      if (records[0]){
        console.log(records[0]);
        units.metadata["aptName"] = (
          records[0].fields["APT_NAME"]?.[0]|| " ");
        units.metadata["Address"] = (
          records[0].fields["Address (from Housing)"]?.[0]|| " ");
        units.metadata["City"] = (
          records[0].fields["City (from Housing)"]?.[0]|| " ");
        units.metadata["Phone"] = (
          records[0].fields["Phone (from Housing)"]?.[0]|| " ");
        units.metadata["Number of Units"] = (
          records[0].fields["UNITS_CNT (from Housing)"]?.[0]|| " ");
        units.metadata["Website"] = (
          records[0].fields["URL (from Housing)"]?.[0]|| " ");
      }
      for (record in records) {
        let unitKey = records[record].fields.TYPE;
        units.data[unitKey] = units.data[unitKey] || [];
        units.data[unitKey].push({record: records[record].fields});
      }
      console.log(units);
      return units;
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
