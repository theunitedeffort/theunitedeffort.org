const markdown = require("marked");
const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
// This requirement is somehow not propagated from affordable-housing.11tydata.js
// so include it here to be sure it makes it into the serverless bundle.
const EleventyFetch = require("@11ty/eleventy-fetch");

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblNLrf8RTiZdY5KN";


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
    // If there is no query (such as on the affordable housing landing page)
    // there is no state to add to the filterValues.
    if (!query) { return filterValues; }

    // Updates the state of the FilterSection with the name 'filterName'
    // according to 'queryValue'
    function updateFilterSection(queryValue, filterName) {
      if (!queryValue) { return; }
      let selectedOptions = queryValue.split(", ");
      let filterIdx = filterValues.findIndex(f => f.name == filterName);
      if (filterIdx < 0) { return; }
      for (i = 0; i < selectedOptions.length; i++) {
        let idx = filterValues[filterIdx].options.findIndex(
          v => v.name === selectedOptions[i]);
        if (idx >= 0) {
          filterValues[filterIdx].options[idx].selected = true;
        }
      }
    }

    updateFilterSection(query.availability, "availability");
    updateFilterSection(query.city, "city");
    updateFilterSection(query.unitType, "unitType");
    return filterValues;
  });

  // Gets a subset of all housing results from Airtable based on 'query'.
  eleventyConfig.addFilter("housingResults", async function(query) {
    console.log("housing query: ");
    console.log(query);
    const queryStr = buildQueryStr(query);
    let housing = await fetchHousingList(queryStr);
    console.log("got " + housing.length + " properties.")
    // if (query) {
    //   console.log(JSON.stringify(housing, null, 4));
    // }
    return housing;
  });

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
      let incomeMinParams = [`{MIN_INCOME_PER_YR_USD} <= '${income}'`];
      let incomeMaxParams = [`{MAX_INCOME_PER_YR_USD} >= '${income}'`];
      let incomeOp = "OR";
      if (includeUnknownIncome) {
        incomeMinParams.push(`NOT({MIN_INCOME_PER_YR_USD} & "")`);
        incomeMaxParams.push(`NOT({MAX_INCOME_PER_YR_USD} & "")`);
      } else {
        incomeMinParams.push(`({MIN_INCOME_PER_YR_USD} & "")`);
        incomeMaxParams.push(`({MAX_INCOME_PER_YR_USD} & "")`);
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
            website: record.get("URL (from Housing)")?.[0] || ""
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