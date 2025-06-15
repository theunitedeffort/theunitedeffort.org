const {AssetCache} = require('@11ty/eleventy-fetch');
const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = 'tblRtXBod9CC0mivK';
const HOUSING_DATABASE_TABLE = 'tbl8LUgXQoTYEw2Yh';
const RESOURCES_TABLE = 'tblyp7AurXeZEIW4J';
const REFERRERS_TABLE = 'tblRBvQCTQDsp989R';
const HIGH_CAPACITY_UNIT = 4; // Bedrooms

// A group of checkboxes for filtering housing results.
function FilterSection(heading, name, options) {
  this.heading = heading;
  this.name = name;
  this.options = options;
}

// A single checkbox for filtering housing results.
function FilterCheckbox(name, label, selected) {
  this.name = name;
  this.label = label || name;
  this.selected = selected || false;
}

const fetchApartmentRecords = async () => {
  const apartments = [];
  const table = base(HOUSING_DATABASE_TABLE);

  return table.select({
    fields: [
      'DISPLAY_ID',
      'UNITS',
      'APT_NAME',
      'ADDRESS',
      'SECOND_ADDRESS',
      'CITY',
      'PHONE',
      'SECOND_PHONE',
      'EMAIL',
      'SECOND_EMAIL',
      'PROPERTY_URL',
      ...[...Array(4).keys()].map((n) => `SUPPLEMENTAL_URL_${n + 1}`),
      'LOC_COORDS',
      'VERIFIED_LOC_COORDS',
      'NUM_TOTAL_UNITS',
      'NUM_RESTRICTED_UNITS',
      'POPULATIONS_SERVED',
      'MIN_RESIDENT_AGE',
      'MAX_RESIDENT_AGE',
      'DISALLOWS_PUBLIC_APPLICATIONS',
      'HAS_WHEELCHAIR_ACCESSIBLE_UNITS',
      'PREFERS_LOCAL_APPLICANTS',
      'PUBLISH_STATUS',
    ],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        // Only take apartments that have units associated with them and have
        // been published (i.e. not a draft)
        if (record.get('UNITS') &&
            record.get('PUBLISH_STATUS') == 'Published') {
          apartments.push({
            id: record.get('DISPLAY_ID'),
            aptName: record.get('APT_NAME'),
            addresses: [record.get('ADDRESS'), record.get('SECOND_ADDRESS')]
              .filter((a) => a),
            city: record.get('CITY'),
            locCoords: record.get('LOC_COORDS'),
            verifiedLocCoords: record.get('VERIFIED_LOC_COORDS'),
            phones: [record.get('PHONE'), record.get('SECOND_PHONE')]
              .filter((p) => p),
            website: record.get('PROPERTY_URL'),
            supplementalUrls: [...Array(4).keys()]
              .map((n) => record.get(`SUPPLEMENTAL_URL_${n + 1}`))
              .filter((u) => u),
            emails: [record.get('EMAIL'), record.get('SECOND_EMAIL')]
              .filter((e) => e),
            numTotalUnits: record.get('NUM_TOTAL_UNITS'),
            numRestrictedUnits: record.get('NUM_RESTRICTED_UNITS'),
            populationsServed: record.get('POPULATIONS_SERVED') || [],
            minAge: record.get('MIN_RESIDENT_AGE'),
            maxAge: record.get('MAX_RESIDENT_AGE'),
            disallowsPublicApps: record.get(
              'DISALLOWS_PUBLIC_APPLICATIONS'),
            hasWheelchairAccessibleUnits: record.get(
              'HAS_WHEELCHAIR_ACCESSIBLE_UNITS'),
            prefersLocalApplicants: record.get(
              'PREFERS_LOCAL_APPLICANTS'),
          });
        }
      });
      return apartments;
    });
};

// Get housing units from Airtable
const fetchUnitRecords = async () => {
  const units = [];
  const table = base(UNITS_TABLE);

  return table.select({
    fields: [
      '_DISPLAY_ID',
      'TYPE',
      'STATUS',
      'MIN_OCCUPANCY',
      'MAX_OCCUPANCY',
      'PERCENT_AMI',
      'RENT_PER_MONTH_USD',
      'ALTERNATE_RENT_DESCRIPTION',
      'MIN_YEARLY_INCOME_USD',
      'OVERRIDE_MIN_YEARLY_INCOME_USD',
      'MIN_INCOME_RENT_FACTOR',
      'MAX_YEARLY_INCOME_LOW_USD',
      'MAX_YEARLY_INCOME_HIGH_USD',
      ...[...Array(12).keys()].map((n) => `MAX_YEARLY_INCOME_HH_${n + 1}_USD`),
    ],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        units.push({
          parent_id: record.get('_DISPLAY_ID')?.[0],
          type: record.get('TYPE'),
          openStatus: record.get('STATUS'),
          // Combine min and max occupancy into a single string for easier
          // grouping and sorting later.  This is a convenience only; the
          // occupancyLimit property below should be used to render apartment
          // occupancy limits.
          occupancyGroup: `${record.get('MIN_OCCUPANCY')},${record.get('MAX_OCCUPANCY')}`,
          occupancyLimit: {
            min: record.get('MIN_OCCUPANCY'),
            max: record.get('MAX_OCCUPANCY'),
          },
          incomeBracket: record.get('PERCENT_AMI'),
          rent: {
            amount: record.get('RENT_PER_MONTH_USD'),
            alternateDesc: record.get('ALTERNATE_RENT_DESCRIPTION'),
          },
          minIncome: {
            amount: record.get('MIN_YEARLY_INCOME_USD'),
            isCalculated: !record.get('OVERRIDE_MIN_YEARLY_INCOME_USD'),
            rentFactor: record.get('MIN_INCOME_RENT_FACTOR'),
          },
          maxIncome: {
            low: record.get('MAX_YEARLY_INCOME_LOW_USD'),
            high: record.get('MAX_YEARLY_INCOME_HIGH_USD'),
            byHouseholdSize: {
              ...Object.fromEntries([...Array(12).keys()].map(
                (n) => [`size${n + 1}`,
                  record.get(`MAX_YEARLY_INCOME_HH_${n + 1}_USD`)])),
            },
          },
        });
      });
      return units;
    });
};

const fetchReferrerRecords = async () => {
  const referrers = [];
  const table = base(REFERRERS_TABLE);
  return table.select({
    fields: [
      'Name',
      'Link',
      'Phone',
      'This Record ID',
    ],
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        if (record.get('Name')) {
          referrers.push({
            id: record.get('This Record ID'),
            name: record.get('Name'),
            link: record.get('Link'),
            phone: record.get('Phone'),
          });
        }
      });
      return referrers;
    });
};

const fetchShelterRecords = async () => {
  const shelters = [];
  const table = base(RESOURCES_TABLE);
  return table.select({
    fields: [
      'This Record ID',
      'Show on website',
      'Title',
      'Organization',
      'Description',
      'Address',
      'City',
      'ZIP Code',
      'Phone',
      'Email',
      'Access',
      'Referrers',
      'Populations Served',
      'Gender Restriction',
      'Individual/Family',
      'Client Min Age',
      'Client Max Age',
      'Dependent Min Age',
      'Dependent Max Age',
      'URL',
      'Loc Coords',
      'Verified Loc Coords',
      'Location is Confidential',
    ],
    filterByFormula: 'and({Category} = "Shelter", {Display} = "Level 2")',
  })
    .all()
    .then((records) => {
      records.forEach(function(record) {
        // We hide the address for non-walk-in shelters even though the
        // address is in our internal database.  Shelters with a confidential
        // location don't even have the address stored in our database at all.
        function showLocation(record) {
          return record.get('Access') == 'Arrive in-person';
        }

        // Only take shelters that have a title and have been marked for
        // publication. (i.e. not a draft)
        if (record.get('Title') && record.get('Show on website')) {
          shelters.push({
            id: record.get('This Record ID'),
            title: record.get('Title'),
            organization: record.get('Organization'),
            description: record.get('Description'),
            address: showLocation(record) ? record.get('Address') : undefined,
            city: record.get('City'),
            zip: record.get('ZIP Code'),
            phone: record.get('Phone'),
            website: record.get('URL'),
            email: record.get('Email'),
            populationsServed: record.get('Populations Served') || [],
            genderRestriction: record.get('Gender Restriction'),
            groupSizes: record.get('Individual/Family') || [],
            clientMinAge: record.get('Client Min Age'),
            clientMaxAge: record.get('Client Max Age'),
            dependentMinAge: record.get('Dependent Min Age'),
            dependentMaxAge: record.get('Dependent Max Age'),
            access: record.get('Access'),
            referrerIds: record.get('Referrers') || [],
            locCoords:
              showLocation(record) ? record.get('Loc Coords') : undefined,
            verifiedLocCoords: record.get('Verified Loc Coords'),
            confidentialLoc: record.get('Location is Confidential'),
          });
        }
      });
      return shelters;
    });
};

const compiledData = async () => {
  console.log('Fetching apartment, units, shelter, and referrers data.');
  const [apartments, units, shelters, referrers] = await Promise.all([
    fetchApartmentRecords(),
    fetchUnitRecords(),
    fetchShelterRecords(),
    fetchReferrerRecords(),
  ]);
  console.log(`got ${apartments.length} apartments, ${units.length} units, ` +
    `${shelters.length} shelters, and ${referrers.length} referrers`);

  // Add the associated units to each apartment
  for (const apartment of apartments) {
    apartment.units = units.filter((u) => u.parent_id === apartment.id);
  }

  // Add the associated referrers to each shelter
  for (const shelter of shelters) {
    shelter.referrers = referrers.filter(
      (r) => shelter.referrerIds.includes(r.id));
  }

  // Pre-sort the lists so that templates don't need to later.
  const sortedApts = apartments.sort((a, b) => {
    const nameA = a.aptName.toLowerCase();
    const nameB = b.aptName.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

  const sortedShelters = shelters.sort((a, b) => {
    // I mean, it works.
    const cityA = a.city ? a.city.toLowerCase() : 'zzz';
    const cityB = b.city ? b.city.toLowerCase() : 'zzz';
    const nameA = a.title.toLowerCase();
    const nameB = b.title.toLowerCase();
    if (cityA < cityB) {
      return -1;
    }
    if (cityA > cityB) {
      return 1;
    } else {
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    }
  });
  return {housing: sortedApts, shelters: sortedShelters};
};

const shelterFilterOptions = (shelters) => {
  const cities = [...new Set(shelters.map((s) => s.city).filter((c) => c))];
  const allPopulationsServed = [...new Set(
    shelters.map((s) => s.populationsServed).flat().filter((p) => p))];
  const genderRestrictions = [
    ...new Set(shelters.map((s) => s.genderRestriction).filter((g) => g))];
  const groupSizes = [...new Set(
    shelters.map((s) => s.groupSizes).flat().filter((p) => p))];

  const filterVals = [];
  filterVals.push(new FilterSection('City', 'city',
    cities.map((x) => new FilterCheckbox(x))));

  filterVals.push(new FilterSection('Populations Served', 'populationsServed',
    allPopulationsServed.map((x) => new FilterCheckbox(x))));

  filterVals.push(new FilterSection('Gender Restriction', 'genderRestriction',
    genderRestrictions.map((x) => new FilterCheckbox(x))));

  filterVals.push(new FilterSection('Group Size', 'groupSize',
    groupSizes.map((x) => new FilterCheckbox(x))));

  return filterVals;
};

const housingFilterOptions = (housing) => {
  const cities = [...new Set(housing.map((h) => h.city).filter((c) => c))];
  const openStatuses = [...new Set(
    housing.map((h) => h.units.map((u) => u.openStatus)).flat()
      .filter((s) => s))];
  const unitTypes = [...new Set(
    housing.map((h) => h.units.map((u) => u.type)).flat().filter((t) => t))];
  const allPopulationsServed = [...new Set(
    housing.map((h) => h.populationsServed).flat().filter((p) => p))];

  const filterVals = [];
  filterVals.push(new FilterSection('City', 'city',
    cities.map((x) => new FilterCheckbox(x))));

  // Special handling for some unit types
  // Any "{N} Bedroom" entries that have HIGH_CAPACITY_UNIT or greater bedrooms
  // will get grouped  together into one filter checkbox.
  const unitTypeOptions = [];
  const bedroomSizes = [];
  let bedroomStr = '';
  for (const unitType of unitTypes) {
    const match = unitType.match(/^(\d) ?(bedroom|br)$/i);
    if (match) {
      bedroomSizes.push({num: parseInt(match[1]), str: unitType});
      bedroomStr = match[2];
    }
  }
  const catchallSize = Math.min(Math.max(...bedroomSizes.map((x) => x.num)),
    HIGH_CAPACITY_UNIT);
  // Only do grouping if the unit types list includes units with at least
  // HIGH_CAPACITY_UNIT bedrooms.
  if (catchallSize >= HIGH_CAPACITY_UNIT) {
    // Get all unit types that will be grouped together
    const groupedSizes = bedroomSizes.filter((x) => x.num >= catchallSize);
    for (const bedroomSize of groupedSizes) {
      const idx = unitTypes.indexOf(bedroomSize.str);
      // Remove it from the unit types list so it can be grouped instead.
      unitTypes.splice(idx, 1);
    }
    // Make a single entry out of all the grouped sizes.
    const groupedStr = groupedSizes.map((x) => x.str).join(', ');
    unitTypeOptions.push(new FilterCheckbox(groupedStr,
      `${HIGH_CAPACITY_UNIT}+ ${bedroomStr}`));
  }
  unitTypeOptions.push(...unitTypes.map((x) => new FilterCheckbox(x)));
  filterVals.push(new FilterSection('Type of Unit', 'unitType',
    unitTypeOptions));

  filterVals.push(new FilterSection('Availability', 'availability',
    openStatuses.map((x) => new FilterCheckbox(x))));
  filterVals.push(new FilterSection('Populations Served', 'populationsServed',
    allPopulationsServed.map((x) => new FilterCheckbox(x))));

  return filterVals;
};

// Returns an object containing a list of FilterSections with each FilterSection
// having a unique list of FilterCheckboxes encompassing all the values
// available in the Airtable data at that time.
module.exports = async function() {
  const asset = new AssetCache('affordable_housing_data');
  // This cache duration will only be used at build time.
  let cacheDuration = '1h';
  if (process.env.ELEVENTY_SERVERLESS) {
    // Use the serverless cache location specified in .eleventy.js
    asset.cacheDirectory = 'cache';
    cacheDuration = '*'; // Infinite duration (data refreshes at each build)
  }
  if (asset.isCacheValid(cacheDuration)) {
    console.log('Returning cached housing, shelter, and filter data.');
    const data = await asset.getCachedValue();
    return data;
  }

  const compiled = await compiledData();
  const housingFilterVals = housingFilterOptions(compiled.housing);
  const shelterFilterVals = shelterFilterOptions(compiled.shelters);

  const data = {
    housingFilterValues: housingFilterVals,
    housingList: compiled.housing,
    shelterFilterValues: shelterFilterVals,
    shelterList: compiled.shelters,
  };

  await asset.save(data, 'json');
  return data;
};
