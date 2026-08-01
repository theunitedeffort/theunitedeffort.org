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

  eleventyConfig.addTransform('renderDiagrams', async function (content) {
    const path = this.page.outputPath;
    if (path && path.endsWith('.html')) {
      let updatedContent = content;
      for (const match of content.matchAll(/<div data-mermaid-hash="(.*?)"><\/div>/g)) {
        const url = `https://mermaid.ink/svg/pako:${match[1]}`;
        console.log(url);
        const svg = await EleventyFetch(url, {duration: '*', type: 'text'});
        updatedContent = updatedContent.replace(match[0], svg);
      }
      return updatedContent;
    }
    return content;
  });

  eleventyConfig.addTransform("linkGlossary", async function (content) {
    const path = this.page.outputPath;
    if (path && path.endsWith(".html") && path.includes('/learn')) {
      const $ = cheerio.load(content);
      const glossary = await glossaryData();

      // Sort terms by length descending to match multi-word phrases first
      // TODO: consider sorting terms just once, not for every page.
      glossary.sort((a, b) => b.term.length - a.term.length);

      const elements = $('main p, main li').filter(function () {
        return $(this).closest('svg').length == 0;
      });

      // Loop through glossary entries first because we want to move on to
      // the next one once a replacement is made for that entry.
      for (const entry of glossary) {
        // Check all relevant elements on the page for a term match
        let termReplaced = false;
        for (const element of elements) {
          let html = $(element).html();
          // Match whole words, ignoring words inside existing <a> tags
          const allTerms = [entry, ...entry.synonyms];
          // Loop through the term and all its synonyms to look for a match
          for (term of allTerms) {
            let flags = '';
            if (!term.caseSensitive) {
              flags += 'i';
            }
            // TODO: consider a filter to remove a tags instead of the regex
            const regex = new RegExp(`\\b(${term.term})\\b(?![^<]*>|[^<>]*<\\/a>)`, flags);
            if (regex.test(html)) {
              // Note we always link to the parent "entry" rather than taking the synonym's slug.
              html = html.replace(regex, `<a href="/learn/reference/glossary#${entry.slug}" class="glossary-link">$1</a>`);
              $(element).html(html);
              // Only replace the first occurence of a glossary term.
              termReplaced = true;
              break;
            }
            if (termReplaced) {
              break;
            }
          }
        }
      }
      return $.html();
    }
    return content;
  });

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