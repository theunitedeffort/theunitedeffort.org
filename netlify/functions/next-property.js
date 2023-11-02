const Airtable = require('airtable');
const base = new Airtable(
  {apiKey: process.env.AIRTABLE_WRITE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const HOUSING_CHANGE_QUEUE_TABLE = "tblKO2Ea4NGEoDGND";
const MAX_IN_PROGRESS_DURATION_HRS = 8;

// Sort ranking for unit type.
// Highest rank = 1. Types not listed here will be sorted alphabetically.
// Force an item to be ranked last every time with rank = -1.
const SORT_RANKING = new Map([
  // Unit Type
  ['SRO', 1],
  ['Studio', 2],
  ['Others', -1],
  // Availability
  ['Available', 1],
  ['Waitlist Open', 2],
  ['Waitlist Closed', 3],
  ['Call for Status', 4],
]);

// Sorts rent offerings so that the generally cheaper offerings are first.
function sortRents(values) {
  let sorted = values.sort(function(a, b) {
    // Compare rent offerings.
    // If both offerings have differing rent, sort according to those.  
    // Otherwise, use min income if available.
    // Otherwise, use max income (the low end of the range) if available.
    // If the offerings have none of those three values, don't sort at all, as 
    // there is nothing to compare against.
    let compA = 0;
    let compB = 0;
    if (a.fields.RENT_PER_MONTH_USD && 
        b.fields.RENT_PER_MONTH_USD && 
        a.fields.RENT_PER_MONTH_USD != b.fields.RENT_PER_MONTH_USD) {
      compA = a.fields.RENT_PER_MONTH_USD;
      compB = b.fields.RENT_PER_MONTH_USD;
    } else if (a.fields.MIN_YEARLY_INCOME_USD && 
               b.fields.MIN_YEARLY_INCOME_USD &&
               a.fields.MIN_YEARLY_INCOME_USD != b.fields.MIN_YEARLY_INCOME_USD) {
      compA = a.fields.MIN_YEARLY_INCOME_USD;
      compB = b.fields.MIN_YEARLY_INCOME_USD;
    } else if (
        a.fields.MAX_YEARLY_INCOME_LOW_USD && 
        b.fields.MAX_YEARLY_INCOME_LOW_USD &&
        a.fields.MAX_YEARLY_INCOME_LOW_USD != b.fields.MAX_YEARLY_INCOME_LOW_USD) {
      compA = a.fields.MAX_YEARLY_INCOME_LOW_USD;
      compB = b.fields.MAX_YEARLY_INCOME_LOW_USD;
    }
    if (compA < compB) {
      return -1;
    }
    if (compA > compB) {
      return 1;
    }
    return 0;
  });
  return sorted;
}

function rankSortHelper(a, b) {
  let rankA = SORT_RANKING.get(a);
  let rankB = SORT_RANKING.get(b);
  // Special handling for the -1 rank, which is always sorted last.
  if (rankB < 0) {
    return -1;
  } else if (rankA < 0) {
    return 1;
  // Sort by rank if both items have one.
  } else if (rankA && rankB) {
    return rankA - rankB;
  // Put unranked items after the ranked ones.
  } else if (rankA && !rankB) {
    return -1;
  } else if (!rankA && rankB) {
    return 1;
  // Sort unranked items alphabetically.
  } else if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}

// Sorts unit types according to a custom sort order.
// TODO: Make this sorting function shared within the entire
// codebase.
function sortUnitTypes(values) {
  let sorted = values.sort(function(a, b) {
    const [typeA, statusA] = a.split('__');
    const [typeB, statusB] = b.split('__');
    if (typeA === typeB) {
      return rankSortHelper(statusA, statusB);
    }
    else {
      return rankSortHelper(typeA, typeB);
    }
  });
  return sorted;
}

// Groups unit records by unit type.
// Returns an array of units records arrays.  Each item in the array is an array
// of all the units records of one type and status (e.g. 1 Bedroom Waitlist
// Open, 1 Bedroom Waitlist Closed, Studio Waitlist Open, etc). Inner
// arrays are sorted by rent offering cost and outer array is sorted by unit
// type.
function groupByUnitTypeAndStatus(units) {
  groupedUnits = [];
  let tempMap = {};
  for (let unitRecord of units) {
    let key = `${unitRecord.fields["TYPE"]}__${unitRecord.fields["STATUS"]}`;
    tempMap[key] = tempMap[key] || [];
    tempMap[key].push(unitRecord);
  }
  for (let unitType of sortUnitTypes(Object.keys(tempMap))) {
    groupedUnits.push(sortRents(tempMap[unitType]));
  }
  return groupedUnits;
}

// Gets all records data about the units within the property with housing ID 
// 'housingId'.  Returns a list of record objects or an empty list if
// no units records are found.
const fetchUnitRecords = async(unitsTableId, housingId) => {
  if (!unitsTableId) {
    return [];
  }
  const table = base(unitsTableId);
  return table.select({
    filterByFormula: `{_DISPLAY_ID} = "${housingId}"`
  })
  .all()
  .then(records => {
    return records.map(x => x._rawJson);
  });
}

// Gets the record data corresponding to the property with housing ID 
// 'housingId'.  
// If no property exists with the given housing ID, returns nothing.
const fetchHousingRecord = async(housingTableId, housingId) => {
  // TODO: Error handling.
  if (!housingTableId) {
    return;
  }
  const table = base(housingTableId);
  return table.select({
    filterByFormula: `{DISPLAY_ID} = "${housingId}"`
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return;
    }
    return records[0]._rawJson;
  });
}

// Gets the Airtable record ID string for the queue item belonging to
// updates campaign 'campaign' and with housing ID 'housingId'.
// If more than one such record exists, this returns the newest one.
// If no such record exists, returns an empty string.
const fetchQueueRecordId = async(campaign, housingId) => {
  // TODO: Error handling.
  if (!housingId) {
    return "";
  }
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let filterStr = `
    AND(
      {CAMPAIGN} = "${campaign}",
      {_DISPLAY_ID} = "${housingId}"
    )`;
  return records = table.select({
    fields: [],
    sort : [{field: "ID", direction: "desc"}],
    filterByFormula: filterStr,
    maxRecords: 1,
  })
  .all()
  .then(records => {
    if (records.length < 1) {
      return "";
    }
    return records[0].id;
  });
}

// Updates the given queue item with record ID 'recordId' to have
// an in-progress timestamp of now.
const markInProgressInQueue = async(recordId) => {
  // TODO: Handle bad record ID.
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  let now = new Date();
  return table.update(recordId, {"IN_PROGRESS_DATETIME": now.toISOString()});
}

// Gets data about the current state of the property updates queue for
// the updates campaign 'campaign'. This data includes information about
// the next property up in the queue.
const fetchQueueData = async(campaign) => {
  const table = base(HOUSING_CHANGE_QUEUE_TABLE);
  const staleInProgress = new Date(
    Date.now() - (MAX_IN_PROGRESS_DURATION_HRS * 60 * 60 * 1000));
  let filterFormula = `{CAMPAIGN} = "${campaign}"`;
  return table.select({
    fields: [
      "ID",
      "_DISPLAY_ID",
      "IN_PROGRESS_DATETIME",
      "COMPLETED_DATETIME",
      "HOUSING_DB",
      "UNITS_DB"],
    filterByFormula: filterFormula,
    // Sort by management company to ensure that sequential properties
    // in the queue have similar-looking websites for easier data-hunting
    // by our volunteers.
    sort: [{field: "_MANAGEMENT_COMPANY", direction: "asc"},
           {field: "_DISPLAY_ID", direction: "asc"}],
  })
  .all()
  .then(records => {
    let completed = [];
    let inProgress = [];
    let todo = [];
    // Group queue items into "completed", "in progress", and "to-do" based
    // on stored timestamps of transitions between these states.
    for (let record of records) {
      if (record.get("COMPLETED_DATETIME")) {
        completed.push(record);
      // If an item has been marked as "in progress" for over
      // MAX_IN_PROGRESS_DURATION_HRS, it should be considered no longer in 
      // progress.
      } else if (record.get("IN_PROGRESS_DATETIME") && 
          Date.parse(record.get("IN_PROGRESS_DATETIME")) > staleInProgress) {
        inProgress.push(record);
      } else {
        todo.push(record);
      }
    }
    let queueData = {
      numCompleted: completed.length,
      numInProgress: inProgress.length,
      numTodo: todo.length,
      numTotal: records.length,
      thisItem: {
        housingId: todo.length > 0 ? todo[0].get("_DISPLAY_ID") : "",
        recordId: todo.length > 0 ? todo[0].id : "",
        // All records have the same housing and units db since it's
        // defined at the campaign level.
        housingTable: records[0].get("HOUSING_DB"),
        unitsTable: records[0].get("UNITS_DB"),
      },
    };
    return queueData;
  });
}

exports.handler = async function(event) {
  console.log(event.path);
  // Get the campaign name and optional housing ID from the URL
  const paramsStr = event.path.split("next-property/")[1];
  const params = paramsStr.split("/");
  let campaign = "";
  let housingId = "";
  let data = {};
  if (params.length >= 1) {
    campaign = params[0];
  }
  if (params.length >= 2) {
    housingId = params[1];
  }

  if (campaign) {
    console.log("fetching queue data");
    let queueData = await Promise.all([
      fetchQueueRecordId(campaign, housingId),
      fetchQueueData(campaign)
    ]);
    // Get the matching queue item for the given housing ID (if there is one).
    let queueRecordIdOverride = queueData[0]; 
    console.log(`queueRecordIdOverride = ${queueRecordIdOverride}`);
    data.queue = queueData[1];

    if (housingId) {
      // A housing ID was given explicitly in the URL, and it matches an 
      // existing queue item.  Thus, override whatever the queue says is next up
      // with the queue record data for the housing ID given in the URL.
      // Note the housing and units db do not need to be overidden because the
      // db identifiers should be constant for each campaign.
      data.queue.thisItem.recordId = queueRecordIdOverride;
      data.queue.thisItem.housingId = housingId;
    } else {
      // Set the housing ID based on the next property in the queue.
      housingId = data.queue.thisItem.housingId;
    }
    console.log(data.queue);

    // Get all the data for the housing ID.
    console.log(`fetching unit records and housing record for ID: ` +
      `${housingId} from housing table ${data.queue.thisItem.housingTable} ` +
      `and units table ${data.queue.thisItem.unitsTable}`);
    let housingData = await Promise.all([
      fetchHousingRecord(data.queue.thisItem.housingTable, housingId),
      fetchUnitRecords(data.queue.thisItem.unitsTable, housingId)]);
    data.housing = housingData[0];
    data.units = groupByUnitTypeAndStatus(housingData[1]);

    // If there is a matching queue record for this housing ID, update it to
    // be in progress.
    if (data.queue.thisItem.recordId) {
      console.log("updating in progress status for ID: " + housingId);
      await markInProgressInQueue(data.queue.thisItem.recordId);
      const updatedQueue = await fetchQueueData(campaign);
      // TODO: Get these updated counts from the queue?
      // TODO: Only increment/decrement if the apartment in question is
      // actually newly in-progress.  it's possible to re-visit an in-progress
      // or completed apartment using the URL override.
      data.queue.numInProgress = updatedQueue.numInProgress;
      data.queue.numTodo = updatedQueue.numTodo;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json"
    }
  };
};