module.exports = function() {
  return {
    siteContext: process.env.SITE_CONTEXT,
    deployContext: process.env.DEPLOY_CONTEXT,
  };
};
