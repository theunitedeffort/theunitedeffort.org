var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);



let housingList = [];

async function fetchHousingList() {

  await base('Housing').select({
    view: "All housing listing"
  }).eachPage(function page(records, fetchNextPage) {

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