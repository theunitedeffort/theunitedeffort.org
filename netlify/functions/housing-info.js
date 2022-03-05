// const { builder } = require('@netlify/functions');

const pageTemplate = (data) => {
  return `
  <html>
    <body>
      <code>${ JSON.stringify(data) }</code>
    <body>
  </html>
  `;
};


const handler = async(event) => {

  const housingID = event.path.split("housing/")[1];

  console.log(housingID);

  return {
    statusCode: 200,
    body: pageTemplate(housingID)
  };

};

exports.handler = handler;