const USER_NAME_KEY = "userName";
const APT_NAME_FIELD_ID = "fldMcM49qaNr3EQ2a";
const POPULATIONS_SERVED_FIELD_ID = "fldkzU54q8lYtIH7G";
const PROPERTY_URL_FIELD_ID = "fldei8N0xw2VhjX9V";
const UNIT_TYPE_FIELD_ID = "fldJ4fP1y13NE6ywu";
const UNIT_STATUS_FIELD_ID = "fldTNeFcJ3dhDKLqZ";
const AMI_PERCENT_FIELD_ID = "fldBHf0GmnBHnZBFI";
const MAX_NUM_UNITS = document.querySelectorAll(
  `#all-units > div[id^="unit-"]`).length;
const MAX_NUM_OFFERINGS = document.querySelector(
  ".all_offerings").querySelectorAll(`div[id*="offering-"`).length;

// Global vars for tracking unit and offering section visibility.
let lastVisUnitIdx = -1;
let lastVisOfferIdx = new Array(MAX_NUM_UNITS).fill(-1);

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

// Makes a collapsible div visible (expanded).
function expandCollapsible(content, button) {
  content.removeAttribute("hidden");
  button.textContent = "Collapse";
}

// Makes a collapsible div hidden (collapsed)
function collapseCollapsible(content, button) {
  content.setAttribute("hidden", "hidden");
  button.textContent = "Expand";
}

// Toggles the collapsed state of this unit or rent offering.
function toggleCollapsible() {
  let contentDiv = this.parentNode.parentNode.parentNode.querySelector(
    ".collapsible_content");
  if (contentDiv.hasAttribute("hidden")) {
    expandCollapsible(contentDiv, this);
  } else {
    collapseCollapsible(contentDiv, this);
  }
}

function handleUserNameKeydown(e) {
  // Allow the user to re-commit their name even if they don't make any changes 
  // to it.
  if (e.code === "Enter") {
    let inputUserName = document.getElementById("user-name-input");
    inputUserName.dispatchEvent(new Event("change"));
  }
}

// Updates the main header of the page to match the value of the element
// receiving the event.
function updatePageTitle() {
  document.getElementById("apt-name-header").textContent = this.value;
}

// Updates the href attribute of any links with class 'property-link' to
// be the value of the element receiving the event.
function updatePropertyLink() {
  let links = document.querySelectorAll(".property-link");
  let iframe = document.getElementsByTagName("iframe")[0];
  // If the URL does not start with https:// or http://,
  // assume https:// and prepend it to the user's input.
  if (this.value.search(/https?:\/\//) != 0) {
    this.setAttribute("value", `https://${this.value}`);
  }
  for (let link of links) {
    link.setAttribute("href", this.value);
  }
  // Any http link is guaranteed to fail to display in the iframe because
  // the UEO site is served over https. Set the iframe src to have an 
  // unspecified protocol to optimisitically request the https version
  // if there is one (without changing the stored property URL value).
  iframe.src = this.value.replace(/https?:/, "");
}

// Shows the second address field.
function updateSecondAddressVisibility() {
  document.getElementById("second-address").removeAttribute("hidden");
  document.getElementById("show-second-address").setAttribute("hidden",
    "hidden");
}

// Updates the heading for this unit to match the unit type selected.
function updateUnitHeading() {
  let heading = this.parentNode.parentNode.querySelector(".section_title");
  let unitTypeStr = "";
  if (this.value) {
    unitTypeStr = `: ${this.value}`;
  } 
  heading.textContent = `Unit Type${unitTypeStr}`;
}

// Updates the heading for this rent offering to include the AMI % category.
function updateOfferingHeading() {
  let heading = this.parentNode.parentNode.querySelector(".section_title");
  let offeringStr = "";
  if (this.value) {
    offeringStr = `: ${this.value}% AMI`;
  } 
  heading.textContent = `Rent Offering${offeringStr}`;
}

function updateSelectColor() {
  let options = this.childNodes;
  for (let option of options) {
    if (option.selected) {
      let color = option.dataset.color;
      if (color) {
        this.style.backgroundColor = `var(--airtable-color-${color})`;
      } else {
        this.style.backgroundColor = "";
      }
      break;
    }
  }
}

function updateMultiselectColors() {
  let options = this.querySelectorAll("input[type=checkbox]");
  for (let option of options) {
    let label = option.nextSibling.nextSibling;
    label.style.backgroundColor = "";
    if (option.checked) {
      let color = option.dataset.color;
      if (color) {
        label.style.backgroundColor = `var(--airtable-color-${color})`;
      } 
    }
  }
}

// Shows min and max age fields when required and hides them otherwise.
function updateAgeVisibility() {
  let seniorsOption = document.getElementById(`${POPULATIONS_SERVED_FIELD_ID}:seniors`);
  let youthOption = document.getElementById(`${POPULATIONS_SERVED_FIELD_ID}:youth`);
  let minAge = document.getElementById("min-age");
  let maxAge = document.getElementById("max-age");
  if (youthOption.checked) {
    minAge.removeAttribute("hidden");
    maxAge.removeAttribute("hidden");
  } else if (seniorsOption.checked) {
    minAge.removeAttribute("hidden");
    maxAge.setAttribute("hidden", "hidden");
    clearAllFieldsIn(maxAge);
  } else {
    minAge.setAttribute("hidden", "hidden");
    maxAge.setAttribute("hidden", "hidden");
    clearAllFieldsIn(minAge);
    clearAllFieldsIn(maxAge);
  }
}

// Shows or hides maximum income table rows depending on the values
// of min and max occupancy for the unit.
function updateMaxIncomeRowsVisibility() {
  let unitContainer = this.parentNode;
  let offeringContainers = unitContainer.querySelectorAll("fieldset");
  let minOccupancyField = unitContainer.querySelector("[name*=MIN_OCCUPANCY]");
  let maxOccupancyField = unitContainer.querySelector("[name*=MAX_OCCUPANCY]");
  let minHhSize = parseInt(minOccupancyField.value || 0);
  let maxHhSize = parseInt(maxOccupancyField.value || Number.MAX_SAFE_INT);
  for (let i = 0; i < offeringContainers.length; i++) {
    let rows = offeringContainers[i].querySelectorAll(".max_income tr");
    // Skip the header row, start j at 1.
    for (let j = 1; j < rows.length; j++) {
      if (j < minHhSize || j > maxHhSize) {
        rows[j].setAttribute("hidden", "hidden");
        // Also clear contents when hiding rows so that hidden row data
        // doesn't get accidentally transmitted on form submit.
        rows[j].querySelector("input").setAttribute("value", "");
      } else {
        rows[j].removeAttribute("hidden");
      }
    }
  }
}

// Shows the primary or alternate rent input fields based on the state of the
// checkbox that got this event.
function updateRentVisibility() {
  let offering = this.parentNode;
  let rentInput = offering.querySelector(".rent_value");
  let rentAlternateInput = offering.querySelector(".rent_alternate");
  if (this.checked) {
    rentInput.setAttribute("hidden", "hidden");
    clearAllFieldsIn(rentInput);
    rentAlternateInput.removeAttribute("hidden");
  } else {
    rentInput.removeAttribute("hidden");
    rentAlternateInput.setAttribute("hidden", "hidden");
    clearAllFieldsIn(rentAlternateInput);
  }
}

// Shows the primary or alternate minimum income input fields based on the state
// of the checkbox that got this event.
function updateMinIncomeVisibility() {
  let unit = this.parentNode;
  let minIncomeInput = unit.querySelector(".min_income");
  let minIncomeAlternateInputs = unit.querySelectorAll(".min_income_alternate");
  if (this.checked) {
    minIncomeInput.setAttribute("hidden", "hidden");
    clearAllFieldsIn(minIncomeInput);
    for (let alternateInput of minIncomeAlternateInputs) {
      alternateInput.removeAttribute("hidden");
    }
  } else {
    minIncomeInput.removeAttribute("hidden");
    for (let alternateInput of minIncomeAlternateInputs) {
      alternateInput.setAttribute("hidden", "hidden");
      clearAllFieldsIn(alternateInput);
    }
  }
}

// Shows the primary or alternate maximum income input fields based on the state
// of the checkbox that got this event.
function updateMaxIncomeVisibility() {
  let offering = this.parentNode;
  let maxIncomeInput = offering.querySelector("table.max_income");
  let maxIncomeAlternateInput = offering.querySelector(".max_income_alternate");
  if (this.checked) {
    maxIncomeInput.setAttribute("hidden", "hidden");
    clearAllFieldsIn(maxIncomeInput);
    maxIncomeAlternateInput.removeAttribute("hidden");
  } else {
    maxIncomeInput.removeAttribute("hidden");
    maxIncomeAlternateInput.setAttribute("hidden", "hidden");
    clearAllFieldsIn(maxIncomeAlternateInput);
  }
}

// Shows an additional set of unit input fields.
// When a new unit is "added", the unit section that is immediately after
// the last currently-visible unit section in the DOM is made visible. 
function addUnit() {
  if (lastVisUnitIdx < MAX_NUM_UNITS - 1) {
    lastVisUnitIdx++;
    let newUnit = document.querySelectorAll(
      `#all-units > div[id^="unit-"]`)[lastVisUnitIdx];
    // Show the unit section corresponding to the updated lastVisUnitIdx.
    newUnit.removeAttribute("hidden");
    // TODO: Default the unit section to the expanded state.
    if (lastVisUnitIdx == MAX_NUM_UNITS - 1) {
      // Signal to the user more units can't be added.
      document.getElementById("add-unit").setAttribute("disabled", "disabled");
    }
  } 
}

// Hides a set of unit input fields and clears their contents.
// When a unit is "deleted", it is hidden and also moved to the end of
// the list of units in the DOM.  This way, the visible units are always
// adjacent and units are always "added" right after the visible ones (see 
// addUnit() ).
function deleteUnit() {
  if (lastVisUnitIdx >= 0) {
    lastVisUnitIdx--;
    // The unit being deleted is the one assocated with the specific
    // delete button that got this event.
    let deletedUnit = this.parentNode.parentNode.parentNode.parentNode;
    // Hide the unit section being deleted.
    deletedUnit.setAttribute("hidden", "hidden");
    let deletedUnitId = deletedUnit.id.split("-")[1];
    let unitsContainer = document.getElementById("all-units");
    // Add the unit to the DOM again, causing it to be removed from its
    // original position and get appended to the end of the set of all 
    // units.  Note this means the unit ids (e.g. "unit-0", "unit-1") will
    // not always be in order in the DOM, as the order depends on add/delete
    // history.
    unitsContainer.appendChild(deletedUnit);
    // Ensure all the fields in the deleted unit are cleared to avoid
    // accidentally transmitting data in hidden fields upon submit.
    clearAllFieldsIn(deletedUnit);
    // Reset the visibility of all offerings within this deleted unit.
    let offerings = deletedUnit.querySelectorAll(".all-offerings > div")
    for (let offering of offerings) {
      offering.setAttribute("hidden", "hidden");
    }
    lastVisOfferIdx[deletedUnitId] = -1;
    if (lastVisUnitIdx < MAX_NUM_UNITS - 1) {
      // Re-enable the add unit button since we are no longer at max
      // unit capacity.
      document.getElementById("add-unit").removeAttribute("disabled");
    }
  }
}

// Shows an additional set of rent offering input fields.
// When a new rent offering is "added", the rent offering section that is 
// immediately after the last currently-visible offering section in the DOM is 
// made visible. 
function addOffering() {
  let unitDiv = this.parentNode.parentNode.parentNode;
  let unitId = unitDiv.id.split("-")[1];
  if (lastVisOfferIdx[unitId] < MAX_NUM_OFFERINGS - 1) {
    lastVisOfferIdx[unitId]++;
    let newOffering = unitDiv.querySelectorAll(
      ".all_offerings > div")[lastVisOfferIdx[unitId]];
    // Show the offering section corresponding to the updated lastVisOfferIdx.
    newOffering.removeAttribute("hidden");
    // TODO: Default to the expanded state.
    if (lastVisOfferIdx[unitId] == MAX_NUM_OFFERINGS - 1) {
      // Signal to the user more rent offeirngs can't be added.
      unitDiv.querySelector(".add_offering").setAttribute("disabled",
        "disabled");
    }
  }
}

// Hides a set of rent offering input fields and clears their contents.
// When a rent offering is "deleted", it is hidden and also moved to the end of
// the list of rent offerings in the DOM.  This way, the visible units are
// always adjacent and offerings are always "added" right after the visible ones
// (see addOffering() ).
function deleteOffering() {
  // The rent offering being deleted is the one assocated with the specific
  // delete button that got this event.
  let deletedOffering = this.parentNode.parentNode.parentNode.parentNode;
  let unitDiv = deletedOffering.parentNode.parentNode.parentNode.parentNode;
  let unitId = unitDiv.id.split("-")[1];
  if (lastVisOfferIdx[unitId] >= 0) {
    lastVisOfferIdx[unitId]--;
    // Hide the offering section being deleted.
    deletedOffering.setAttribute("hidden", "hidden");
    let offeringsContainer = unitDiv.querySelector(".all_offerings");
    // Add the offering to the DOM again, causing it to be removed from its
    // original position and get appended to the end of the set of all 
    // units.  Note this means the offering ids 
    // (e.g. "offering-0", "offering-1") will not always be in order in the DOM,
    // as the order depends on add/delete history.
    offeringsContainer.appendChild(deletedOffering);
    // Ensure all the fields in the deleted unit are cleared to avoid
    // accidentally transmitting data in hidden fields upon submit.
    clearAllFieldsIn(deletedOffering);
    if (lastVisOfferIdx[unitId] < MAX_NUM_OFFERINGS - 1) {
      // Re-enable the add offering button since we are no longer at max
      // offering capacity.
      unitDiv.querySelector(".add_offering").removeAttribute("disabled");
    }
  }
}

// Clears any input values from all the form inputs within `node`.
// Selects will have the first (presumed blank) option selected.
// Checkboxes will be unchecked.
// Textareas and input element values will be an empty string.
function clearAllFieldsIn(node) {
  let allInputs = node.querySelectorAll("input, textarea, select");
  for (let input of allInputs) {
    if (input.tagName == "TEXTAREA") {
      input.textContent = "";
    } else if (input.tagName == "SELECT") {
      let options = input.childNodes;
      for (let option of options) {
        option.removeAttribute("selected");
      }
      input.firstChild.setAttribute("selected", "selected");
      input.setAttribute("value", "");
    } else if (input.tagName == "INPUT") {
      if (input.type == "checkbox") {
        input.removeAttribute("checked");
      } else {
        input.setAttribute("value", "");
      }
    }
    // Input values have changed, so run any change handlers.
    input.dispatchEvent(new Event("change"));
  }
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
    for (let option of field.childNodes) {
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
// If the property has data populated in any of the 'fields', returns true.
// Paramter 'fields' is an array of form field names corresponding to Airtable
// fields in the Units table. Parameter 'units' is the units portion of 
// the data returned by fetchFormPrefillData().
function hasUnitsDataIn(fields, units) {
  let hasData = false;
  for (let field of fields) {
    let [fieldName, unitIdx, offerIdx] = field.split(":");
    if (offerIdx === undefined) {
      offerIdx = 0;
    }
    if (unitIdx < units.length && offerIdx < units[unitIdx].length) {
      let value = units[unitIdx][offerIdx].fields[fieldName];
      if (value) {
        hasData = true;
        break;
      }
    }
  }
  return hasData;
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
  let formConditionals = unitsSection.querySelectorAll(".form_conditional");
  // Fill all property-level fields.
  for (let field of propertyFields) {
    let value = data.housing.fields[field.name];
    prefillField(field, value);
  }
  // Fill all unit-level fields.
  for (let field of unitsFields) {
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
  // Special handling for these form conditionals, which are form inputs
  // that do not map directly to Airtable fields.  Instead, they provide
  // form-level interactivity only. They do get pre-filled based on other
  // Airtable fields, howerver. 
  for (let field of formConditionals) {
    if (!field.dataset.primaryField || !field.dataset.alternateField) {
      continue;
    }
    let primaryFields = field.dataset.primaryField.split(",");
    let alternateFields = field.dataset.alternateField.split(",");
    // Check if any of the primary fields associated with this form
    // conditional have data.
    let primaryFieldUsed = hasUnitsDataIn(primaryFields, data.units);
    // Check if any of the alternate fields associated with this form
    // conditional have data.
    let alternateFieldUsed = hasUnitsDataIn(alternateFields, data.units);
    
    // Truth table
    // conflict resolution | primary used | alternate used | checked
    // -------------------------------------------------------------
    //      primary               T               F             F
    //      primary               F               F             F
    //      primary               F               T             T
    //      primary               T               T             F
    // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //     alternate              T               F             F
    //     alternate              F               F             F
    //     alternate              F               T             T
    //     alternate              T               T             T
    let conflictResolution = field.dataset.conflictResolution;
    field.checked = (
      alternateFieldUsed &&
      (!primaryFieldUsed ||
       (primaryFieldUsed && conflictResolution == "alternate")
      ));
    field.dispatchEvent(new Event("change"))
  }
}

function displayQueue(queue) {
  let doneVal = document.getElementById("queue-done-val");
  let inProgressVal = document.getElementById("queue-in-progress-val");
  let todoVal = document.getElementById("queue-to-do-val");
  let doneBar = document.getElementById("queue-done-bar");
  let inProgressBar = document.getElementById("queue-in-progress-bar");
  let todoBar = document.getElementById("queue-to-do-bar");
  if (queue.numTotal > 0) {
    doneBar.style.width = `${100 * queue.numCompleted / queue.numTotal}%`;
    inProgressBar.style.width = `${
      100 * queue.numInProgress / queue.numTotal}%`;
    todoBar.style.width = `${100 * queue.numTodo / queue.numTotal}%`;
  }
  doneVal.textContent = queue.numCompleted;
  inProgressVal.textContent = queue.numInProgress;
  todoVal.textContent = queue.numTodo;
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
  for (let unitRecord of data.units) {
    let typeKey = unitRecord.fields["TYPE"];
    tempMap[typeKey] = tempMap[typeKey] || [];
    tempMap[typeKey].push(unitRecord);
  }
  for (let unitType of Object.keys(tempMap)) {
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
  for (let button of submitButtons) {
    button.addEventListener("click", submitForm);
  }

  // User name
  document.getElementById("edit-user-name").addEventListener("click",
    editUserName);
  let userNameInput = document.getElementById("user-name-input");
  userNameInput.addEventListener("change", setUserName);
  userNameInput.addEventListener("focusout", setUserName);
  userNameInput.addEventListener("keydown", handleUserNameKeydown);

  // Form interactions
  document.getElementById("show-second-address").addEventListener("click",
    updateSecondAddressVisibility);
  for (let button of document.querySelectorAll("button.collapse_control")) {
    button.addEventListener("click", toggleCollapsible);
  }
  document.getElementById("add-unit").addEventListener("click", addUnit);
  for (let button of document.querySelectorAll("button.delete_unit")) {
    button.addEventListener("click", deleteUnit);
  }
  for (let button of document.querySelectorAll("button.add_offering")) {
    button.addEventListener("click", addOffering);
  }
  for (let button of document.querySelectorAll("button.delete_offering")) {
    button.addEventListener("click", deleteOffering);
  }
  for (let checkbox of document.querySelectorAll(".is_alternate_rent")) {
    checkbox.addEventListener("change", updateRentVisibility);
  }
  for (let checkbox of document.querySelectorAll(".is_alternate_min_income")) {
    checkbox.addEventListener("change", updateMinIncomeVisibility);
  }
  for (let checkbox of document.querySelectorAll(".is_alternate_max_income")) {
    checkbox.addEventListener("change", updateMaxIncomeVisibility);
  }

  // Form inputs
  document.getElementById(APT_NAME_FIELD_ID).addEventListener("change",
    updatePageTitle);
  document.getElementById(PROPERTY_URL_FIELD_ID).addEventListener("change",
    updatePropertyLink);
  document.getElementById(`${POPULATIONS_SERVED_FIELD_ID}:seniors`)
    .addEventListener("change", updateAgeVisibility);
  document.getElementById(`${POPULATIONS_SERVED_FIELD_ID}:youth`)
    .addEventListener("change", updateAgeVisibility);
  for (let occupancy of document.querySelectorAll("[name*=OCCUPANCY]")) {
    occupancy.addEventListener("change", updateMaxIncomeRowsVisibility);
  }
  for (let type of document.querySelectorAll(`[id*=${UNIT_TYPE_FIELD_ID}]`)) {
    type.addEventListener("change", updateUnitHeading);
  }
  for (let ami of document.querySelectorAll(`[id*=${AMI_PERCENT_FIELD_ID}]`)) {
    ami.addEventListener("change", updateOfferingHeading);
  }
  let coloredSelects = document.querySelectorAll(
    `[id*=${UNIT_TYPE_FIELD_ID}], [id*=${UNIT_STATUS_FIELD_ID}]`);
  for (let select of coloredSelects) {
    select.addEventListener("change", updateSelectColor);
  }
  for (multiselect of document.querySelectorAll(".multiselect")) {
    multiselect.addEventListener("change", updateMultiselectColors);
  }
}

// Shows only enough units and offerings to fit the unit records in 'data'.
// The 'data' passed in typically comes from Airtable via
// fetchFormPrefillData().
function initUnitVisibility(data) {
  let numUsedUnits = data.units.length;
  // Initialize state vars for adding/deleting units and offerings.
  lastVisUnitIdx = numUsedUnits - 1;
  for (let i = 0; i < numUsedUnits; i++) {
    lastVisOfferIdx[i] = data.units[i].length - 1;
  }
  // Set visibility according to the number of units records in 
  // the passed data.
  let unitDivs = document.querySelectorAll("#all-units > div");
  for (let i = 0; i < unitDivs.length; i++) {
    if (i < numUsedUnits) {
      // Show the appropriate number of units.
      unitDivs[i].removeAttribute("hidden");
      let numUsedOfferings = data.units[i].length;
      let offeringDivs = unitDivs[i].querySelectorAll(".all_offerings > div");
      for (let j = 0; j < offeringDivs.length; j++) {
        if (j < numUsedOfferings) {
          // Show the appropriate number of rent offerings in each unit.
          offeringDivs[j].removeAttribute("hidden");
        } else {
          offeringDivs[j].setAttribute("hidden", "hidden");
        }
      }
    } else {
      unitDivs[i].setAttribute("hidden", "hidden");
    }
  }
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
  displayQueue(data.queue);
  // A campaign is required for nearly all aspects of the page.
  if (params.campaign) {
    let safeCampaign = encodeURIComponent(params.campaign);
    let campaignPath = (
      `/contrib/affordable-housing/campaigns/${safeCampaign}`);
    document.getElementById("skip-property").setAttribute("href",
      campaignPath);
    document.getElementById("housing-changes").setAttribute("action",
      `/contrib/affordable-housing/thank-you?campaign=${safeCampaign}`);
    if (data.housing) {
      initUnitVisibility(data);
      prefillForm(data);
    } else if (params.housingId) {
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
