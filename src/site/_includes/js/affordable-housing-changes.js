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
	let content = `There is no property with the ID \
	  <span class="bold">${housingId}</span> in our database.  Check your URL \
	  and try again or see the <a href="${campaignPath}">next property</a> that \
	  needs to be checked.`;
	setTerminalMessage(header, content);
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

// Fetches all data required to prefill the input form fields.
async function fetchFormPrefillData(params) {
	let fetchPath = encodeURI(
		`/contrib/affordable-housing/next-property/${params.campaign}`);
	if (params.housingId) {
    fetchPath += `/${params.housingId}`;
	}
	// TODO: Error handling.
  let response = await fetch(fetchPath);
  let data = await response.json();
  console.log(data);
  return data;
}

function addListeners() {
	let submitButtons = document.querySelectorAll("[id^=submit-button]");
  for (button of submitButtons) {
    button.addEventListener("click", submitForm);
  }
}

// Prepares the page for display to the user.
function initPage(data, params) {
  if(data.housing) {
    if (data.queue.thisItem.recordId) {
      let queueRecordId = data.queue.thisItem.recordId;
      document.getElementById("queue-record-id").setAttribute("value",
        queueRecordId);
    }
	} else if (params.housingId) {
		let campaignPath = (
			`/contrib/affordable-housing/campaigns/${params.campaign}`);
	  setInvalidHousingIdMessage(params.housingId, campaignPath)
	} else {
	  setEmptyQueueMessage(data.queue);
	}
}

// Script entry point.
async function run() {
	addListeners();
	let params = getPathParams();
	if (params.campaign) {
	  document.getElementById("campaign").setAttribute("value", params.campaign);
	  let safeCampaign = encodeURIComponent(params.campaign);
	  document.getElementById("housing-changes").setAttribute("action",
	   `/contrib/affordable-housing/thank-you?campaign=${safeCampaign}`);
		let data = await fetchFormPrefillData(params);
		initPage(data, params);
	}
}
