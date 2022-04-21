# The United Effort Organization

## Example housing listing and detail pages

- https://theunitedeffortorginazation.netlify.app/
- https://preview-theunitedeffortorginazation.netlify.app/ (Preview site)

## What is this site?

A version of [The United Effort Organization](https://theunitedeffort.org/)'s affordable housing list and associated details pages who's original versions can be find at:

- https://theunitedeffort.org/Home/CollectionListNew?searchInput=
- https://theunitedeffort.org/Home/Detail?mid=1250 etc

This version is populated with data from an Airbase database rather than the original MS SQLServer db. The intent is to provide an easier route to managing the underlying content, and have greater control over the user experience delivered on these pages.


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
git clone https://github.com/philhawksworth/the-united-effort-orginization

# move into the working directory and install dependencies
cd the-united-effort-orginization
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

## Deployment

After setting up the site with Netlify, you will have a CI/CD pipeline set up to deploy on each push to your production git branch. Pushing changes to `main` will automatically build and deploy the site.




## Pass-through to original production site

For a seamless experience for the site visitor, all requests that cannot be satisfied by this site are invisibly proxied through to the original production site at https://theunitedeffort.org/

This technique could be used to make this site an augmentation layer in front of the original site by pointing the DNS for `theunitedeffort.org` at this site, and proxying any unsatisfied requests to the original production site via alternate domain name or address.

Proxying is achieved via rules defined [in the `netlify.toml`](https://github.com/philhawksworth/the-ueo-demo/blob/main/netlify.toml#L23-L27) file.
