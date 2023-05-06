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

function getInput() {
  return window.eval('buildInputObj()');
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
  let input;
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

  window.eval('init()');
  document.getElementById('age').value = expected.age;
  expect(getInput().age).toBe(expected.age);

  document.getElementById('not-citizen').checked = !expected.citizen;
  expect(getInput().citizen).toBe(expected.citizen);

  document.getElementById('disabled').checked = expected.disabled;
  expect(getInput().disabled).toBe(expected.disabled);

  document.getElementById('blind').checked = expected.blind;
  expect(getInput().blind).toBe(expected.blind);

  document.getElementById('deaf').checked = expected.deaf;
  expect(getInput().deaf).toBe(expected.deaf);

  document.getElementById('veteran').checked = expected.veteran;
  expect(getInput().veteran).toBe(expected.veteran);

  document.getElementById('pregnant').checked = expected.pregnant;
  expect(getInput().pregnant).toBe(expected.pregnant);

  document.getElementById('feeding').checked = expected.feeding;
  expect(getInput().feeding).toBe(expected.feeding);

  setYesNo('head-household', expected.headOfHousehold);
  expect(getInput().headOfHousehold).toBe(expected.headOfHousehold);

  addHouseholdMember();
  addHouseholdMember();
  document.getElementById('hh-member-age-1').value = expected.householdAges[0];
  document.getElementById('hh-member-age-2').value = expected.householdAges[1];
  expect(getInput().householdAges).toEqual(expected.householdAges);

  document.getElementById('hh-member-disabled-1').checked = expected.householdDisabled[0];
  document.getElementById('hh-member-disabled-2').checked = expected.householdDisabled[1];
  expect(getInput().householdDisabled).toEqual(expected.householdDisabled);

  document.getElementById('hh-member-pregnant-1').checked = expected.householdPregnant[0];
  document.getElementById('hh-member-pregnant-2').checked = expected.householdPregnant[1];
  expect(getInput().householdPregnant).toEqual(expected.householdPregnant);

  document.getElementById('hh-member-breastfeeding-1').checked = expected.householdFeeding[0];
  document.getElementById('hh-member-breastfeeding-2').checked = expected.householdFeeding[1];
  expect(getInput().householdFeeding).toEqual(expected.householdFeeding);

  document.getElementById('hh-member-spouse-1').checked = expected.householdSpouse[0];
  document.getElementById('hh-member-spouse-2').checked = expected.householdSpouse[1];
  expect(getInput().householdSpouse).toEqual(expected.householdSpouse);

  document.getElementById('hh-member-dependent-1').checked = expected.householdDependents[0];
  document.getElementById('hh-member-dependent-2').checked = expected.householdDependents[1];
  expect(getInput().householdDependents).toEqual(expected.householdDependents);

  document.getElementById('unborn-children').value = expected.unbornChildren;
  expect(getInput().unbornChildren).toBe(expected.unbornChildren);

  document.getElementById(expected.housingSituation).checked = true;
  expect(getInput().housingSituation).toBe(expected.housingSituation);

  setYesNo('pay-utilities', expected.paysUtilities);
  expect(getInput().paysUtilities).toBe(expected.paysUtilities);

  document.getElementById('has-kitchen-yes').checked = expected.hasKitchen;
  expect(getInput().hasKitchen).toBe(expected.hasKitchen);

  setYesNo('risk-homeless', expected.homelessRisk);
  expect(getInput().homelessRisk).toBe(expected.homelessRisk);

  document.getElementById(expected.immigrationStatus).checked = true;
  expect(getInput().immigrationStatus).toBe(expected.immigrationStatus);

  setYesNo('use-guide-dog', expected.usesGuideDog);
  expect(getInput().usesGuideDog).toBe(expected.usesGuideDog);

  setYesNo('dis-military', expected.militaryDisabled);
  expect(getInput().militaryDisabled).toBe(expected.militaryDisabled);

  document.getElementById('your-discharge-status').value = expected.dischargeStatus;
  expect(getInput().dischargeStatus).toBe(expected.dischargeStatus);

  document.getElementById('full-dur-yes').checked = expected.servedFullDuration;
  expect(getInput().servedFullDuration).toBe(expected.servedFullDuration);

  addDutyPeriod();
  document.getElementById('your-duty-type').value = expected.dutyPeriods[0].type;
  document.getElementById('served-from').value = dutyPeriodStartStrs[0];
  document.getElementById('served-until').value = dutyPeriodEndStrs[0];
  document.getElementById('your-duty-type-1').value = expected.dutyPeriods[1].type;
  document.getElementById('served-from-1').value = dutyPeriodStartStrs[1];
  document.getElementById('served-until-1').value = dutyPeriodEndStrs[1];
  expect(getInput().dutyPeriods).toEqual(expected.dutyPeriods);

  document.getElementById('existing-calfresh-household').checked = expected.existingCalfreshHousehold;
  expect(getInput().existingCalfreshHousehold).toBe(expected.existingCalfreshHousehold);

  document.getElementById('existing-calfresh-me').checked = expected.existingCalfreshMe;
  expect(getInput().existingCalfreshMe).toBe(expected.existingCalfreshMe);

  document.getElementById('existing-calworks-household').checked = expected.existingCalworksHousehold;
  expect(getInput().existingCalworksHousehold).toBe(expected.existingCalworksHousehold);

  document.getElementById('existing-calworks-me').checked = expected.existingCalworksMe;
  expect(getInput().existingCalworksMe).toBe(expected.existingCalworksMe);

  document.getElementById('existing-capi-household').checked = expected.existingCapiHousehold;
  expect(getInput().existingCapiHousehold).toBe(expected.existingCapiHousehold);

  document.getElementById('existing-capi-me').checked = expected.existingCapiMe;
  expect(getInput().existingCapiMe).toBe(expected.existingCapiMe);

  document.getElementById('existing-cfap-household').checked = expected.existingCfapHousehold;
  expect(getInput().existingCfapHousehold).toBe(expected.existingCfapHousehold);

  document.getElementById('existing-cfap-me').checked = expected.existingCfapMe;
  expect(getInput().existingCfapMe).toBe(expected.existingCfapMe);

  document.getElementById('existing-ga-household').checked = expected.existingGaHousehold;
  expect(getInput().existingGaHousehold).toBe(expected.existingGaHousehold);

  document.getElementById('existing-ga-me').checked = expected.existingGaMe;
  expect(getInput().existingGaMe).toBe(expected.existingGaMe);

  document.getElementById('existing-ihss-household').checked = expected.existingIhssHousehold;
  expect(getInput().existingIhssHousehold).toBe(expected.existingIhssHousehold);

  document.getElementById('existing-ihss-me').checked = expected.existingIhssMe;
  expect(getInput().existingIhssMe).toBe(expected.existingIhssMe);

  document.getElementById('existing-liheap-household').checked = expected.existingLiheapHousehold;
  expect(getInput().existingLiheapHousehold).toBe(expected.existingLiheapHousehold);

  document.getElementById('existing-liheap-me').checked = expected.existingLiheapMe;
  expect(getInput().existingLiheapMe).toBe(expected.existingLiheapMe);

  document.getElementById('existing-medical-household').checked = expected.existingMedicalHousehold;
  expect(getInput().existingMedicalHousehold).toBe(expected.existingMedicalHousehold);

  document.getElementById('existing-medical-me').checked = expected.existingMedicalMe;
  expect(getInput().existingMedicalMe).toBe(expected.existingMedicalMe);

  document.getElementById('existing-nslp-household').checked = expected.existingNslpHousehold;
  expect(getInput().existingNslpHousehold).toBe(expected.existingNslpHousehold);

  document.getElementById('existing-nslp-me').checked = expected.existingNslpMe;
  expect(getInput().existingNslpMe).toBe(expected.existingNslpMe);

  document.getElementById('existing-ssdi-household').checked = expected.existingSsdiHousehold;
  expect(getInput().existingSsdiHousehold).toBe(expected.existingSsdiHousehold);

  document.getElementById('existing-ssdi-me').checked = expected.existingSsdiMe;
  expect(getInput().existingSsdiMe).toBe(expected.existingSsdiMe);

  document.getElementById('existing-ssi-household').checked = expected.existingSsiHousehold;
  expect(getInput().existingSsiHousehold).toBe(expected.existingSsiHousehold);

  document.getElementById('existing-ssi-me').checked = expected.existingSsiMe;
  expect(getInput().existingSsiMe).toBe(expected.existingSsiMe);

  document.getElementById('existing-va-pension-household').checked = expected.existingVaPensionHousehold;
  expect(getInput().existingVaPensionHousehold).toBe(expected.existingVaPensionHousehold);

  document.getElementById('existing-va-pension-me').checked = expected.existingVaPensionMe;
  expect(getInput().existingVaPensionMe).toBe(expected.existingVaPensionMe);

  document.getElementById('existing-wic-household').checked = expected.existingWicHousehold;
  expect(getInput().existingWicHousehold).toBe(expected.existingWicHousehold);

  document.getElementById('existing-wic-me').checked = expected.existingWicMe;
  expect(getInput().existingWicMe).toBe(expected.existingWicMe);

  expect(getInput()).toEqual(expected);
});
