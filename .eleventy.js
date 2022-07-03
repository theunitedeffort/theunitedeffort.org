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

// This is a global sort ranking for all filter options.  
// It assumes no name collisions.
// Highest rank = 1.
// Force an item to be ranked last every time with rank = -1.
const SORT_RANKING = new Map([
  // Unit Type
  ["SRO", 1],
  ["Studio", 2],
  ["Others", -1],
  // Availability
  ["Waitlist Open", 1],
  ["Waitlist Closed", 2],
  ["Call for Status", 3],
  // Populations Served
  ["General Population", 1],
  ["Seniors", 2],
  ["Youth", 3],
  ["Developmentally Disabled", 4],
  ["Physically Disabled", 5],
]);


module.exports = function(eleventyConfig) {

  // Pass through static assets and client-side js files.
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });
  eleventyConfig.addPassthroughCopy({ "src/site/_includes/js": "/js" });

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

  // Generates a URL query string from Eleventy serverless query parameters.
  eleventyConfig.addFilter("queryString", function(queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    return searchParams.toString();
  });

  // Formats a value as USD with no decimals.
  eleventyConfig.addFilter("money", function(value) {
    return formatCurrency(value);
  });

  // Sorts items according to the ranking defined in SORT_RANKING.
  eleventyConfig.addFilter("rankSort", function(values, property="") {
    let sorted = values.sort(function(a, b) {
      let valA = property ? a[property] : a;
      let valB = property ? b[property] : b;
      let rankA = SORT_RANKING.get(valA);
      let rankB = SORT_RANKING.get(valB);
      // Special handling for the -1 rank, which is always sorted last.
      if (rankB < 0) {
        return -1;
      } else if (rankA < 0) {
        return 1;
      // Sort by rank if both items have one.
      } else if (rankA && rankB) {
        return rankA - rankB;
      // Put unranked items after the ranked ones.
      } else if (rankA && !rankB) {
        return -1;
      } else if (!rankA && rankB) {
        return 1;
      // Sort unranked items alphabetically.
      } else if (valA < valB) {
        return -1;
      } else if (valA > valB) {
        return 1;
      }
      return 0;
    });
    return sorted;
  });

  eleventyConfig.addFilter("numFiltersApplied", function(query){
    // TODO: Don't hardcode this list of filters here.
    const allowedFilters = [
      "city", 
      "availability", 
      "unitType", 
      "propertyName",
      "rentMax", 
      "income", 
      "populationsServed", 
      "wheelchairAccessibleOnly",
      "includeReferrals",
    ];
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
    for (section in query){
      updateFilterSection(query[section], section);
    }

    return filterValuesCopy;
  });

  // Converts "camelCaseString" to "Camel Case String".
  // https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
  const camelCaseToSpaces = function(str) {
    // Insert space before each capital letter.
    let spaced = str.replace(/([A-Z])/g, " $1");
    // The first word is all lowercase, so capitalize it.
    return `${spaced[0].toUpperCase()}${spaced.slice(1)}`
  }

  // Formats a value as USD with no decimals.
  const formatCurrency = function(value) {
    return Number(value).toLocaleString("en-US",
    {
      style: "currency", 
      maximumFractionDigits: 0, 
      minimumFractionDigits: 0, 
      currency: "USD"
    });
  }

  // Generates a label tag for the given 'fieldName'. 
  // 
  // The parameter 'fields' is
  // a list of Airtable fields returned by fetchHousingSchema() in
  // affordable-housing-changes.11tydata.js. The user-visible labels text is
  // given by 'labelText'.  This function automatically generates a field id
  // that will match the id generated by formField() for the same 'fieldName'.
  // An optional 'index' string will be appended to the generated id like 
  // "id:index".  If the field specified by 'fieldName' includes a description,
  // it will be rendered next to the label text as a hover tooltip icon.
  const fieldLabel = function(labelText, fields, fieldName, index="") {
    let forAttr = `${fields[fieldName].id}${index !== "" ? ":" + index : ""}`;
    let tag = `<label for="${forAttr}">${labelText}</label>`;
    let tooltip = "";
    if (fields[fieldName].description) {
      let descStr = fields[fieldName].description.replace(/\n/g, "<br/>");
      tooltip = `<span class="tooltip_entry">
<span class="icon_query"></span>
<span class="tooltip_content">${descStr}</span>
</span>`;
    }
   return `${tag} ${tooltip}`;
  }

  // Generates an HTML form input for the field specified by 'fieldName'.
  // 
  // The parameter 'fields' is a list of Airtable fields returned by
  // fetchHousingSchema() in affordable-housing-changes.11tydata.js. The type
  // of input rendered depends on the data type of the Airtable field.
  // This function automatically generates a field id that will match the id
  // generated by fieldLabel() for the same 'fieldName'. An optional 'index' 
  // string will be appended to the generated id like 'id:index'. The input
  // (or select, or textarea) element style can be adjusted with the 'className' 
  // string.
  const formField = function(fields, fieldName, className="", index="") {
    let field = fields[fieldName];
    let tag = "";
    let options = "";
    let content = "";
    let endtag = "";
    let indexStr = index !== "" ? ":" + index : "";
    let classStr = className !== "" ? `class="${className}"` : "";
    if (field.type === "singleSelect") {
      tag = "select";
      endtag = "</select>";
      content = `<option></option>`;
      for (const choice of field.options.choices) {
        content += `<option value="${choice.name}"
          data-color="${choice.color}">${choice.name}</option>`;
      }
    } else if (field.type === "multipleSelects") {
      let checkboxes = [];
      for (const choice of field.options.choices) {
        let choiceId = choice.name.replace(/\s/g, "-").toLowerCase();
        let id = `${field.id}:${choiceId}${indexStr}`;
        checkboxes.push(`<input type="checkbox" id="${id}"
          name="${field.name}${indexStr}" value="${choice.name}"
          data-color="${choice.color}"> <label
          for="${id}">${choice.name}</label>`);
      }
      // Break out of the generalized element generation and just
      // return what we've come up with above for multipleSelects.
      return checkboxes.join("<br/>");
    } else if (field.type === "multilineText") {
      tag = "textarea";
      endtag = "</textarea>";
    } else if (field.type === "number") {
      let precision = Number(field.options.precision);
      tag = "input";
      options = `type="number" min="0" step="${10 ** (-1 * precision)}"`
    } else if (field.type === "email") {
      tag = "input";
      options = `type="email"`;
    } else if (field.type === "phoneNumber") {
      tag = "input";
      options = `type="tel"`;
    } else if(field.type === "url") {
      tag = "input";
      options = `type="url"`;
    } else if (field.type === "singleLineText") {
      tag = "input";
      options = `type="text"`;
    } else if (field.type === "checkbox") {
      tag = "input";
      options = `type="checkbox"`;
    } else {
      return "";
    }
    return `<${tag} id="${field.id}${indexStr}"
      name="${field.name}${indexStr}" ${options} ${classStr}>${content}${endtag}`;
  }

  eleventyConfig.addShortcode("fieldLabel",
      function(labelText, fields, fieldName) {
    return fieldLabel(labelText, fields, fieldName);
  });

  eleventyConfig.addShortcode("indexedFieldLabel", 
      function(index, labelText, fields, fieldName) {
    return fieldLabel(labelText, fields, fieldName, index);
  });

  eleventyConfig.addShortcode("formField", 
      function(fields, fieldName, className="") {
    return formField(fields, fieldName, className);
  });

  eleventyConfig.addShortcode("indexedFormField", 
      function(index, fields, fieldName, className="") {
    return formField(fields, fieldName, className, index);
  });

  // Generates a rendered summary of affordable housing filter options.
  eleventyConfig.addShortcode("querySummary", function(query) {
    // Copy the query so we don't modify it directly when making changes later on.
    let queryCopy = JSON.parse(JSON.stringify(query));
    // The includeUnknown(Rent|Income) parameters only apply if a rent or income
    // is supplied, so remove them if they do not apply.
    if (queryCopy["includeUnknownRent"] && !queryCopy["rentMax"]) {
      delete queryCopy["includeUnknownRent"];
    }
    if (queryCopy["includeUnknownIncome"] && !queryCopy["income"]) {
      delete queryCopy["includeUnknownIncome"];
    }
    let filtersApplied = []
    for (let parameter in queryCopy) {
      let value = queryCopy[parameter];
      if (!value) {
        continue
      }
      if (parameter == "rentMax" || parameter == "income") {
        value = formatCurrency(Number(value));
      }
      if (value == "on") {
        // Simply showing the parameter key is enough.  No need to also show
        // "on" or similar (e.g. "yes", "true").
        value = "";
      }
      let valueStr = "";
      if (value) {
        valueStr = `: ${value}`;
      }
      filtersApplied.push(`<span class="badge"><span class="bold">${camelCaseToSpaces(parameter)}</span>${valueStr}</span>`)
    }
    return filtersApplied.join(" ");
  });

  // Gets a subset of all housing results from Airtable based on 'query'.
  eleventyConfig.addFilter("housingResults", async function(query) {
    console.log("housing query: ");
    console.log(query);
    let asset = new EleventyFetch.AssetCache("housing_results");
    let isBuild = !process.env.ELEVENTY_SERVERLESS && !query;
    if (isBuild && asset.isCacheValid("1m")) {
      console.log("Returning cached housing list.");
      let housing = await asset.getCachedValue();
      return housing;
    }
    const queryStr = buildQueryStr(query);
    console.log("Fetching housing list.");
    let housing = await fetchHousingList(queryStr);
    console.log("got " + housing.length + " properties.")
    // if (query) {
    //   console.log(JSON.stringify(housing, null, 4));
    // }
    if (isBuild) {
      await asset.save(housing, "json");
    }
    return housing;
  });

  // Summarizes the 'units' array of each item in 'housingList' by the
  // 'summarizeBy' keys.
  // 'housingList' is an array of apartments returned by the housingResults
  // filter. 'summarizeBy' is a list of unit keys 
  // (e.g. ["openStatus", "unitType"]) that all units in a given apartment
  // should be summarized by.  The summary is generated by removing all keys
  // except those in 'summarizeBy' and then getting the unique set of the 
  // resulting array of units.
  eleventyConfig.addFilter("summarizeUnits", function(housingList, summarizeBy) {
    let housingListCopy = JSON.parse(JSON.stringify(housingList));
    for (let housing of housingListCopy) {
      let summary = new Set();
      for (let unit of housing.units) {
        let unitSummary = {};
        for (let prop of summarizeBy) {
          unitSummary[prop] = unit[prop];
        }
        // Stringify the unitSummary so that we can ensure uniqueness
        // via the Set.  If an apartment has a single unit type offered
        // at multiple rents, we want to ensure the summary only lists
        // the unit type one time, not once for each rent offering.
        summary.add(JSON.stringify(unitSummary));
      }
      // Make an array from the Set, and also convert the stringified
      // unit objects back into objects.
      housing.units = [...summary].map(x => JSON.parse(x));
    }
    return housingListCopy;
  });

  // Generates an Airtable filter formula string based on 'query'.
  const buildQueryStr = function(query) {
    query = query || "";
    const {
      availability,
      city,
      unitType,
      populationsServed,
      rentMin,
      rentMax,
      income,
      includeUnknownRent,
      includeUnknownIncome,
      propertyName,
      wheelchairAccessibleOnly,
      includeReferrals,
    } = query;

    
    let parameters = [];

    // By default, hide any units not allowing public applications (i.e. referrals only).
    if(!includeReferrals) {
      parameters.push("{_DISALLOWS_PUBLIC_APPLICATIONS} = 0")
    }

    if (unitType) {
      let rooms = unitType.split(", ");
      let roomsQuery = rooms.map((x) => `{TYPE} = '${x}'`)
      parameters.push(`OR(${roomsQuery.join(",")})`);
    }

    if (city) {
      let cities = city.split(", ");
      let cityQuery = cities.map((x) => `{_CITY} = '${x}'`);
      parameters.push(`OR(${cityQuery.join(",")})`);
    }

    if (availability) {
      let availabilities = availability.split(", ");
      let availabilityQuery = availabilities.map((x) => `{STATUS} = '${x}'`);
      parameters.push(`OR(${availabilityQuery.join(",")})`);
    }

    if (populationsServed) {
      let populations = populationsServed.split(", ");
      // Note this formula will break if one population option is a substring of another.
      // e.g. "developmentally disabled" and "disabled"
      // See https://community.airtable.com/t/return-rows-that-contain-multiple-select-item/42187/4
      // for a complicated solution.
      let populationsQuery = populations.map(x => `FIND('${x}', {_POPULATIONS_SERVED})`);
      parameters.push(`OR(${populationsQuery.join(",")})`);
    }

    if (wheelchairAccessibleOnly) {
      parameters.push(`{_HAS_WHEELCHAIR_ACCESSIBLE_UNITS} = 1`);
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
      // _APT_NAME is a lookup field which is by default an array (in this case with a single entry).
      parameters.push(`FIND(LOWER('${propertyName}'), LOWER(ARRAYJOIN({_APT_NAME}, ''))) > 0`);
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
          let housing_id = record.get("_DISPLAY_ID")?.[0] || "";
          // Ignore any entries that do not have a parent property.
          if (housing_id) {
            housingList.push({
              id: housing_id,
              aptName: record.get("_APT_NAME")?.[0] || "",
              address: record.get("_ADDRESS")?.[0] || "",
              city: record.get("_CITY")?.[0] || "",
              unit: {
                unitType: record.get("TYPE"),
                openStatus: record.get("STATUS"),
                incomeBracket: record.get("PERCENT_AMI"),
                rent: record.get("RENT_PER_MONTH_USD"),
                minIncome: record.get("MIN_YEARLY_INCOME_USD"),
                maxIncome: {low: record.get("MAX_YEARLY_INCOME_LOW_USD"),
                            high: record.get("MAX_YEARLY_INCOME_HIGH_USD")},
              },
              units: [], // To be filled later, after grouping by housing ID.
              locCoords: record.get("_LOC_COORDS")?.[0] || "",
              phone: record.get("_PHONE")?.[0] || "",
              website: record.get("_PROPERTY_URL")?.[0] || "",
              email: record.get("_EMAIL")?.[0] || "",
              populationsServed: record.get("_POPULATIONS_SERVED"),
              minAge: record.get("_MIN_RESIDENT_AGE"),
            });
          }
        });

        // Combine entries with the same housing ID by filling the 'units'
        // property with data from all units for that housing ID.
        let housingById = {};
        for (idx in housingList) {
          let housingId = housingList[idx].id;
          housingById[housingId] = housingById[housingId] || housingList[idx];
          housingById[housingId].units.push(housingList[idx].unit);
          // The 'unit' property was temporary and used only to hold
          // the unit-level data for each fetched record.  The same data
          // (plus data for other units with the same housing ID)
          // now resides in the 'units' property.
          delete housingById[housingId].unit;
        }
        // Each housing ID key is also stored in the value as the 'id' property
        // so the object can be converted to an array without information loss.
        return Object.values(housingById);
      });
  }

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