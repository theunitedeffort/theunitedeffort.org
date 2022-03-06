const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


// Lookup data for this item from the Airtable API
const fetchDataFromAirtable = async() => {
  let data = [];
  const table = base("tblCbqZ3YyHkTNeaC"); // Resources table

  return table.select({
      view: "API list all"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        data.push(record.fields)
      });
      return data;
    });



};


module.exports = async function() {
  return await fetchDataFromAirtable();
}
