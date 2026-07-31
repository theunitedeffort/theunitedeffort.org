const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
// This requirement is somehow not propagated from affordable-housing.11tydata.js
// so include it here to be sure it makes it into the serverless bundle.
const EleventyFetch = require("@11ty/eleventy-fetch");
const pluginToc = require('eleventy-plugin-toc');
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { execSync } = require("child_process")
const cheerio = require('cheerio');
const glossaryData = require("./src/site/_data/glossary.js");


module.exports = function(eleventyConfig) {
  // Pull in custom filters and shortcodes.
  eleventyConfig.addPlugin(require("./src/config/eleventy-base-config.js"));

  // Pass through static assets and client-side js files.
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/images": "/images" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon": "/" });
  if (process.env.CONTEXT === 'dev' ) {
    // For builds that are not local development builds, the js files will
    // come from Babel instead (via babel.config.json and package.json)
    eleventyConfig.addPassthroughCopy({ "src/site/_includes/js/*.js": "/js" });
  }

  eleventyConfig.addPlugin(pluginToc);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Eleventy Serverless plugin
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless",
    functionsDir: "./netlify/functions/",
    copy: [
      "_generated-serverless-collections.json",
      // Files/directories that start with a dot
      // are not bundled by default.
      { from: ".cache", to: "cache" },
    ],
  });

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

  // eleventyConfig.addTransform("linkGlossary", async function (content) {
  //   const path = this.page.outputPath;
  //   if (path && path.endsWith(".html")) {
  //     const $ = cheerio.load(content);
  //     const glossary = await glossaryData();

  //     // Sort terms by length descending to match multi-word phrases first
  //     // TODO: consider sorting terms just once, not for every page.
  //     glossary.sort((a, b) => b.term.length - a.term.length);

  //     // Target text blocks inside main content area
  //     $("main p, main li").each(function () {
  //       // Skip elements that already contain links or code blocks if necessary
  //       let html = $(this).html();

  //       terms.forEach(({ term, slug }) => {
  //         // Match whole words, case-insensitive, ignoring words inside existing <a> tags
  //         const regex = new RegExp(`\\b(${term})\\b(?![^<]*>|[^<>]*<\\/a>)`, "gi");
  //         html = html.replace(regex, `<a href="/learn/glossary#${slug}" class="glossary-link">$1</a>`);
  //       });

  //       $(this).html(html);
  //     });

  //     return $.html();
  //   }
  //   return content;
  // });

  // Pagefind indexing
  eleventyConfig.on(
    "eleventy.after",
    async ({ dir, results, runMode, outputMode }) => {
      console.log(
        "******** eleventy after build event, configured in .eleventy.js config file"
      )
      execSync(`npx pagefind --site ${dir.output}`, {
        encoding: "utf-8",
        stdio: "inherit" //see the output of the process in your log
      })
    }
  )

  return {
    dir: {
      input: "src/site",
      output: "dist"
    }
  }
};