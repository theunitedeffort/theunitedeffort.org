# Website for The United Effort Organization

https://theunitedeffort.org 

[![Netlify Status](https://api.netlify.com/api/v1/badges/71dbec41-02ec-426b-be5a-b88aedb884df/deploy-status)](https://app.netlify.com/sites/ueo/deploys)

This site is also deployed on a preview URL for the purposes of checking content updates before they are deployed to the production site.

https://preview-ueo.netlify.app/ (Preview site)

[![Netlify Status](https://api.netlify.com/api/v1/badges/0f7946ce-05b7-4620-9996-f0e18d239578/deploy-status)](https://app.netlify.com/sites/preview-ueo/deploys)


## What is this site?

A collection of curated resources and a searchable database of collated affordable housing to assist those in Santa Clara County, USA


## Data source

Data for these page views are drawn from Airtable via the [Airtable API](https://airtable.com/apphE4mk8YDqyHM0I/api/docs).
To access the data, the site requires _readonly_ access to Airtable via the appropriate Airtable base ID and the Airtable API key. Provide these via environment variables: 

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID` (`apphE4mk8YDqyHM0I`)

Permissions to the Airtable base can be granted by the adminitrators of [UEO Airbase](https://airtable.com/apphE4mk8YDqyHM0I/)

## Local development

To make your own copy of this site and begin development, follow these instructions:

```bash
# clone this repo
git clone https://github.com/theunitedeffort/theunitedeffort.org

# move into the working directory and install dependencies
cd theunitedeffort.org
npm install

# install Netlify CLI for centralized env var management
# and serverless function views
npm i -g netlify-cli

# Set up a new Netlify site for deployment and local dev coordination
netlify init  

# set environment variables
netlify env:set AIRTABLE_BASE_ID apphE4mk8YDqyHM0I
netlify env:set AIRTABLE_API_KEY {YOUR ENV VAR VALUE}

# run local development build and server
netlify dev
```

## Hosting and Deployment

The site is hosted on [Netlfy](https://netlify.com/) and is managed in a Netlify team called `United Effort Org`.

After setting up the site with Netlify, you will have a CI/CD pipeline set up to deploy on each push to your production git branch. Pushing changes to `prod` will automatically build and deploy the site.

## Planning and contributing

We collect and prioritise our efforts in [GitHub issues](https://github.com/philhawksworth/the-united-effort-orginization/issues), arranged into [Milestones](https://github.com/philhawksworth/the-united-effort-orginization/milestones) and coordinate our efforts on those issues in a GitHub [Project](https://github.com/users/philhawksworth/projects/1/views/1). To avoid duplicating effort, you should capture your tasks in [an issue](https://github.com/philhawksworth/the-united-effort-orginization/issues) and place it in the `Doing` column of [the Project](https://github.com/users/philhawksworth/projects/1/views/1) when you being working on it.
