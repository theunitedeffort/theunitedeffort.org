const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const pageTemplate = require("./includes/base.js");

const NO_DATA_STRING = "Call for info";
const NO_RENT_STRING = "Call for rent";
const NO_MIN_INCOME_STRING = NO_DATA_STRING;
const NO_MAX_INCOME_STRING = NO_DATA_STRING;
const NO_MAX_OCCUPANCY_STRING = NO_DATA_STRING;
const UNITS_TABLE = "tblRtXBod9CC0mivK"


// Make a definition list from all the data returned about this item
const metaData = (units) => {
  let aptName = units.metadata.aptName || "Apartment Listing";
  let definitions = [];
  for (key in units.metadata) {
    if (key === "aptName") { continue; }
    let value = units.metadata[key];
    if (key === "Website") {
      value = `<a href="${value}" target="_BLANK" rel="noopener">${value}</a>`
    }
    definitions.push(`<tr><td class="definition_term">${key}</td><td class="definition">${value}</td></tr>`);
  }
  return `
    <h1>${aptName}</h1>
    <table class="deflist">${definitions.join("")}</table>`;
}

const formatCurrency = (value) => {
  return value.toLocaleString("en-US", {
    style: "currency", 
    maximumFractionDigits: 0, 
    minimumFractionDigits: 0, 
    currency: "USD"});
}

const sortUnitTypes = (values, property='') => {
  let sorted = values.sort(function(a, b) {
    let valA = property ? a[property] : a;
    let valB = property ? b[property] : b;
    // Return < 0 if 'a' should go before 'b'
    // Return > 0 if 'b' should go before 'a'
    if ((valA === "SRO" && valB === "Studio") || // SRO before Studio.
        (valA === "SRO" || valA === "Studio") || // SRO/Studio always first.
        (valB === "Others")) { // Others always last.
      return -1; 
    }
    if ((valA === "Studio" && valB === "SRO") || // SRO before Studio
        (valB === "SRO" || valB === "Studio") || // SRO/Studio always first.
        (valA === "Others")) { // Others always last.
      return 1;
    }
    if (valA < valB) {
      return -1;
    }
    if (valA > valB) {
      return 1;
    }
    return 0;
  });
  return sorted;
}

// Make a definition list from all the data returned about this item
const unitDetails = (data) => {
  let rows = [];
  for (item in data) {
    let unit = data[item].record;
    let rentStr = NO_RENT_STRING;
    let minIncomeStr = NO_MIN_INCOME_STRING;
    let maxIncomeStr = NO_MAX_INCOME_STRING;
    let minIncomeInfo = "";
    let maxIncomeInfo = "";
    if (unit.RENT_PER_MONTH_USD) {
      rentStr = formatCurrency(unit.RENT_PER_MONTH_USD);
    }
    if (unit.MIN_YEARLY_INCOME_USD) {
      minIncomeStr = formatCurrency(unit.MIN_YEARLY_INCOME_USD);
    }
    if (unit.MAX_YEARLY_INCOME_LOW_USD && unit.MAX_YEARLY_INCOME_HIGH_USD) {
      // TODO: test this equality logic
      if (unit.MAX_YEARLY_INCOME_LOW_USD == unit.MAX_YEARLY_INCOME_HIGH_USD) {
        maxIncomeStr = formatCurrency(unit.MAX_YEARLY_INCOME_LOW_USD);
      } else {
       maxIncomeStr = `${formatCurrency(unit.MAX_YEARLY_INCOME_LOW_USD)} to ${formatCurrency(unit.MAX_YEARLY_INCOME_HIGH_USD)}`;
      }    
    }
    if (unit.MIN_YEARLY_INCOME_USD && 
        unit.MIN_INCOME_RENT_FACTOR && 
        !unit.OVERRIDE_MIN_YEARLY_INCOME_USD) {
      minIncomeInfo = `<span class="tooltip_entry"><i class="fa-solid fa-circle-info"></i><span class="tooltip_content">Calculated as ${unit.MIN_INCOME_RENT_FACTOR} times yearly rent</span></span>`;
    }
    // TODO: Make a "has details" field?
    if (unit.MAX_YEARLY_INCOME_LOW_USD && 
        unit.MAX_YEARLY_INCOME_HIGH_USD &&
        (unit.MAX_YEARLY_INCOME_HH_1_USD ||
         unit.MAX_YEARLY_INCOME_HH_2_USD ||
         unit.MAX_YEARLY_INCOME_HH_3_USD ||
         unit.MAX_YEARLY_INCOME_HH_4_USD ||
         unit.MAX_YEARLY_INCOME_HH_5_USD ||
         unit.MAX_YEARLY_INCOME_HH_6_USD ||
         unit.MAX_YEARLY_INCOME_HH_7_USD ||
         unit.MAX_YEARLY_INCOME_HH_8_USD ||
         unit.MAX_YEARLY_INCOME_HH_9_USD ||
         unit.MAX_YEARLY_INCOME_HH_10_USD ||
         unit.MAX_YEARLY_INCOME_HH_11_USD ||
         unit.MAX_YEARLY_INCOME_HH_12_USD)) {
      let detailStrs = [];
      for(idx=0; idx<12; idx++) {
        let householdSize = idx + 1;
        let field = `MAX_YEARLY_INCOME_HH_${householdSize}_USD`;
        let value = unit[field];
        if (!value || (unit.MAX_OCCUPANCY && householdSize > unit.MAX_OCCUPANCY)) {
          continue;
        }
        detailStrs.push(`Household of ${householdSize}: ${formatCurrency(value)}`);
      }
      maxIncomeInfo = `<span class="tooltip_entry"><i class="fa-solid fa-circle-info"></i><span class="tooltip_content">${detailStrs.join("<br/>")}</span></span>`;
    }
    rows.push(`
      <td>${minIncomeStr} ${minIncomeInfo}</td>
      <td>${maxIncomeStr} ${maxIncomeInfo}</td>
      <td>${rentStr}</td>
    `);
  }
  return `<tr>${rows.join("</tr><tr>")}<tr>`;
}


const unitTables = (units) => {
  let tables = [];
  let unitTypes = sortUnitTypes(Object.keys(units.data));
  for (idx in unitTypes) {
    // 'units' is guaranteed to have at least one item for each key
    // based on how it is generated in fetchData. Max occupancy and status
    // should always be the same in every entry for a given rental property &
    // unit type, so just take the first one here.
    let maxOccupancy = units.data[unitTypes[idx]][0].record.MAX_OCCUPANCY || NO_MAX_OCCUPANCY_STRING;
    let openStatus = units.data[unitTypes[idx]][0].record.STATUS;
    let statusBadgeClass = "badge__warn";
    if (openStatus === "Waitlist Closed") {
      statusBadgeClass = "badge__bad";
    } else if (openStatus === "Waitlist Open") {
      statusBadgeClass = "badge__ok";
    }
    tables.push(`
      <h3>${unitTypes[idx]} <span class="badge ${statusBadgeClass}">${openStatus}</span></h3>
      Maximum occupancy: ${maxOccupancy}
      <table>
        <thead>
          <tr>
            <th>Min income (per year)</th>
            <th>Max income (per year)</th>
            <th>Rent (per month)</th>
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
  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units",
      filterByFormula: `HOUSING_LIST_ID = "${housingID}"`
    })
    .all()
    .then(records => {
      let units = {"metadata": {}, "data": []};
      if (records[0]){
        units.metadata["aptName"] = (
          records[0].fields["APT_NAME"]?.[0]|| " ");
        units.metadata["Address"] = (
          records[0].fields["Address (from Housing)"]?.[0]|| " ");
        units.metadata["City"] = (
          records[0].fields["City (from Housing)"]?.[0]|| " ");
        units.metadata["Units"] = (
          records[0].fields["UNITS_CNT (from Housing)"]?.[0]|| " ");
        units.metadata["Phone"] = (
          records[0].fields["Phone (from Housing)"]?.[0]|| " ");
        units.metadata["Website"] = (
          records[0].fields["URL (from Housing)"]?.[0]|| " ");
      }
      for (record in records) {
        let unitKey = records[record].fields.TYPE;
        units.data[unitKey] = units.data[unitKey] || [];
        units.data[unitKey].push({record: records[record].fields});
      }
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
