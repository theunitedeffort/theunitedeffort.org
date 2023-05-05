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

test('buildInputObj gets all data from page elements', () => {
  window.eval('init()');
  const expected = {
    age: "42",
    citizen: false,
    disabled: true,
    blind: true,
    deaf: true,
    veteran: true,
    pregnant: true,
    feeding: true,
    headOfHousehold: true,
    householdAges: [16, 18],
    householdDisabled: [true, false],
    paysUtilities: null,
  }
  document.getElementById('age').value = expected.age;
  document.getElementById('not-citizen').checked = !expected.citizen;
  document.getElementById('disabled').checked = expected.disabled;
  document.getElementById('blind').checked = expected.blind;
  document.getElementById('deaf').checked = expected.deaf;
  document.getElementById('veteran').checked = expected.veteran;
  document.getElementById('pregnant').checked = expected.pregnant;
  document.getElementById('feeding').checked = expected.feeding;
  setYesNo('head-household', expected.headOfHousehold);
  setYesNo('pay-utilities', expected.paysUtilities);

  const input = window.eval('buildInputObj()');
  expect(input).toEqual(expected);
});
