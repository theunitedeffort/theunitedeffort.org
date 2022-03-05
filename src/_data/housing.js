var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('app7w5VUuXtmU2nJq');

let housingList = [];

async function fetchHousingList() {
  await base('Housing list').select({
    view: "All housing listing"
  }).eachPage(function page(records, fetchNextPage) {

    records.forEach(function(record) {
      housingList.push({
        id: record.get("ID"),
        apt_name: record.get("APT_NAME"),
      })
    });

  });
  return housingList;
}

module.exports = async function() {
  await fetchHousingList();
  return housingList;
}