/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

function setYesNo(id, value) {
  if (value === true) {
    document.getElementById(`${id}-yes`).checked = true;
    document.getElementById(`${id}-no`).checked = false;
  } else if (value == false) {
    document.getElementById(`${id}-yes`).checked = true;
    document.getElementById(`${id}-no`).checked = false;
  } else {
    document.getElementById(`${id}-yes`).checked = false;
    document.getElementById(`${id}-no`).checked = false;
  }
}

function addHouseholdMember() {
  const button = document.querySelector(
    '#page-household-members .field_list_add');
  button.click();
}

function addDutyPeriod() {
  const button = document.querySelector(
    '#page-veteran-details .field_list_add');
  button.click();
}


let eligScript;
let html;
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
  // This is a bit of a hack to run the eligibility script in the loaded
  // HTML document.  Loading the file as an external <script> as is done
  // in production has proven to be difficult because:
  //   1) We don't necessarily want to use runScripts: "dangerously" as
  //      there may be third-party external scripts included in the HTML,
  //      particularly from the base.liquid layout.
  //   2) The src of the <script> needs to be different for production
  //      and testing, as root-relative URLS (src="/js/eligibility.js")
  //      don't seem to work with JSDOM.
  // There may be a way to set up a test with a node server running and
  // create a JSDOM object from the url of that server.  We'd still have to
  // make a custom JSDOM Resource Loader to avoid loading anything *except*
  // the script we care about: eligibility.js
  eligScript = fs.readFileSync(
    path.resolve(__dirname, '../eligibility.js'), 'utf8');
  html = fs.readFileSync(
    path.resolve(__dirname, '../../../../../test/dist/public-assistance/eligibility/index.html'), 'utf8');
});

beforeEach(() => {
  document.body.parentElement.innerHTML = html;
  window.eval(eligScript);
  // Note we have to call init() within an eval(), otherwise init() will
  // run in the Node environment rather than the JSDOM environment, and things
  // like DocumentFragment (and other browser/DOM stuff) will not be defined.
  // The call to init() will not be required by all tests (and none of the tests
  // currently written here), so we may want to move it to a describe.beforeAll
  // window.eval('init()');
});

test('Example', () => {
  window.eval('init()');
  expect(document.querySelectorAll('[id^=hh-member-name]').length).toBe(0);
  const button = document.getElementById('page-household-members')
    .querySelector('.field_list_add');
  button.click();
  expect(document.querySelectorAll('[id^=hh-member-name]').length).toBe(1);
});

// TODO: test out all yes/no/null options.
// TODO: test all singleselect options.
// TODO: test out no income option.
// NOTE: Do we need to test each data item separately?  wrt. existing assistance,
// testing all items at once means we can't detect a problem where a
// checkbox state is stored twice.
test('buildInputObj gets all data from page elements', () => {
  window.eval('init()');
  const dutyPeriodStartStrs = ['1960-01-25', ''];
  const dutyPeriodEndStrs = ['1961-12-31', ''];
  const expected = {
    age: '42',
    citizen: false,
    disabled: true,
    blind: true,
    deaf: true,
    veteran: true,
    pregnant: true,
    feeding: true,
    headOfHousehold: true,
    householdAges: ['20', '41'],
    householdDisabled: [true, false],
    householdPregnant: [true, false],
    householdFeeding: [true, false],
    householdSpouse: [false, true],
    householdDependents: [true, false],
    householdSize: 3,
    unbornChildren: '1',
    housingSituation: 'housed',
    paysUtilities: null,
    hasKitchen: true,
    homelessRisk: null,
    immigrationStatus: 'permanent_resident',
    usesGuideDog: null,
    militaryDisabled: null,
    dischargeStatus: 'honorable',
    servedFullDuration: true,
    dutyPeriods: [
      {
        end: new Date(`${dutyPeriodEndStrs[0]}T00:00`),
        start: new Date(`${dutyPeriodStartStrs[0]}T00:00`),
        type: 'active-duty',
      },
      {
        end: NaN,
        start: NaN,
        type: 'guard-duty',
      },
    ],
    income: {
      valid: false,
      wages: [[], [], []],
      selfEmployed: [[], [], []],
      disability: [[], [], []],
      unemployment: [[], [], []],
      retirement: [[], [], []],
      veterans: [[], [], []],
      workersComp: [[], [], []],
      childSupport: [[], [], []],
      other: [[], [], []],
    },
    assets: [[], [], []],
    ssiIncome: [],
    existingCalfreshHousehold: true,
    existingCalfreshMe: true,
    existingCalworksHousehold: true,
    existingCalworksMe: true,
    existingCapiHousehold: true,
    existingCapiMe: true,
    existingCfapHousehold: true,
    existingCfapMe: true,
    existingGaHousehold: true,
    existingGaMe: true,
    existingIhssHousehold: true,
    existingIhssMe: true,
    existingLiheapHousehold: true,
    existingLiheapMe: true,
    existingMedicalHousehold: true,
    existingMedicalMe: true,
    existingNslpHousehold: true,
    existingNslpMe: true,
    existingSsdiHousehold: true,
    existingSsdiMe: true,
    existingSsiHousehold: true,
    existingSsiMe: true,
    existingVaPensionHousehold: true,
    existingVaPensionMe: true,
    existingWicHousehold: true,
    existingWicMe: true,
  };
  document.getElementById('age').value = expected.age;
  document.getElementById('not-citizen').checked = !expected.citizen;
  document.getElementById('disabled').checked = expected.disabled;
  document.getElementById('blind').checked = expected.blind;
  document.getElementById('deaf').checked = expected.deaf;
  document.getElementById('veteran').checked = expected.veteran;
  document.getElementById('pregnant').checked = expected.pregnant;
  document.getElementById('feeding').checked = expected.feeding;
  setYesNo('head-household', expected.headOfHousehold);
  addHouseholdMember();
  addHouseholdMember();
  document.getElementById('hh-member-age-1').value = expected.householdAges[0];
  document.getElementById('hh-member-age-2').value = expected.householdAges[1];
  document.getElementById('hh-member-disabled-1').checked = expected.householdDisabled[0];
  document.getElementById('hh-member-disabled-2').checked = expected.householdDisabled[1];
  document.getElementById('hh-member-pregnant-1').checked = expected.householdPregnant[0];
  document.getElementById('hh-member-pregnant-2').checked = expected.householdPregnant[1];
  document.getElementById('hh-member-breastfeeding-1').checked = expected.householdFeeding[0];
  document.getElementById('hh-member-breastfeeding-2').checked = expected.householdFeeding[1];
  document.getElementById('hh-member-spouse-1').checked = expected.householdSpouse[0];
  document.getElementById('hh-member-spouse-2').checked = expected.householdSpouse[1];
  document.getElementById('hh-member-dependent-1').checked = expected.householdDependents[0];
  document.getElementById('hh-member-dependent-2').checked = expected.householdDependents[1];
  document.getElementById('unborn-children').value = expected.unbornChildren;
  document.getElementById(expected.housingSituation).checked = true;
  setYesNo('pay-utilities', expected.paysUtilities);
  document.getElementById('has-kitchen-yes').checked = expected.hasKitchen;
  setYesNo('risk-homeless', expected.homelessRisk);
  document.getElementById(expected.immigrationStatus).checked = true;
  setYesNo('use-guide-dog', expected.usesGuideDog);
  setYesNo('dis-military', expected.militaryDisabled);
  document.getElementById('your-discharge-status').value = expected.dischargeStatus;
  document.getElementById('full-dur-yes').checked = expected.servedFullDuration;
  addDutyPeriod();
  document.getElementById('your-duty-type').value = expected.dutyPeriods[0].type;
  document.getElementById('served-from').value = dutyPeriodStartStrs[0];
  document.getElementById('served-until').value = dutyPeriodEndStrs[0];
  document.getElementById('your-duty-type-1').value = expected.dutyPeriods[1].type;
  document.getElementById('served-from-1').value = dutyPeriodStartStrs[1];
  document.getElementById('served-until-1').value = dutyPeriodEndStrs[1];
  document.getElementById('existing-calfresh-household').checked = expected.existingCalfreshHousehold;
  document.getElementById('existing-calfresh-me').checked = expected.existingCalfreshMe;
  document.getElementById('existing-calworks-household').checked = expected.existingCalworksHousehold;
  document.getElementById('existing-calworks-me').checked = expected.existingCalworksMe;
  document.getElementById('existing-capi-household').checked = expected.existingCapiHousehold;
  document.getElementById('existing-capi-me').checked = expected.existingCapiMe;
  document.getElementById('existing-cfap-household').checked = expected.existingCfapHousehold;
  document.getElementById('existing-cfap-me').checked = expected.existingCfapMe;
  document.getElementById('existing-ga-household').checked = expected.existingGaHousehold;
  document.getElementById('existing-ga-me').checked = expected.existingGaMe;
  document.getElementById('existing-ihss-household').checked = expected.existingIhssHousehold;
  document.getElementById('existing-ihss-me').checked = expected.existingIhssMe;
  document.getElementById('existing-liheap-household').checked = expected.existingLiheapHousehold;
  document.getElementById('existing-liheap-me').checked = expected.existingLiheapMe;
  document.getElementById('existing-medical-household').checked = expected.existingMedicalHousehold;
  document.getElementById('existing-medical-me').checked = expected.existingMedicalMe;
  document.getElementById('existing-nslp-household').checked = expected.existingNslpHousehold;
  document.getElementById('existing-nslp-me').checked = expected.existingNslpMe;
  document.getElementById('existing-ssdi-household').checked = expected.existingSsdiHousehold;
  document.getElementById('existing-ssdi-me').checked = expected.existingSsdiMe;
  document.getElementById('existing-ssi-household').checked = expected.existingSsiHousehold;
  document.getElementById('existing-ssi-me').checked = expected.existingSsiMe;
  document.getElementById('existing-va-pension-household').checked = expected.existingVaPensionHousehold;
  document.getElementById('existing-va-pension-me').checked = expected.existingVaPensionMe;
  document.getElementById('existing-wic-household').checked = expected.existingWicHousehold;
  document.getElementById('existing-wic-me').checked = expected.existingWicMe;

  const input = window.eval('buildInputObj()');
  expect(input).toEqual(expected);
});
