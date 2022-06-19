const USER_NAME_KEY = "userName";
const APT_NAME_FIELD_ID = "fldMcM49qaNr3EQ2a";

// Submits the housing changes form.
function submitForm() {
  // Rather than use a <button type="submit">, handle the submission
  // with this listener on a normal button.  This prevents an Enter
  // keystroke from submitting the form.
  document.getElementById('housing-changes').submit();
}

// Sets a message to display instead of the usual input form when a
// terminal or dead-end action occurs (such as the end of the queue).
function setTerminalMessage(header, content) {
  document.getElementById("apt-name-header").textContent = header;
  document.getElementById("terminal-content").innerHTML = content;
  document.getElementById("input-content").setAttribute("hidden", "hidden");
  document.getElementById("property-webpage-frame").setAttribute(
    "hidden", "hidden");
}

// Displays a message for the empty property queue condition.
function setEmptyQueueMessage(queue) {
  let header = "All done!  No more properties to update for now.";
  let content = (
    "We will let you know when we need help for the next " +
    "affordable housing database update.");
  if (queue.numInProgress) {
    let verb = queue.numInProgress > 1 ? "are" : "is";
    let pluralProperty = queue.numInProgress > 1 ? "properties" : "property";
    let pluralUser = queue.numInProgress > 1 ? "users" : "user";
    let pronoun = queue.numInProgress > 1 ? "These" : "This";
    let adj = queue.numInProgress > 1 ? "other" : "another";
    content = `However, there ${verb} still ${queue.numInProgress} 
      ${pluralProperty} currently assigned to ${adj} ${pluralUser}. ${pronoun}
      ${pluralProperty} may return to the queue later, so check back
      to see if there is more to do.`;
  }
  setTerminalMessage(header, content);
}

// Displays an error message if the housing ID requested does not exist.
function setInvalidHousingIdMessage(housingId, campaignPath) {
  let header = "Oops! That property doesn't seem to exist.";
  let content = `There is no property with the ID
    <span class="bold">${housingId}</span> in our database.  Check your URL
    and try again or see the <a href="${campaignPath}">next property</a> that
    needs to be checked.`;
  setTerminalMessage(header, content);
}

// Sets the value of the user's name from an input field.
// Also saves the value to local storage for later retrieval.
function setUserName() {
  let userNameInput = document.getElementById("user-name-input");
  let userName = userNameInput.value.trim();
  if (userName) {
    document.getElementById("user-name-input-container").setAttribute("hidden",
      "hidden");
    document.getElementById("edit-user-name").removeAttribute("hidden");
    document.getElementById("user-name").setAttribute("value", userName);
    userNameInput.setAttribute("value", userName);
    document.getElementById("welcome-name").textContent = `, ${userName}`;
    localStorage.setItem(USER_NAME_KEY, userName);
  }
}

// Displays the relevant input field so a user can edit their name.
function editUserName() {
  document.getElementById("user-name-input-container").removeAttribute(
    "hidden");
  document.getElementById("edit-user-name").setAttribute("hidden", "hidden");
  document.getElementById("welcome-name").textContent = "";
  document.getElementById("user-name-input").focus();
}

function handleUserNameKeydown(e) {
  // Allow the user to re-commit their name even if they don't make any changes to it.
  if (e.code === "Enter") {
    let inputUserName = document.getElementById("user-name-input");
    inputUserName.dispatchEvent(new Event("change"));
  }
}

function updatePageTitle() {
  document.getElementById("apt-name-header").textContent = this.value;
}

// Fills an existing form field with the given `value`.
// the parameter 'field' is a <input>, <textarea>, or <select> node.
function prefillField(field, value) {
  if (!value) {
    // Nothing to prefill.
    return;
  }
  let isMultiselect = field.parentNode.className == "multiselect";
  if (field.tagName == "INPUT") {
    if (field.type == "checkbox") {
      let doCheck = false;
      // Multiselects are displayed not as <select> elements but rather
      // a set of grouped checkboxes, so handle them here.
      if (isMultiselect) {
        doCheck = value.includes(field.value);
      } else {
        doCheck = value;
      }
      if (doCheck) {
        field.setAttribute("checked", "checked");
      }
    } else {
      field.setAttribute("value", value);
    }
  } else if (field.tagName == "TEXTAREA") {
    field.textContent = value;
  } else if (field.tagName == "SELECT") {
    for (option of field.childNodes) {
      if (option.value == value) {
        option.setAttribute("selected", "selected");
        break;
      }
    }
    field.setAttribute("value", value);
  } 
 
  // Field values have changed, so trigger the appropriate change
  // handlers.
  let changeEvent = new Event("change");
  field.dispatchEvent(changeEvent);
  if (isMultiselect) {
    // Trigger any onchange events handled by the multiselect itself 
    // (rather than the individual checkboxes within).
    field.parentNode.dispatchEvent(changeEvent);
  }
}

// Prefills the affordable housing changes form with data.
// The 'data' passed in typically comes from Airtable via fetchFormPrefillData()
// to show the current state of the database.
function prefillForm(data) {
  // Handle queue record ID separately, as it is not part of the affordable
  // housing database.
  if (data.queue.thisItem.recordId) {
    let queueRecordId = data.queue.thisItem.recordId;
    document.getElementById("queue-record-id").setAttribute("value",
      queueRecordId);
  }
  const fieldSelector = "input, textarea, select";
  let propertySection = document.getElementById("property-data");
  let unitsSection = document.getElementById("all-units");
  let propertyFields = propertySection.querySelectorAll(fieldSelector);
  let unitsFields = unitsSection.querySelectorAll(fieldSelector);
  
  for (field of propertyFields) {
    let value = data.housing.fields[field.name];
    prefillField(field, value);
  }

  for (field of unitsFields) {
    let [fieldName, unitIdx, offerIdx] = field.name.split(":");
    // If there is no offer index, this field applies to all offerings in the
    // unit. The values of these fields are the same for every offering, so
    // just take the first one.
    if (offerIdx === undefined) {
      offerIdx = 0;
    }
    if (unitIdx < data.units.length && offerIdx < data.units[unitIdx].length) {
      let value = data.units[unitIdx][offerIdx].fields[fieldName];
      prefillField(field, value);
    }
  }
}

// Gets the campaign and optional housing ID from the URL.
// Expected URL shape is: /campaigns/{campaign}/{housingId}
// Returns an object with 'campaign' and 'housingId' keys; the values
// may be empty strings if the URL does not contain that parameter.
function getPathParams() {
  let pathDirs = window.location.pathname.split("/").filter(x => x);
  // Just get the slug after /campaigns
  let paramDirs = pathDirs.slice(pathDirs.lastIndexOf("campaigns") + 1);
  let params = {};
  if (paramDirs.length >= 1) {
    params.campaign = paramDirs[0];
    if (paramDirs.length >= 2) {
      params.housingId = paramDirs[1];
    }
  }
  return params;
}

// Groups unit records by unit type.
// Returns a copy of 'data', but with the units property converted
// into an array of units records arrays.  Each item in the array corresponds to
// all the units records of one type (e.g. 1 Bedroom, Studio, etc).
function groupDataByUnitType(data) {
  let groupedData = JSON.parse(JSON.stringify(data));
  // Clear any existing units from the data copy to make way for grouped units.
  groupedData.units = [];
  let tempMap = {};
  for (unitRecord of data.units) {
    let typeKey = unitRecord.fields["TYPE"];
    tempMap[typeKey] = tempMap[typeKey] || [];
    tempMap[typeKey].push(unitRecord);
  }
  for (unitType of Object.keys(tempMap)) {
    groupedData.units.push(tempMap[unitType]);
  }
  return groupedData;
}

// Fetches all data required to prefill the input form fields.
async function fetchFormPrefillData(params) {
  if (!params.campaign) {
    return {};
  }
  let fetchPath = encodeURI(
    `/contrib/affordable-housing/next-property/${params.campaign}`);
  if (params.housingId) {
    fetchPath += `/${params.housingId}`;
  }
  // TODO: Error handling.
  let response = await fetch(fetchPath);
  let data = await response.json();
  let groupedData = groupDataByUnitType(data);
  console.log(groupedData);
  return groupedData;
}

// Adds all DOM event listeners.
function addListeners() {
  // Form submission
  let submitButtons = document.querySelectorAll("[id^=submit-button]");
  for (button of submitButtons) {
    button.addEventListener("click", submitForm);
  }

  // User name
  document.getElementById("edit-user-name").addEventListener("click",
    editUserName);
  let userNameInput = document.getElementById("user-name-input");
  userNameInput.addEventListener("change", setUserName);
  userNameInput.addEventListener("focusout", setUserName);
  userNameInput.addEventListener("keydown", handleUserNameKeydown);

  // Form inputs
  document.getElementById(APT_NAME_FIELD_ID).addEventListener("change",
    updatePageTitle);
}

// Initializes the user's name to the stored value if one exists.
function initUserName() {
  let userName = localStorage.getItem(USER_NAME_KEY);
  let userNameInput = document.getElementById("user-name-input");
  if (userName) {
    userNameInput.setAttribute("value", userName);
    userNameInput.dispatchEvent(new Event("change")); 
  }
}

// Prepares the page for display to the user.
function initPage(data, params) {
  initUserName();
  // A campaign is required for nearly all aspects of the page.
  if (params.campaign) {
    let safeCampaign = encodeURIComponent(params.campaign);
    document.getElementById("housing-changes").setAttribute("action",
     `/contrib/affordable-housing/thank-you?campaign=${safeCampaign}`);
    if (data.housing) {
      prefillForm(data);
    } else if (params.housingId) {
      let campaignPath = (
        `/contrib/affordable-housing/campaigns/${params.campaign}`);
      setInvalidHousingIdMessage(params.housingId, campaignPath)
    } else {
      setEmptyQueueMessage(data.queue);
    }
  }
}

// Script entry point.
async function run() {
  addListeners();
  let params = getPathParams();
  let data = await fetchFormPrefillData(params);
  initPage(data, params);
  if (params.campaign) {
    document.getElementById("campaign").setAttribute("value", params.campaign);
  }
}
