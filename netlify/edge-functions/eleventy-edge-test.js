import { EleventyEdge } from "eleventy:edge";
import precompiledAppData from "./_generated/eleventy-edge-app-data.js";
// import accommodation from "./_generated/accommodation.json" assert { type: 'json' };



export default async (request, context) => {
  try {
    let edge = new EleventyEdge("edge", {
      request,
      context,
      precompiled: precompiledAppData,
      cookies: [],
    });

    edge.config((eleventyConfig) => {
      
      // Expose data
      // eleventyConfig.addGlobalData("accommodation", accommodation);
      
    
      
    });

    console.log("test");
    

    return await edge.handleResponse();
  } catch (e) {
    console.log("ERROR", { e });
    return context.next(e);
  }
};
