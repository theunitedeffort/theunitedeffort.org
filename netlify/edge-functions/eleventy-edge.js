import { EleventyEdge } from "eleventy:edge";
import precompiledAppData from "./_generated/eleventy-edge-app-data.js";

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

export default async (request, context) => {
  try {
    let edge = new EleventyEdge("edge", {
      request,
      context,
      precompiled: precompiledAppData,

      // default is [], add more keys to opt-in e.g. ["appearance", "username"]
      cookies: [],
    });

    // construct an object of all the querystring parameters since the 
    // built-in eleventy.edge.query does not capture multiple matching 
    // query params. See the tracking issue for details:
    // https://github.com/11ty/eleventy/issues/2422
    const url = new URL(request.url);
    let queries = {};
    for (const [key, value] of url.searchParams.entries()) {
      if(value) {
        if(!queries[key]) {
          // New key. Add it to the queries object.
          queries[key] = value;
        } else {
          // We've seen this key before.  Append to the associated key in
          // the queries object.
          queries[key] += `, ${value}`;
        }
      }
    }

    edge.config((eleventyConfig) => {
      eleventyConfig.addGlobalData("searchParams", queries);

      // Formats a value as USD with no decimals.
      const formatCurrency = function(value) {
        const num = Number(value)
        if (isNaN(num)) {
          return "";
        } else {
          return num.toLocaleString("en-US",
          {
            style: "currency", 
            maximumFractionDigits: 0, 
            minimumFractionDigits: 0, 
            currency: "USD"
          });
        }
      }

      // Gets a subset of all housing results from Airtable based on 'query'.
      eleventyConfig.addFilter("getValidatedLocCoords", function(address) {
        if (address.verifiedLocCoords && 
            address.locCoords) {
          const coords = address.locCoords.split(",");
          if (coords.length == 2) {
            const lat = Number.parseFloat(coords[0]);
            const lng = Number.parseFloat(coords[1]);
            // Basic bounds checking. Note this also kicks out coordinates that
            // can't be parsed, since NaN will always fail the below check.
            if (lat > 35.952462 && lat < 38.216103 &&
              lng > -123.069952 && lng < -120.806286) {
              return [lat, lng];
            }
          }
        }
        return;
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
        for (const key in query) {
          if (allowedFilters.includes(key) && query[key]) {
            count++;
          }
        }
        return count;
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
          for (const selectedOption of selectedOptions) {
            let idx = filterValuesCopy[filterIdx].options.findIndex(
              v => v.name.split(", ").includes(selectedOption));
            if (idx >= 0) {
              filterValuesCopy[filterIdx].options[idx].selected = true;
            }
          }
        }
        for (const section in query){
          updateFilterSection(query[section], section);
        }

        return filterValuesCopy;
      });

      eleventyConfig.addFilter("filterByQuery", function(housingList, query) {
        query = query || "";
        console.log(query);
        let housingListCopy = JSON.parse(JSON.stringify(housingList));

        // When filtering on unit-level data, it's important to filter out
        // units and not entire apartments.  A certain apartment may have
        // some units that match the query criteria and some that don't.
        // If none of an apartment's units match the criteria, the apartment
        // will stay in housingListCopy, but the 'units' array within will be empty.
        // These apartments will be filtered out just prior to returning the
        // final filtered array.
        if (!query.includeReferrals) {
          housingListCopy = housingListCopy.filter(a => !a.disallowsPublicApps);
        }

        if (query.unitType) {
          const rooms = query.unitType.split(", ");
          housingListCopy = housingListCopy.map(apt => {
            apt.units = (
              apt.units.filter(u => rooms.includes(u.unitType)));
            return apt;
          });
        }

        if (query.city) {
          const cities = query.city.split(", ");
          housingListCopy = housingListCopy.filter(a => cities.includes(a.city));
        }

        if (query.availability) {
          const availabilities = query.availability.split(", ");
          housingListCopy = housingListCopy.map(apt => {
            apt.units = (
              apt.units.filter(u => availabilities.includes(u.openStatus)));
            return apt;
          });
        }

        if (query.populationsServed) {
          const populations = query.populationsServed.split(", ");
          housingListCopy = housingListCopy.filter(apt => {
            if (!apt.populationsServed.length &&
                populations.includes("General Population")) {
              // Entries with an empty _POPULATIONS_SERVED field are interpreted as
              // being open to the general public, so allow those entries as well if
              // the user wants General Population entries.
              return true;
            }
            for (const population of populations) {
              if (apt.populationsServed.includes(population)) {
                return true;
              }
            }
          });
        }

        if (query.wheelchairAccessibleOnly) {
          housingListCopy = (
            housingListCopy.filter(a => a.hasWheelchairAccessibleUnits));
        }

        if (query.rentMax) {
          const rentMax = Number(query.rentMax);
          housingListCopy = housingListCopy.map(apt => {
            apt.units = apt.units.filter(unit => {
              return ((query.includeUnknownRent && !unit.rent) || 
                Number(unit.rent) <= rentMax);
            });
            return apt;
          });
        }

        if (query.income) {
          const income = Number(query.income);
          housingListCopy = housingListCopy.map(apt => {
            apt.units = apt.units.filter(unit => {
              const minIncomeMatch = (
                (query.includeUnknownIncome && !unit.minIncome) ||
                Number(unit.minIncome) <= income);
              const maxIncomeMatch = (
                (query.includeUnknownIncome && !unit.maxIncome.high) ||
                Number(unit.maxIncome.high) >= income);
              return minIncomeMatch && maxIncomeMatch;
            });
            return apt;
          });
        }

        if (query.propertyName) {
          const aptName = query.propertyName.toLowerCase();
          housingListCopy = housingListCopy.filter(
            a => a.aptName.toLowerCase().includes(aptName));
        }

        // Some properties may have had all their associated units filtered out,
        // so remove those before returning the final list of filtered properties.
        return housingListCopy.filter(a => a.units.length);
      });

      eleventyConfig.addFilter("groupUnits", async function(housingList) {
        // Combine entries with the same housing ID by filling the 'units'
        // property with data from all units for that housing ID.
        let housingListCopy = JSON.parse(JSON.stringify(housingList));
        let housingById = {};
        for (const idx in housingListCopy) {
          let housingId = housingListCopy[idx].id;
          housingById[housingId] = housingById[housingId] || housingListCopy[idx];
          housingById[housingId].units.push(housingListCopy[idx].unit);
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

      // Changes the URL query parameters to get rid of waitlist closed locations.
      //
      // If nothing is set for the availability parameter or if "Waitlist Closed" is
      // the only value set, all availabilities will be added to the URL query 
      // parameters *except* "Waitlist Closed". 
      // If there is something set for the availability parameter, "Waitlist Closed"
      // will simply be removed from the existing list of values.
      // 
      // This funtion is intended to be used to generate a URL query string that 
      // forces properties with a closed waitlist to be filtered out.  "query" is an
      // eleventy.serverless.query object and "allAvailabilities" is a list of
      // all possible values for the availability parameter, generally fetched
      // ahead of time from Airtable.  Returns a URL query string.
      eleventyConfig.addFilter("removeWaitlistClosed", function(query, 
        allAvailabilities) {
        const availKey = "availability";
        const closedValue = "Waitlist Closed";
        let queryParams = new URLSearchParams(query);
        // Copy existing availability values that were set by the user.
        let availabilityValues = queryParams.get(availKey);
        if (!availabilityValues || availabilityValues === closedValue) {
          // The user had no availabilities set or only asked for waitlist closed, 
          // so initialize to the full list.
          availabilityValues = allAvailabilities.join(", ");
        }
        // Remove the Waitlist Closed item from the availability values.
        availabilityValues = (availabilityValues.split(", ")
          .filter(x => x !== closedValue).join(", "));
        queryParams.set(availKey, availabilityValues);
        return queryParams.toString();
      });

      // Converts "camelCaseString" to "Camel Case String".
      // https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
      const camelCaseToSpaces = function(str) {
        // Insert space before each capital letter.
        let spaced = str.replace(/([A-Z])/g, " $1");
        // The first word is all lowercase, so capitalize it.
        return `${spaced[0].toUpperCase()}${spaced.slice(1)}`
      }

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
    });

    return await edge.handleResponse();
  } catch (e) {
    console.log("ERROR", { e });
    return context.next(e);
  }
};
