const markdown = require("marked");
const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
// This requirement is somehow not propagated from affordable-housing.11tydata.js
// so include it here to be sure it makes it into the serverless bundle.
const EleventyFetch = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblRtXBod9CC0mivK";
const HOUSING_DATABASE_TABLE = "tbl8LUgXQoTYEw2Yh";
const HOUSING_DATABASE_SCHEMA_TABLE = "tblfRhO6C1Pi0Ljwc";
const CHANGES_TABLE = "tblXy0hiHoda5UVSR";


module.exports = function(eleventyConfig) {

  //pass through static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });

  // Eleventy Serverless plugin
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless",
    functionsDir: "./netlify/functions/",
    copy: [
      // Files/directories that start with a dot
      // are not bundled by default.
      { from: ".cache", to: "cache" }
    ]
  });

  // Markdown filter
  eleventyConfig.addFilter("markdownify", (str) => {
    str = str.replaceAll("http:///", "/");
    return markdown.marked(str)
  });

  // Get all of the unique values of a property
  eleventyConfig.addFilter("index", function(collection, property) {
    let values = [];
    for (item in collection) {
      if (collection[item][property]) {
        values = values.concat(collection[item][property]);
      }
    }
    return [...new Set(values)];
  });

  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter("whereIncluded", function(collection, key, value) {
    let filtered = [];
    for (item in collection) {
      if (collection[item][key] && collection[item][key].includes(value)) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });
  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter("whereEmpty", function(collection, key) {
    let filtered = [];
    for (item in collection) {
      if (!collection[item][key]) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });

  eleventyConfig.addFilter("getFieldValue", function(record, fieldname) {
    let value = record.get(fieldname) || "";
    return value;
  });

  eleventyConfig.addFilter("stepFromPrecision", function(numPrecisionDigits) {
    return 10 ** (-1 * parseInt(numPrecisionDigits));
  });

  function removeHidden(fields, hiddenFields) {
    let filtered = [];
    for (const field of fields) {
      if (!hiddenFields.includes(field.name)){
        filtered.push(field);
      }
    }
    return filtered;
  }

  eleventyConfig.addFilter("removeHiddenHousingFields", function(fields){
    const hiddenFields = [
      "LOC_COORDS",
      "THIS_RECORD_ID",
      "LAST_MODIFIED_DATETIME",
      "UEO_URL",
      "LEGACY_ID",
      "TYPE (from UNITS)",
      "ID",
      "AFFORDABLEHOUSINGONLINE_URL",
    ]
    return removeHidden(fields, hiddenFields);
  });

  eleventyConfig.addFilter("removeHiddenUnitsFields", function(fields){
    const hiddenFields = [
      "ID",
      "APT_NAME",
      "HOUSING_LIST_ID",
      "Address (from Housing)",
      "MIN_YEARLY_INCOME_USD",
      "MAX_YEARLY_INCOME_LOW_USD",
      "MAX_YEARLY_INCOME_HIGH_USD",
      "ID (from Housing)",
      "City (from Housing)",
      "Prefilled Form URL",
      "ami_rent",
      "ami_max_income",
      "URL (from Housing)",
      "EMAIL (from Housing)",
      "Phone (from Housing)",
      "UNITS_CNT (from Housing)",
      "DISALLOWS_PUBLIC_APPLICATIONS (from Housing)",
      "LOC_COORDS (from Housing)",
      "[validation] rent * factor * 12",
      "[validation] ami_diff",
      "[validation] Min Income Discrepancy",
      "test_form_url",
      "LINKED_HOUSING_RECORD_ID",
      "LAST_MODIFIED_DATETIME",
      "UEO_URL (from Housing)",
      "IS_YOUTH_ONLY (from Housing)",
      "IS_SENIORS_ONLY (from Housing)",
      "MIN_RESIDENT_AGE (from Housing)",
      "MAX_RESIDENT_AGE (from Housing)",
      "PREFERS_LOCAL_APPLICANTS (from Housing)",
    ]
    return removeHidden(fields, hiddenFields);
  });

  eleventyConfig.addFilter("sortUnitType", function(values, property='') {
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
  });

  eleventyConfig.addFilter("sortAvailability", function(values, property='') {
    const ranking = new Map([
      ["Waitlist Open", 1],
      ["Waitlist Closed", 2],
      ["Call for Status", 3]
    ]);
    let sorted = values.sort(function(a, b) {
      let valA = property ? a[property] : a;
      let valB = property ? b[property] : b;
      // Rank values according to the map 'ranking' unless the value is not in 
      // the map.  Put the unknown values at the end in any order.
      let rankA = ranking.get(valA) || ranking.size;
      let rankB = ranking.get(valB) || ranking.size;
      return rankA - rankB;
    });
    return sorted;
  });

  eleventyConfig.addFilter("sortFields", function(values, property='') {
    const rankingList = [
      "DISPLAY_ID",
      "APT_NAME",
      "ADDRESS",
      "SECOND_ADDRESS",
      "CITY", 
      "ZIP_CODE",
      "COUNTY",
      "STATE",
      "PHONE",
      "EMAIL",
      "PROPERTY_URL",
      "UNITS_CNT",
      "MANAGEMENT_COMPANY",
      "PROPERTY_OWNER",
      "IS_SENIORS_ONLY",
      "IS_YOUTH_ONLY",
      "MIN_RESIDENT_AGE",
      "MAX_RESIDENT_AGE",
      "ACCEPTS_VOUCHERS",
      "PREFERS_LOCAL_APPLICANTS",
      "DISALLOWS_PUBLIC_APPLICATIONS",
      "UNITS",
    ];
    let ranking = new Map();
    for (var idx=0; idx < rankingList.length; idx++) {
      ranking.set(rankingList[idx], parseInt(idx) + 1);
    }
    console.log(ranking);

    let sorted = values.sort(function(a, b) {
      let valA = property ? a[property] : a;
      let valB = property ? b[property] : b;
      // Rank values according to the map 'ranking' unless the value is not in 
      // the map.  Put the unknown values at the end in any order.
      let rankA = ranking.get(valA) || (ranking.size + 1);
      let rankB = ranking.get(valB) || (ranking.size + 1);
      return rankA - rankB;
    });
    return sorted;
  });

  eleventyConfig.addFilter("numFiltersApplied", function(query){
    // TODO: Don't hardcode this list of filters here.
    const allowedFilters = ["city", "availability", "unitType", "propertyName",
      "rentMax", "income"];
    let count = 0;
    for (key in query) {
      if (allowedFilters.includes(key) && query[key]) {
        count++;
      }
    }
    return count;
  });

  // Add filter checkbox state from the query parameters to 'filterValues'. 
  eleventyConfig.addFilter("updateFilterState", function(filterValues, query) {
    // The AssetCache holding filterValues stores a buffered version of the
    // cached filterValues and does not read it in from the filesystem on each
    // page render. We need to be sure to not modify the original object, lest
    // those edits persist in the cached object.
    let filterValuesCopy = JSON.parse(JSON.stringify(filterValues));
    // If there is no query (such as on the affordable housing landing page)
    // there is no state to add to the filterValues.
    if (!query) { return filterValuesCopy; }

    // Updates the state of the FilterSection with the name 'filterName'
    // according to 'queryValue'
    function updateFilterSection(queryValue, filterName) {
      if (!queryValue) { return; }
      let selectedOptions = queryValue.split(", ");
      let filterIdx = filterValuesCopy.findIndex(f => f.name == filterName);
      if (filterIdx < 0) { return; }
      for (i = 0; i < selectedOptions.length; i++) {
        let idx = filterValuesCopy[filterIdx].options.findIndex(
          v => v.name === selectedOptions[i]);
        if (idx >= 0) {
          filterValuesCopy[filterIdx].options[idx].selected = true;
        }
      }
    }

    updateFilterSection(query.availability, "availability");
    updateFilterSection(query.city, "city");
    updateFilterSection(query.unitType, "unitType");
    return filterValuesCopy;
  });

  const fieldLabel = function(labelText, fields, fieldName, index="") {
    let tag = `<label for="${fields[fieldName].id}${index != "" ? ":" + index : ""}">${labelText}</label>`
    if (fields[fieldName].description) {
      console.log(fields[fieldName].description);
      tag += ` <span class="tooltip_entry">
<span class="icon_query"></span>
<span class="tooltip_content">${fields[fieldName].description.replace(/\n/g, "<br/>")}</span>
</span>`
    }
   return tag;
  }

  const formField = function(fields, fieldName, width="", index="") {
    let field = fields[fieldName];
    let tag = "";
    let options = "";
    let content = "";
    let endtag = "";
    let indexStr = index !== "" ? ":" + index : "";
    let style = width !== "" ? `style="width:${width};"` : "";
    if (field.type === "singleSelect") {
      tag = "select";
      endtag = "</select>"
      content += `<option></option>`;
      for (const choice of field.options.choices) {
        content += `<option value="${choice.name}" data-color="${choice.color}">${choice.name}</option>`;
      }
    } else if (field.type === "multipleSelects") {
      let checkboxes = [];
      for (const choice of field.options.choices) {
        let id = `${field.id}:${choice.name.replace(/\s/g, "-").toLowerCase()}${indexStr}`;
        checkboxes.push(`<input type="checkbox" id="${id}" name="${field.name}${indexStr}" value="${choice.name}" data-color="${choice.color}"> <label for="${id}">${choice.name}</label>`);
      }
      return checkboxes.join("<br/>");
    } else if (field.type === "multilineText") {
      tag = "textarea"
      endtag = "</textarea>"
    } else if (field.type === "number") {
      let precision = parseInt(field.options.precision);
      tag = "input"
      options = `type="number" min="0" step="${10 ** (-1 * precision)}"`
    } else if (field.type === "email") {
      tag = "input"
      options = `type="email"`
    } else if (field.type === "phoneNumber") {
      tag = "input"
      options = `type="tel"`
    } else if (field.type === "singleLineText" || field.type === "url") {
      tag = "input"
      options = `type="text"`
    } else if (field.type === "checkbox") {
      tag = "input"
      options = `type="checkbox"`
    } else {
      return "";
    }
    return `<${tag} id="${field.id}${indexStr}" name="${field.name}${indexStr}" ${options} ${style}>${content}${endtag}`;
  }

  eleventyConfig.addShortcode("fieldLabel", function(labelText, fields, fieldName) {
    return fieldLabel(labelText, fields, fieldName);
  });

  eleventyConfig.addShortcode("indexFieldLabel", function(index, labelText, fields, fieldName) {
    return fieldLabel(labelText, fields, fieldName, index);
  });

  eleventyConfig.addShortcode("formField", function(fields, fieldName, width="") {
    return formField(fields, fieldName, width);
  });

  eleventyConfig.addShortcode("indexFormField", function(index, fields, fieldName, width="") {
    return formField(fields, fieldName, width, index);
  });

  // Gets a subset of all housing results from Airtable based on 'query'.
  eleventyConfig.addFilter("housingResults", async function(query) {
    console.log("housing query: " + query);
    // let asset = new EleventyFetch.AssetCache("housing_results");
    // if (!process.env.ELEVENTY_SERVERLESS && !query && asset.isCacheValid("1d")) {
    //   console.log("Returning cached housing list.");
    //   let housing = await asset.getCachedValue();
    //   return housing;
    // }
    const queryStr = buildQueryStr(query);
    console.log("Fetching housing list.");
    let housing = await fetchHousingList(queryStr);
    console.log("got " + housing.length + " properties.")
    // if (query) {
    //   console.log(JSON.stringify(housing, null, 4));
    // }
    // await asset.save(housing, "json");
    return housing;
  });

  // eleventyConfig.addFilter("saveChangesFormResponses", async function(responses) {
  //   const table = base(CHANGES_TABLE);
  //   await table.create({
  //     "CAMPAIGN": "First Campaign",
  //     "FORM_RESPONSE_JSON": responses;
  //   }, function(err, record) {
  //     if (err) {
  //       console.error(err);
  //       return false;
  //     }
  //     console.log(record.getId());
  //   });
  //   return true;
  // });

  // Generates an Airtable filter formula string based on 'query'.
  const buildQueryStr = function(query) {
    if (!query) { return ""; }
    const {
      availability,
      city,
      unitType,
      rentMin,
      rentMax,
      income,
      includeUnknownRent,
      includeUnknownIncome,
      propertyName
    } = query;

    let parameters = [];

    if (unitType) {
      let rooms = unitType.split(", ");
      let roomsQuery = rooms.map((x) => `{TYPE} = '${x}'`)
      parameters.push(`OR(${roomsQuery.join(",")})`);
    }

    if (city) {
      let cities = city.split(", ");
      let cityQuery = cities.map((x) => `{City (from Housing)} = '${x}'`);
      parameters.push(`OR(${cityQuery.join(",")})`);
    }

    if (availability) {
      let availabilities = availability.split(", ");
      let availabilityQuery = availabilities.map((x) => `{STATUS} = '${x}'`);
      parameters.push(`OR(${availabilityQuery.join(",")})`);
    }

    if (rentMax) {
      let rentMaxParams = [`{RENT_PER_MONTH_USD} <= '${rentMax}'`];
      // Airtable says that blank (unknown) rents are == 0, so records with
      // unknown rents will automatically be included in a simple "rent <= max"
      // filter.  If user does not want records with unknown rent, explicitly
      // exclude records with blank rent values by first casting to a string as
      // suggested in 
      // https://community.airtable.com/t/blank-zero-problem/5662/13
      if (!includeUnknownRent) {
        rentMaxParams.push(`({RENT_PER_MONTH_USD} & "")`);
      }
      parameters.push(`AND(${rentMaxParams.join(",")})`);
    }
    if (income) {
      let incomeMinParams = [`{MIN_YEARLY_INCOME_USD} <= '${income}'`];
      let incomeMaxParams = [`{MAX_YEARLY_INCOME_HIGH_USD} >= '${income}'`];
      let incomeOp = "OR";
      if (includeUnknownIncome) {
        incomeMinParams.push(`NOT({MIN_YEARLY_INCOME_USD} & "")`);
        incomeMaxParams.push(`NOT({MAX_YEARLY_INCOME_HIGH_USD} & "")`);
      } else {
        incomeMinParams.push(`({MIN_YEARLY_INCOME_USD} & "")`);
        incomeMaxParams.push(`({MAX_YEARLY_INCOME_HIGH_USD} & "")`);
        incomeOp = "AND"
      }
      parameters.push(
        `AND(${incomeOp}(${incomeMinParams.join(",")}),` +
        `${incomeOp}(${incomeMaxParams.join(",")}))`);
    }
    if (propertyName) {
      // APT_NAME is a lookup field which is by default an array (in this case with a single entry).
      parameters.push(`FIND(LOWER('${propertyName}'), LOWER(ARRAYJOIN({APT_NAME}, ''))) > 0`);
    }

    let queryStr = `AND(${parameters.join(",")})`;
    console.log("Airtable query:");
    console.log(queryStr);
    return queryStr;
  };

  eleventyConfig.addFilter("housingRecord", async function(displayId) {
    console.log("Getting record for Housing Database DISPLAY_ID = " + displayId);
    let housingRecord = await fetchHousingRecord(displayId);
    console.log(housingRecord);
    return housingRecord;
  });

  eleventyConfig.addFilter("unitsRecords", async function(displayId) {
    console.log("Getting records for Units DISPLAY_ID = " + displayId);
    let unitsRecords = await fetchUnitsRecords(displayId);
    console.log(unitsRecords);
    return unitsRecords;
  });

  eleventyConfig.addFilter("housingFields", async function(x) {
    return fetchHousingSchema();
  });


  // Get housing units from Airtable, filtered by the Airtable formula string
  // 'queryStr'.
  const fetchHousingList = async(queryStr) => {
    let housingList = [];
    const table = base(UNITS_TABLE);

    return table.select({
        view: "API all units",
        filterByFormula: queryStr
      })
      .all()
      .then(records => {
        records.forEach(function(record) {
          housingList.push({
            id: record.get("ID (from Housing)")?.[0] || "",
            aptName: record.get("APT_NAME")?.[0] || "",
            address: record.get("Address (from Housing)")?.[0] || "",
            city: record.get("City (from Housing)")?.[0] || "",
            units: {unitType: record.get("TYPE"), openStatus: record.get("STATUS")},
            locCoords: record.get("LOC_COORDS (from Housing)")?.[0] || "",
            phone: record.get("Phone (from Housing)")?.[0] || "",
            website: record.get("URL (from Housing)")?.[0] || "",
            email: record.get("EMAIL (from Housing)")?.[0] || ""
          })
        });

        // Get a map from housing id to all associated unit type, status pairs.
        let typeById = {};
        for (idx in housingList) {
          let unitId = housingList[idx].id;
          typeById[unitId] = typeById[unitId] || new Set();
          typeById[unitId].add(JSON.stringify({
            unitType: housingList[idx].units.unitType,
            openStatus: housingList[idx].units.openStatus}));
        }

        // Use the housingId:(unitType,openStatus) map to rewrite the units of each record
        // to be a list of all the units at the property with housingId. This will result
        // in some duplicate entries, but those will be filtered out next.
        for (idx in housingList) {
          let unitsStrArray = [...typeById[housingList[idx].id]];
          housingList[idx].units = unitsStrArray.map((x) => JSON.parse(x));
        }

        // De-duplicate results which can be present if the same unit is offered
        // at different rents for different income levels or if the same property has multiple 
        // units on offer.
        return Array.from(
          new Set(housingList.map((obj) => JSON.stringify(obj)))
        ).map((string) => JSON.parse(string));
      });
  };

  const fetchHousingSchema = async() => {
    const table = base(HOUSING_DATABASE_SCHEMA_TABLE);

    return table.select({
      fields: ["HOUSING_DATABASE_FIELDS_JSON", "UNITS_FIELDS_JSON"],
      maxRecords: 1,
      sort: [{field: "ID", direction: "asc"}]
    })
    .all()
    .then(records => {
      housingDbFields = JSON.parse(records[0].get("HOUSING_DATABASE_FIELDS_JSON"));
      unitsFields = JSON.parse(records[0].get("UNITS_FIELDS_JSON"));
      return {
        housingDatabase: Object.fromEntries(housingDbFields.map((x) => [x.name, x])),
        units: Object.fromEntries(unitsFields.map((x) => [x.name, x])),
      };
    });
  };

  const fetchHousingRecord = async(displayId) => {
    if (!displayId) {
      return "";
    }
    const table = base(HOUSING_DATABASE_TABLE);

    return table.select({
      filterByFormula: `DISPLAY_ID = ${displayId}`,
      maxRecords: 1
    })
    .all()
    .then(records => {
      return records[0];
      });
  };

  const fetchUnitsRecords = async(displayId) => {
    if (!displayId) {
      return "";
    }
    const table = base(UNITS_TABLE);

    return table.select({
      filterByFormula: `{ID (from Housing)} = ${displayId}`,
    })
    .all()
    .then(records => {
      return records;
    });
  };

  // Sass pipeline
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: function(contents, includePath) {
      let includePaths = [this.config.dir.includes];
      return () => {
        let ret = sass.renderSync({
          file: includePath,
          includePaths,
          data: contents,
          outputStyle: "compressed"
        });
        return ret.css.toString("utf8");
      }
    }
  });

  return {
    dir: {
      input: "src/site",
      output: "dist"
    }
  }
};