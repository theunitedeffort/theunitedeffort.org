const markdown = require("marked");
const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblNLrf8RTiZdY5KN";


module.exports = function(eleventyConfig) {
  
};

module.exports = function(eleventyConfig) {

  //pass through static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });

  // Eleventy Serverless plugin
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless", // The serverless function name from your permalink object
    functionsDir: "./netlify/functions/",
  });

  // Markdown filter
  // eleventyConfig.addFilter("markdownify", (str) => markdown.marked(str));
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

  eleventyConfig.addFilter("updateFilterState", function(filter_values, query) {
    if (!query) { return filter_values; }
    if (query.availability) {
      let selectedAvailabilities = query.availability.split(", ");
      for (i = 0; i < selectedAvailabilities.length; i++) {
        let idx = filter_values.open_status.findIndex(v => v.name === selectedAvailabilities[i]);
        if (idx >= 0) {
          filter_values.open_status[idx].selected = true;
        }
      }
    }

    if (query.city) {
      let selectedCities = query.city.split(", ");
      for (i = 0; i < selectedCities.length; i++) {
        let idx = filter_values.city.findIndex(v => v.name === selectedCities[i]);
        if (idx >= 0) {
          filter_values.city[idx].selected = true;
        }
      }
    }

    if (query.unit_type) {
      let selectedUnitTypes = query.unit_type.split(", ");
      for (i = 0; i < selectedUnitTypes.length; i++) {
        let idx = filter_values.unit_type.findIndex(v => v.name === selectedUnitTypes[i]);
        if (idx >= 0) {
          filter_values.unit_type[idx].selected = true;
        }
      }
    }
    return filter_values;
  });

  eleventyConfig.addFilter("housingResults", async function(query) {
    console.log("housing query: ");
    console.log(query);
    const queryStr = buildQueryStr(query);
    let housing = await fetchHousingList(queryStr);
    console.log("got " + housing.length + " properties.")
    if (query) {
      console.log(housing);
    }
    return housing;
  });

  const buildQueryStr = function(query) {
    if (!query) { return ""; }
    const { 
      availability,
      city,
      unit_type,
      rent_min,
      rent_max,
      income, 
      include_unknown_rent, 
      include_unknown_income 
    } = query;

    let parameters = [];

    if (unit_type) {
      let rooms = unit_type.split(", ");
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

    // This will not add the rent query parameter if rent_min is 0.
    // TODO(trevorshannon): Is that ok?
    if (rent_min) {
      let rent_min_params = [`{TEST_RENT_PER_MONTH_USD} >= '${rent_min}'`];
      if (include_unknown_rent) {
        rent_min_params.push(`{TEST_RENT_PER_MONTH_USD} = BLANK()`);
      }
      parameters.push(`OR(${rent_min_params.join(",")})`);
    }
    if (rent_max) {
      let rent_max_params = [`{TEST_RENT_PER_MONTH_USD} <= '${rent_max}'`];
      if (include_unknown_rent) {
        rent_max_params.push(`{TEST_RENT_PER_MONTH_USD} = BLANK()`);
      }
      parameters.push(`OR(${rent_max_params.join(",")})`);
    }
    if (income) {
      let income_min_params = [`{TEST_MIN_INCOME_PER_YR_USD} <= '${income}'`];
      let income_max_params = [`{TEST_MAX_INCOME_PER_YR_USD} >= '${income}'`];
      if (include_unknown_income) {
        income_min_params.push(`{TEST_MIN_INCOME_PER_YR_USD} = BLANK()`);
        income_max_params.push(`{TEST_MAX_INCOME_PER_YR_USD} = BLANK()`);
      }
      parameters.push(
        `AND(OR(${income_min_params.join(",")}), OR(${income_max_params.join(",")}))`);
    }

    let queryStr = `AND(${parameters.join(",")})`;
    console.log("Airtable query:");
    console.log(queryStr);
    return queryStr;
  };

  // Lookup data for this item from the Airtable API
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
            id: record.get("ID"),
            apt_name: record.get("APT_NAME"),
            city: record.get("City (from Housing"),
            open_status: record.get("STATUS"),
            unit_type: record.get("TYPE"),  // What to do with undefined values?
            loc_coords: record.get("LOC_COORDS (from Housing)")
          })
        });
        // return a set of de-duped results
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
