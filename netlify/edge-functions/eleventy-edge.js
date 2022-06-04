import { EleventyEdge } from "eleventy:edge";
import precompiledAppData from "./_generated/eleventy-edge-app-data.js";
import accommodation from "./_generated/accommodation.json" assert { type: 'json' };
import filterValues from "./_generated/filterValues.json" assert { type: 'json' };

// import searchFilters
import countKeys from "../../src/filters/edgeFilters/countKeys.js";
import findByString from "../../src/filters/edgeFilters/findByString.js";
import optionFilter from "../../src/filters/edgeFilters/optionFilter.js";
import optionFilterUnits from "../../src/filters/edgeFilters/optionFilterUnits.js";
import updateFilterState from "../../src/filters/edgeFilters/updateFilterState.js";
import sortUnitType from "../../src/filters/edgeFilters/sortUnitType.js";
import numFiltersApplied from "../../src/filters/edgeFilters/numFiltersApplied.js";
import optionSelected from "../../src/filters/edgeFilters/optionSelected.js";

export default async (request, context) => {
  try {
    let edge = new EleventyEdge("edge", {
      request,
      context,
      precompiled: precompiledAppData,

      // default is [], add more keys to opt-in e.g. ["appearance", "username"]
      cookies: [],
    });


    edge.config((eleventyConfig) => {
      
      // Add some custom Edge-specific configuration

      // Expose data
      eleventyConfig.addGlobalData("accommodation", accommodation);
      eleventyConfig.addGlobalData("filterValues", filterValues);
      
      // Add filters
      eleventyConfig.addFilter("countKeys", countKeys);
      eleventyConfig.addFilter("findByString", findByString);
      eleventyConfig.addFilter("optionFilter", optionFilter);
      eleventyConfig.addFilter("optionFilterUnits", optionFilterUnits);
      eleventyConfig.addFilter("updateFilterState", updateFilterState);
      eleventyConfig.addFilter("sortUnitType", sortUnitType);
      eleventyConfig.addFilter("numFiltersApplied", numFiltersApplied);
      eleventyConfig.addFilter("optionSelected", optionSelected);
      


    });




    return await edge.handleResponse();
  } catch (e) {
    console.log("ERROR", { e });
    return context.next(e);
  }
};
