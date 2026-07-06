const eleventyFetch = require('@11ty/eleventy-fetch');
const eleventyImage = require('@11ty/eleventy-img');
const fs = require('fs');
const ical = require('node-ical');
const path = require('path');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const MYCONNECTSV_CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_bc13a42e047ab729ab123f1352170ee36f9be68d01c9c0a5cd773b92e4f67a18%40group.calendar.google.com/public/basic.ics';
const LOOKAHEAD_DAYS = 30;
const NEXT_N_EVENTS = 5;

const CONTENT_BLOCKS_TABLE = 'tblAkC6dlPJc4o0Je';
const PAGES_TABLE = 'tblTqhITQfO1MJQaE';

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

const fetchEventData = async (url) => {
  console.log('fetching events');
  const data = await ical.fromURL(url);
  events = [];
  for (const event of Object.values(data)) {
    if (event.type === 'VEVENT') {
      if (event.rrule) {
        const instances = ical.expandRecurringEvent(event, {
          from: new Date(),
          to: new Date(Date.now() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)
        });
        for (const instance of instances) {
          events.push(makeEventEntry(instance))
        }
      } else {
        events.push(makeEventEntry(event));
      }
    }
  }
  events.sort(sortByDate);
  events = events.slice(0, NEXT_N_EVENTS);
  return events;
};


module.exports = async function() {
  // Only housing pages run serverless, so there is no need to fetch
  // all this content when this data file is executed from a serverless
  // environment.
  if (process.env.ELEVENTY_SERVERLESS) {
    return {};
  }
  const asset = new eleventyFetch.AssetCache('airtable_pages');
  if (asset.isCacheValid('1h')) {
    console.log('Returning cached pages data.');
    return await asset.getCachedValue();
  }
  console.log('Fetching pages.');
  const [
    pageList,
    resourceList,
    storiesList,
    newsList,
    imageList,
    assetList,
    eventsList,
  ] = await Promise.all([fetchPages(), fetchGeneralResources(), fetchStories(),
    fetchNews(), fetchImages(), fetchAssets(), fetchEventData(MYCONNECTSV_CALENDAR_URL)]);
  await cacheStoryImages(storiesList);
  await cacheAssets(assetList);
  const ret = {
    pages: pageList,
    images: imageList,
    partialsData: {
      resources: resourceList,
      stories: storiesList,
      articles: newsList,
      events: eventsList,
    },
  };
  await asset.save(ret, 'json');
  return ret;
};
