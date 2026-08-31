const eleventyFetch = require('@11ty/eleventy-fetch');
const eleventyImage = require('@11ty/eleventy-img');
const fs = require('fs');
const pako = require('pako');
const ical = require('node-ical');
const path = require('path');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const MYCONNECTSV_CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_bc13a42e047ab729ab123f1352170ee36f9be68d01c9c0a5cd773b92e4f67a18%40group.calendar.google.com/public/basic.ics';
const LOOKAHEAD_DAYS = 30;
const NEXT_N_EVENTS = 7;

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
  const table = base(DOC_PROCESS_STEPS_TABLE);
  return table.find(id).then((record) => {
    return {
      content: record.get('Step Content Markdown') || "",
      next_step: record.get('Next Instruction Markdown') || "",
      name: record.get('Name') || "",
      who: record.get('Who') || "",
    };
  });
};


const fetchDocsProcesses = async (id) => {
  const table = base(DOC_PROCESSES_TABLE);
  const data = {};
  return table.select({
    view: 'API list all',
  })
    .all()
    .then(async (records) => {
      for (const record of records) {
        const stepIds = record.get('Steps');
        const steps = [];
        for (const stepId of stepIds) {
          const stepContent = await fetchDocsProcessStep(stepId);
          steps.push(stepContent);
        }
        const name = record.get('Name');
        data[name] = {
          steps: steps,
          name: name,
        };
      }
      return data;
    });
};


const fetchDocsContent = async (id) => {
  const table = base(DOC_CONTENT_BLOCKS_TABLE);
  return table.find(id).then(async (record) => {
    const type = record.get('Type');
    return {
      type: type.replace(' ', '-'),
      content: record.get('Markdown'),
    }
  });
};


// Fetch content for our docs from Airtable
const fetchDocsPages = async () => {
  const pages = [];
  const data = [];
  const table = base(DOC_PAGES_TABLE);

  return table.select({
    view: 'API list all',
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
          const name = record.get('Page Title');
          const parent = record.get('Parent Page Path') || null;
          const paginate = !parent;
          if (!data[path]) {
            data[path] = {
              url: path,
              sections: contents,
              name: name,
              paginate: true,
              lastUpdated: record.get('Content Last Updated'),
              // There is a bug in 11ty
              // (https://github.com/11ty/buildawesome/issues/2806)
              // that prevents the permalink from being conditionally set to
              // false during pagination.  Eleventy Navigation data needs to
              // be here so that we still get pages with no path (categories)
              // in the nav tree, because they will be removed from
              // collections.all to get around the pagination bug.
              data: {
                eleventyNavigation: {
                  key: path,
                  title: name,
                  parent: parent,
                  url: path,
                },
              },
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

      // Immediate children of the root node are treated as categories with no
      // rendered HTML page.
      const rootNode = pages.find((page) => !page.data.eleventyNavigation.parent);
      for (const page of pages) {
        if (page.data.eleventyNavigation.parent == rootNode.data.eleventyNavigation.key) {
          page.paginate = false;
          page.data.eleventyNavigation.url = null;
        }
      }

      return {
        rootNodeKey: rootNode.data.eleventyNavigation.key,
        pages: pages,
      };
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

const sortByDate = (a, b) => {
  return a.start - b.start;
};

const makeEventEntry = (event) => {
  let location = event.location;
  if (event.event) {
    // Expanded instances of a recurring event have the location info in
    // the base event object.
    location = event.event.location;
  }
  const entry = {
    'start': event.start,
    'end': event.end,
    'title': event.summary,
    'location': location,
  };
  return entry;
};

const fetchEventData = async (url, lookaheadDays, maxEvents) => {
  console.log('fetching events');
  const data = await ical.fromURL(url);
  let events = [];
  const now = new Date();
  const lookahead = new Date(Date.now() + lookaheadDays * 24 * 60 * 60 * 1000);
  for (const event of Object.values(data)) {
    if (event.type === 'VEVENT') {
      if (event.rrule) {
        const instances = ical.expandRecurringEvent(event, {
          from: now,
          to: lookahead,
          expandOngoing: true,
        });
        for (const instance of instances) {
          events.push(makeEventEntry(instance));
        }
      } else if (event.end >= now && event.end <= lookahead ||
          event.start >= now && event.start <= lookahead) {
        events.push(makeEventEntry(event));
      }
    }
  }
  events.sort(sortByDate);
  events = events.slice(0, maxEvents);
  return events;
};


const fetchCmsData = async () => {
  console.log('fetching cms data');
  const [
    pageList,
    docsList,
    resourceList,
    storiesList,
    newsList,
    imageList,
    assetList,
    eventsList,
    processList,
  ] = await Promise.all([fetchPages(), fetchDocsPages(), fetchGeneralResources(),
    fetchStories(), fetchNews(), fetchImages(), fetchAssets(),
    fetchEventData(MYCONNECTSV_CALENDAR_URL, LOOKAHEAD_DAYS, NEXT_N_EVENTS),
    fetchDocsProcesses()]);
  await cacheStoryImages(storiesList);
  await cacheAssets(assetList);
  // console.log(JSON.stringify(docsList, null, 2));
  const ret = {
    pages: pageList,
    docs: docsList,
    processes: processList,
    images: imageList,
    partialsData: {
      resources: resourceList,
      stories: storiesList,
      articles: newsList,
      events: eventsList,
    },
  };
  return ret;
};


module.exports = async function() {
  // Only housing pages run serverless, so there is no need to fetch
  // all this content when this data file is executed from a serverless
  // environment.
  if (process.env.ELEVENTY_SERVERLESS) {
    return {};
  }
  return eleventyFetch(fetchCmsData, {requestId: 'airtable_pages', duration: '1h', type: 'json'})
};
