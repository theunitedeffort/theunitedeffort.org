const eleventyFetch = require('@11ty/eleventy-fetch');
const eleventyImage = require('@11ty/eleventy-img');
const fs = require('fs');
const pako = require('pako');
const path = require('path');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const CONTENT_BLOCKS_TABLE = 'tblAkC6dlPJc4o0Je';
const PAGES_TABLE = 'tblTqhITQfO1MJQaE';
const DOC_CONTENT_BLOCKS_TABLE = 'tblKinGxInIRE8uxT';
const DOC_PAGES_TABLE = 'tblbM9n0xnYHdUHYL';
const DOC_PROCESSES_TABLE = 'tbl4JhQIQ8Qtk9K8m';
const DOC_PROCESS_STEPS_TABLE = 'tblKDlARlHGvatITg';

const useRecord = (status) => {
  const isProdContext = (
    ['PRODUCTION', 'DEPLOY_PREVIEW'].includes(process.env.DEPLOY_CONTEXT));
  return (
    (isProdContext && status == 'Published') ||
    (!isProdContext && ['Published', 'Preview'].includes(status)));
};

const fetchSection = (id) => {
  const table = base(CONTENT_BLOCKS_TABLE);
  return table.find(id).then((record) => {
    if (record.get('Type') == 'Markdown page') {
      return record.get('Markdown');
    } else {
      return record.get('Content');
    }
  });
};


const fetchDocsProcessStep = (id) => {
  console.log(`getting process step ${id}`);
  const table = base(DOC_PROCESS_STEPS_TABLE);
  return table.find(id).then((record) => {
    return {
      content: record.get('Step Content Markdown'),
      next_step: record.get('Next Instruction Markdown'),
      name: record.get('Name'),
      who: record.get('Who'),
    };
  });
};


const fetchDocsProcess = async (id) => {
  console.log(`getting process ${id}`);
  const table = base(DOC_PROCESSES_TABLE);
  return table.find(id).then(async (record) => {
    const stepIds = record.get('Steps');
    const steps = [];
    for (const stepId of stepIds) {
      const stepContent = await fetchDocsProcessStep(stepId);
      steps.push(stepContent);
    }
    return {
      steps: steps,
      name: record.get('Name'),
    };
  });
};


const fetchDocsContent = async (id) => {
  console.log(`getting docs content item ${id}`);
  const table = base(DOC_CONTENT_BLOCKS_TABLE);
  return table.find(id).then(async (record) => {
    const type = record.get('Type');
    let content = '';
    if (type == 'Markdown' || type == 'Include') {
      content = record.get('Markdown');
    } else if (type == 'Diagram') {
      const frontmatter = `
---
config:
  flowchart:
    curve: stepAfter
    nodeSpacing: 50
    rankSpacing: 35
    wrappingWidth: 250
---`;
      const source = `${frontmatter}\n${record.get('Markdown')}`;
      const data = Buffer.from(source, 'utf8');
      const compressed = pako.deflate(data, {level: 9});
      const result = Buffer.from(compressed)
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_');
      const url = `https://kroki.io/mermaid/svg/${result}`;
      console.log(url);
      content = await eleventyFetch(url, {type: 'text'});
    } else if (type == 'Process Table') {
      content = await fetchDocsProcess(record.get('Process')[0]);
    }
    return {
      type: type.replace(' ', '-'),
      content: content,
    }
  });
};


// Fetch content for our docs from Airtable
const fetchDocsPages = async () => {
  const pages = [];
  const data = [];
  const table = base(DOC_PAGES_TABLE);

  return table.select({
    view: 'Grid view',
  })
    .all()
    .then(async (records) => {
      for (const record of records) {
        if (useRecord(record.get('Status'))) {
          let contentIds = record.get('Content');
          if (!contentIds) {
            contentIds = [];
          }

          const contents = [];
          for (const contentId of contentIds) {
            contents.push(await fetchDocsContent(contentId));
          }

          const path = record.get('Page Path');
          if (!data[path]) {
            data[path] = {
              url: path,
              sections: contents,
              name: record.get('Page Title'),
              parent: record.get('Parent Page Path') || null,
              lastUpdated: record.get('Content Last Updated'),
            };
          } else {
            data[path].sections.push(...contents);
          }
        }
      }

      // Collect each page array into our pages array
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const element = data[key];
          pages.push(element);
        }
      }

      return pages;
    });
};


// Fetch content for our pages from Airtable
const fetchPages = async () => {
  const pages = [];
  const data = [];
  const table = base(PAGES_TABLE);

  return table.select({
    view: 'API page content',
  })
    .all()
    .then(async (records) => {
      for (const record of records) {
        if (useRecord(record.get('Status'))) {
          const name = record.get('Page title');
          const path = record.get('Page path');
          const sectionID = record.get('Section')[0];
          const content = await fetchSection(sectionID);

          if (!data[name]) {
            data[name] = {
              url: path,
              sections: [],
              name: name,
              // Hack alert!
              // Avoids putting this js load on every page.
              head: path.includes('donate') ? '<script async src="https://widgets.givebutter.com/latest.umd.cjs?acct=9yZD2j8yFG8jsP4t&p=other"></script>' : '',
            };
          }

          data[name].sections.push({
            type: record.get('Type')[0].replace(' ', '-'),
            content: content,
          });
        }
      }

      // Collect each page array into our pages array
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const element = data[key];
          pages.push(element);
        }
      }

      return pages;
    });
};

// Fetch the list of general resources from the Airtable API.
const fetchGeneralResources = async () => {
  const data = [];
  const table = base('tblyp7AurXeZEIW4J'); // Resources table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        if (record.get('Show on website')) {
          data.push(record.fields);
        }
      });
      return data;
    });
};

// Fetch the list of stories from the Airtable API.
const fetchStories = async () => {
  const data = [];
  const table = base('tblD0j9sZoGc41MSQ'); // Client stories table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        if (useRecord(record.get('Status'))) {
          data.push(record.fields);
        }
      });
      return data;
    });
};

// Fetch the list of news articles from the Airtable API.
const fetchNews = async () => {
  const data = [];
  const table = base('tblFuiL7dLunQsKPe'); // News articles table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        if (useRecord(record.get('Status'))) {
          data.push(record.fields);
        }
      });
      return data;
    });
};

const cacheStoryImages = async (stories) => {
  for (const story of stories) {
    if (story['Photo'] && story['Photo'].length > 0) {
      const stats = await eleventyImage(story['Photo'][0].url, {
        widths: [500, 200],
        urlPath: '/images/',
        outputDir: './dist/images/',
      });
      story.image = stats.jpeg[1];
      story.thumb = stats.jpeg[0];
    }
  }
};

const cacheAssets = async (assets) => {
  for (const asset of assets) {
    const assetBuffer = await eleventyFetch(asset['FILE'][0].url, {
      type: 'buffer',
      duration: '1h',
    });
    const outputDir = './dist/assets';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }
    const extension = path.extname(asset['FILE'][0].filename);
    fs.writeFileSync(path.join(outputDir, `${asset['IDENTIFIER']}${extension}`),
      assetBuffer);
  }
};

const fetchImages = async () => {
  console.log('fetching images');
  const data = {};
  const table = base('tblWyKHolohkAMSAw'); // Images table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        data[record.get('IDENTIFIER')] = record.fields;
      });
      return data;
    });
};


const fetchAssets = async () => {
  console.log('fetching assets');
  const data = [];
  const table = base('tblu83db8I9HEHQgs'); // Assets table
  return table.select({
    view: 'API list all',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        data.push(record.fields);
      });
      return data;
    });
};


module.exports = async function() {
  // Only housing pages run serverless, so there is no need to fetch
  // all this content when this data file is executed from a serverless
  // environment.
  if (process.env.ELEVENTY_SERVERLESS) {
    return {};
  }
  const asset = new eleventyFetch.AssetCache('airtable_pages');
  console.log('checking if asset is valid')
  console.log(asset.cachedObject);
  console.log(asset.cachedObject?.cachedAt);
  if (asset.isCacheValid('24h')) {
    console.log('Returning cached pages data.');
    return await asset.getCachedValue();
  }
  console.log('Fetching pages.');
  const [
    pageList,
    docsList,
    resourceList,
    storiesList,
    newsList,
    imageList,
    assetList,
  ] = await Promise.all([fetchPages(), fetchDocsPages(), fetchGeneralResources(),
    fetchStories(), fetchNews(), fetchImages(), fetchAssets()]);
  await cacheStoryImages(storiesList);
  await cacheAssets(assetList);
  console.log(JSON.stringify(docsList, null, 2));
  const ret = {
    pages: pageList,
    docs: docsList,
    images: imageList,
    partialsData: {
      resources: resourceList,
      stories: storiesList,
      articles: newsList,
    },
  };
  await asset.save(ret, 'json');
  return ret;
};
