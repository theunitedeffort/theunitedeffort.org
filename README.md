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
To access the data, the site requires _readonly_ access to Airtable via the appropriate Airtable base IDs and the Airtable API key. Provide these via environment variables: 

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID=apphE4mk8YDqyHM0I`

Permissions to the Airtable bases can be granted by the adminitrators of the [UEO base](https://airtable.com/apphE4mk8YDqyHM0I/).
Once you have at least read access to the bases, you can get a value for `AIRTABLE_API_KEY` by [generating an Airtable personal access token](https://airtable.com/create/tokens/new) with `data.records:read` scope on the UEO Housing Database.

Public transit data is also drawn from [511 SF Bay](https://511.org).  If you want this data in your development site, you will need to provide an addtional optional environment variable:

- `SF_BAY_511_API_KEY`

You can get such an API key by [requesting it from 511](https://511.org/open-data/token).

## Local development
### Prerequisites
This project requires Node.js and npm.  It's recommended that you use a node version manager such as nvm to install Node.js and npm. You can find detailed instructions for installation via a node version manager on the [npm website](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm) or use the simplified instructions below.

#### Linux and Mac ([Full instructions](https://github.com/nvm-sh/nvm#installing-and-updating))
Install nvm:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

Then close and re-open your terminal window. Next, install Node.js using nvm:

```
nvm install node
```

#### Windows ([Full instructions](https://github.com/coreybutler/nvm-windows#installation--upgrades))
Download and run the latest [nvm-setup.exe](https://github.com/coreybutler/nvm-windows/releases)

Open a terminal as Administrator, then install Node.js:

```
nvm install latest
nvm use latest
```

### Environment setup
To make your own copy of this site and begin development, follow these instructions:


#### Clone this repo
```
git clone https://github.com/theunitedeffort/theunitedeffort.org
```

#### Install dependencies
```
cd theunitedeffort.org
npm install
```

#### Install Netlify CLI
```
npm i -g netlify-cli
```

#### Store environment variables
First store the `AIRTABLE_BASE_ID` variable:

```
echo AIRTABLE_BASE_ID=apphE4mk8YDqyHM0I >> .env
```

Next, store the `AIRTABLE_API_KEY` variable as your [personal access token](https://github.com/theunitedeffort/theunitedeffort.org#data-source). Since everyone's Airtable personal access token is different, you will have to modify the below command to replace `{YOUR_ACCESS_TOKEN}` with your actual access token.  For example, if your Airtable personal access token was `abc123`, then the command would be `echo AIRTABLE_API_KEY=abc123 > .env`

```
echo AIRTABLE_API_KEY={YOUR_ACCESS_TOKEN} >> .env
```

#### Run local development build and server
```bash
netlify dev
```

You can share a live development server without making a branch or commit via HTTPS tunneling with the following command:
```bash
netlify dev --live
```
This is particularly useful if you are building a feature that needs to be tested on another device.

#### Branches
To keep contributions organized and to ensure safe working, please create a new branch for any change you wish to make or issue you wish to resolve. When a branch is published to GitHub, Netlify will automatically create a "branch deploy," a development site that can be viewed at {branch_name}--ueo.netlify.app. For example, a branch called `foobar` will have an associated branch deploy with the URL foobar--ueo.netlify.app.

If the branch name contains a slash (/), then the URL of the development site will have all slashes replaced with dashes (-). For example, branch `some/branch` becomes some-branch--ueo.netlify.app.

Every time commits are pushed to a branch, Netlify will rebuild the development site for that branch.

## Hosting and Deployment

The site is hosted on [Netlify](https://netlify.com/) and is managed in a Netlify team called `United Effort Org`.

After setting up the site with Netlify, you will have a CI/CD pipeline set up to deploy on each push to your production git branch. Pushing changes to `prod` will automatically build and deploy the site.

## Planning and contributing

We collect and prioritise our efforts in [GitHub issues](https://github.com/philhawksworth/the-united-effort-orginization/issues), arranged into [Milestones](https://github.com/philhawksworth/the-united-effort-orginization/milestones) and coordinate our efforts on those issues in a GitHub [Project](https://github.com/users/philhawksworth/projects/1/views/1). To avoid duplicating effort, you should capture your tasks in [an issue](https://github.com/philhawksworth/the-united-effort-orginization/issues) and mark yourself as the assignee.
