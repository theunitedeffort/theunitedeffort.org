const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let data = [];
  const table = base("tblyp7AurXeZEIW4J"); // Resources table
  return table.select({
      view: "API list all"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        if (record.get("Show on website")) {
          data.push(record.fields)
        }
      });
      return data;
    });

};


module.exports = async function() {
  console.log("Fetching resources.");
  let res = await fetchDataFromAirtable();
  return {resources: res};
}
