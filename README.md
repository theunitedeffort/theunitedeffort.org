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
- `AIRTABLE_BASE_ID=apphE4mk8YDqyHM0I`

Permissions to the Airtable base can be granted by the adminitrators of the [UEO base](https://airtable.com/apphE4mk8YDqyHM0I/).
Once you have at least read access to the base, you can get a value for `AIRTABLE_API_KEY` by [generating an Airtable personal access token](https://airtable.com/create/tokens/new) with `data.records:read` scope on the UEO Housing Database.

Public transit data is also drawn from [511 SF Bay](https://511.org).  If you want this data in your development site, you will need to provide an addtional environment variable:

- `SF_BAY_511_API_KEY`

You can get such an API key by [requesting it from 511](https://511.org/open-data/token).

## Local development
### Prerequisites
[npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Environment setup
To make your own copy of this site and begin development, follow these instructions:


#### Clone this repo
```bash
git clone https://github.com/theunitedeffort/theunitedeffort.org
```

#### Install dependencies
```bash
cd theunitedeffort.org
npm install
```

#### Install Netlify CLI
```bash
npm i -g netlify-cli
```

#### Set environment variables
Note you may want to add these to your `.bashrc` file or Node.js `.env` file to save them across sessions.
```bash
export AIRTABLE_BASE_ID=apphE4mk8YDqyHM0I
export AIRTABLE_API_KEY={YOUR PERSONAL ACCESS TOKEN}
```

#### Run local development build and server
```bash
netlify dev
```

## Hosting and Deployment

The site is hosted on [Netlify](https://netlify.com/) and is managed in a Netlify team called `United Effort Org`.

After setting up the site with Netlify, you will have a CI/CD pipeline set up to deploy on each push to your production git branch. Pushing changes to `prod` will automatically build and deploy the site.

## Planning and contributing

We collect and prioritise our efforts in [GitHub issues](https://github.com/philhawksworth/the-united-effort-orginization/issues), arranged into [Milestones](https://github.com/philhawksworth/the-united-effort-orginization/milestones) and coordinate our efforts on those issues in a GitHub [Project](https://github.com/users/philhawksworth/projects/1/views/1). To avoid duplicating effort, you should capture your tasks in [an issue](https://github.com/philhawksworth/the-united-effort-orginization/issues) and place it in the `Doing` column of [the Project](https://github.com/users/philhawksworth/projects/1/views/1) when you being working on it.
