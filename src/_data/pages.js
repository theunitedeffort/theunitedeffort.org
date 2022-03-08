var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);



// Fetch content for our pages from Airtable
const fetchHousingList = async() => {
  let pages = [];
  let data = [];
  const table = base("tbloNBvoxtp8u70bD"); // Pages table

  return table.select({
      view: "API page content"
    })
    .all()
    .then(records => {

      // Group the records into page arrays
      records.forEach(function(record) {
        if (record.get("Status") == "Published") {
          let name = record.get("Page name");
          let path = record.get("Page path");
          if (!data[name]) {
            data[name] = {
              url: path,
              sections: []
            };
          }
          data[name].sections.push(record.fields);
        }
      });

      // Collect each page array into our pages array
      for (const key in data) {
        const element = data[key];
        pages.push(element);
      }

      return pages;
    });

};


module.exports = async function() {
  return await fetchHousingList();
}
