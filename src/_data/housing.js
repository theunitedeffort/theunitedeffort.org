var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('app7w5VUuXtmU2nJq');



let housingList = [];

async function fetchHousingList() {

  await base('Housing list').select({
    // Selecting the first 3 records in All housing listing:
    // maxRecords: 3,
    view: "All housing listing"
  }).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      housingList.push({
        id: record.get("ID"),
        apt_name: record.get("APT_NAME"),
      })
    });

    fetchNextPage();

  });

  return housingList;

}



module.exports = async function() {
  await fetchHousingList();
  return housingList;
}