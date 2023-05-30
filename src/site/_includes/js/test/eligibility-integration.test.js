/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */

const elig = require('../eligibility');

const fs = require('fs');
const path = require('path');

function timeout(startMs, timeoutMs=1000) {
  if (new Date().getTime() - startMs > timeoutMs) {
    throw new Error(`Timed out after ${timeoutMs}ms`);
  }
  return false;
}

function visiblePage() {
  const visiblePages = document.querySelectorAll('.elig_page:not(.hidden)');
  expect(visiblePages.length).toBe(1);
  return visiblePages[0];
}

function visibleSection() {
  const visibleSections = document.querySelectorAll('.elig_section:not(.hidden)');
  expect(visibleSections.length).toBe(1);
  return visibleSections[0];
}

function expectVisibility(id, isVisible) {
  let expct = expect(document.getElementById(id).className);
  if (isVisible) {
    expct = expct.not;
  }
  expct.toContain('hidden');
}

function getSteps() {
  return document.querySelectorAll('.step_indicator button');
}

function getIncomePages() {
  return document.querySelectorAll('[id^="page-income-"');
}

function getIncomeLists(parent) {
  return parent.querySelectorAll(
    '.income_details_wrapper ul.dynamic_field_list');
}

function expectStepsDone(stepIndicatorIds) {
  const steps = getSteps();
  const allStepIds = Array.from(steps, (s) => s.id);
  if (stepIndicatorIds) {
    expect(allStepIds).toEqual(expect.arrayContaining(stepIndicatorIds));
  }
  for (const step of steps) {
    // Steps can be either 'todo' or 'done'
    let expected = 'todo';
    if (stepIndicatorIds.includes(step.id)) {
      expected = 'done';
    }
    expect(step.classList, `Step indicator "${step.textContent}"`)
      .toContain(expected);
  }
}

function expectStepInProgress(stepIndicatorId) {
  const steps = getSteps();
  const allStepIds = Array.from(steps, (s) => s.id);
  if (stepIndicatorId) {
    expect(allStepIds).toContain(stepIndicatorId);
  }
  for (const step of steps) {
    let expct = expect(step.classList, `Step indicator "${step.textContent}"`);
    if (step.id != stepIndicatorId) {
      expct = expct.not;
    }
    expct.toContain('in_progress');
  }
}

function expectStepsDisabled(stepIndicatorIds) {
  const steps = getSteps();
  const allStepIds = Array.from(steps, (s) => s.id);
  if (stepIndicatorIds) {
    expect(allStepIds).toEqual(expect.arrayContaining(stepIndicatorIds));
  }
  for (const step of steps) {
    let expected = false;
    if (stepIndicatorIds.includes(step.id)) {
      expected = true;
    }
    expect(step.disabled, `Step indicator "${step.textContent}"`)
      .toBe(expected);
  }
}

function expectNumIncomeListsToBe(expected) {
  for (const incomePage of getIncomePages()) {
    expect(getIncomeLists(incomePage).length).toBe(expected);
  }
}

function setYesNo(id, value) {
  if (value === true) {
    document.getElementById(`${id}-yes`).checked = true;
    document.getElementById(`${id}-no`).checked = false;
  } else if (value == false) {
    document.getElementById(`${id}-yes`).checked = false;
    document.getElementById(`${id}-no`).checked = true;
  } else {
    document.getElementById(`${id}-yes`).checked = false;
    document.getElementById(`${id}-no`).checked = false;
  }
}

// Clicks on an element, but _only_ if it's visible to the user.
function click(elem, times=1) {
  check(elem).isVisible();
  for (let i = 0; i < times; i+=1) {
    elem.click();
  }
}

// Selects an option from a select element, but _only_ if it's visible to the
// user and such an option exists.
function select(elem, option) {
  expect(elem.querySelector(`[value="${option}"]`),
    `No such option "${option}" for id "${elem.id}"`).not.toBe(null);
  enterText(elem, option);
}

// Enters text into an element, but _only_ if it's visible to the user.
function enterText(elem, text) {
  check(elem).isVisible();
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(elem.tagName)) {
    elem.value = text.toString();
    const changeEvent = new Event('change');
    const inputEvent = new Event('input');
    elem.dispatchEvent(inputEvent);
    elem.dispatchEvent(changeEvent);
  } else {
    throw new Error(`Can not type input on a ${elem.type} element`);
  }
}

function addHouseholdMember() {
  const button = document.querySelector(
    '#page-household-members .field_list_add');
  click(button);
}

function addDutyPeriod() {
  const button = document.querySelector(
    '#page-veteran-details .field_list_add');
  click(button);
}

function removeHouseholdMemberAt(idx) {
  const buttons = document.querySelectorAll(
    '#page-household-members ul.dynamic_field_list > li button');
  click(buttons[idx - 1]);
}

function removeDutyPeriodAt(idx) {
  const buttons = document.querySelectorAll(
    '#page-veteran-details ul.dynamic_field_list > li button');
  click(buttons[idx - 1]);
}

function addMoney(pageIdPrefix, type, valueArr) {
  const buttons = document.querySelectorAll(
    `#${pageIdPrefix}${type} .field_list_add`);
  for (let memberIdx = 0; memberIdx < valueArr.length; memberIdx++) {
    for (let entryIdx = 0; entryIdx < valueArr[memberIdx].length; entryIdx++) {
      let memberId = '';
      if (memberIdx > 0) {
        memberId = `-member${memberIdx}`;
      }
      const fieldId = `income-${type}${memberId}-${entryIdx}`;
      buttons[memberIdx].click();
      document.getElementById(fieldId).value = valueArr[memberIdx][entryIdx];
    }
  }
}

function addIncome(type, valueArr) {
  addMoney('page-income-details-', type, valueArr);
}

function addAssets(valueArr) {
  addMoney('page-income-', 'assets', valueArr);
}

function getInput() {
  return elig.buildInputObj();
}


function check(idOrElem) {
  return {
    idOrElem,
    isVisible: function() {
      let elem = this.idOrElem;
      if (typeof this.idOrElem === 'string') {
        elem = document.getElementById(this.idOrElem);
      }
      expect(elem.className,
        `"${this.idOrElem}" is not visible`).not.toContain('hidden');
      while (elem.parentElement) {
        elem = elem.parentElement;
        expect(elem.className,
          `Ancestor of "${this.idOrElem}" is not visible ("${elem.id}")`)
          .not.toContain('hidden');
      }
    },
    isHidden: function() {
      let elem = this.idOrElem;
      if (typeof this.idOrElem === 'string') {
        elem = document.getElementById(this.idOrElem);
      }
      const elems = [elem];
      while (elem.parentElement) {
        elem = elem.parentElement;
        elems.push(elem);
      }
      const hiddens = elems.map((e) => e.classList.contains('hidden'));
      expect(hiddens, `"${this.idOrElem}", nor any ancestor is hidden`)
        .toContain(true);
    },
  };
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

describe('Navigation and UI', () => {
  let nextButton;
  let backButton;
  let submitButton;
  const pageTestCases = [
    {
      sectionId: 'section-intro',
      backVisible: false,
      nextVisible: true,
      submitVisible: false,
      disabledSteps: [
        'nav-section-yourself',
        'nav-section-household',
        'nav-section-income',
        'nav-section-existing-benefits',
        'nav-section-results',
      ],
      inProgressStep: null,
      doneSteps: [],
      pages: [
        {
          pageId: 'page-intro',
        },
      ],
    },
    {
      sectionId: 'section-yourself',
      backVisible: true,
      nextVisible: true,
      submitVisible: false,
      disabledSteps: [
        'nav-section-household',
        'nav-section-income',
        'nav-section-existing-benefits',
        'nav-section-results',
      ],
      inProgressStep: 'nav-section-yourself',
      doneSteps: [],
      pages: [
        {
          pageId: 'page-yourself-start',
          setUp: function() {
            click(nextButton);
          },
        },
        {
          pageId: 'page-head-of-household',
          setUp: function() {
            click(nextButton);
            document.getElementById('age').value = elig.cnst.calworks.MAX_CHILD_AGE;
            click(nextButton);
          },
        },
        {
          pageId: 'page-disability-details',
          setUp: function() {
            click(nextButton);
            document.getElementById('disabled').checked = true;
            click(nextButton);
          },
          otherChecks: function() {
            // Veteran disability question shows up when needed
            check('military-disability-wrapper').isHidden();
            click(backButton);
            document.getElementById('veteran').checked = true;
            click(nextButton);
            check('military-disability-wrapper').isVisible();
          },
        },
        {
          pageId: 'page-veteran-details',
          setUp: function() {
            click(nextButton);
            document.getElementById('veteran').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-veteran-duty-period',
          setUp: function() {
            click(nextButton);
            document.getElementById('veteran').checked = true;
            click(nextButton);
            document.getElementById('served-from').value = '2000-01-01';
            document.getElementById('served-until').value = '2001-12-30'; // 729 days later
            document.getElementById('your-duty-type').value = 'active-duty';
            click(nextButton);
          },
          otherChecks: function() {
            expect(document.getElementById('page-veteran-duty-period').textContent)
              .toContain('from 1/1/2000 until 12/30/2001');
          },
        },
        {
          pageId: 'page-immigration-status',
          setUp: function() {
            click(nextButton);
            document.getElementById('not-citizen').checked = true;
            click(nextButton);
          },
        },
      ],
    },
    {
      sectionId: 'section-household',
      backVisible: true,
      nextVisible: true,
      submitVisible: false,
      disabledSteps: [
        'nav-section-income',
        'nav-section-existing-benefits',
        'nav-section-results',
      ],
      inProgressStep: 'nav-section-household',
      doneSteps: [
        'nav-section-yourself',
      ],
      pages: [
        {
          pageId: 'page-household-members',
          setUp: function() {
            click(nextButton, 2);
          },
        },
        {
          pageId: 'page-household-unborn-members',
          setUp: function() {
            click(nextButton);
            document.getElementById('pregnant').checked = true;
            click(nextButton, 2);
          },
        },
        {
          pageId: 'page-household-situation',
          setUp: function() {
            click(nextButton, 3);
          },
        },
        {
          pageId: 'page-household-housed',
          setUp: function() {
            click(nextButton, 3);
            document.getElementById('housed').checked = true;
            click(nextButton);
          },
        },
      ],
    },
    {
      sectionId: 'section-income',
      backVisible: true,
      nextVisible: true,
      submitVisible: false,
      disabledSteps: [
        'nav-section-existing-benefits',
        'nav-section-results',
      ],
      inProgressStep: 'nav-section-income',
      doneSteps: [
        'nav-section-yourself',
        'nav-section-household',
      ],
      pages: [
        {
          pageId: 'page-income',
          setUp: function() {
            click(nextButton, 4);
          },
        },
        {
          pageId: 'page-income-details-wages',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-wages').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-self-employed',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-self-employed').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-disability',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-disability').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-unemployment',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-unemployment').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-retirement',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-retirement').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-veterans',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-veterans').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-workers-comp',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-workers-comp').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-child-support',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-child-support').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-income-details-other',
          setUp: function() {
            click(nextButton, 4);
            document.getElementById('income-has-other').checked = true;
            click(nextButton);
          },
        },
        {
          pageId: 'page-ss-taxes',
          setUp: function() {
            click(nextButton, 5);
          },
        },
        {
          pageId: 'page-income-assets',
          setUp: function() {
            click(nextButton, 6);
          },
        },
      ],
    },
    {
      sectionId: 'section-existing-benefits',
      backVisible: true,
      nextVisible: false,
      submitVisible: true,
      disabledSteps: [
        'nav-section-results',
      ],
      inProgressStep: 'nav-section-existing-benefits',
      doneSteps: [
        'nav-section-yourself',
        'nav-section-household',
        'nav-section-income',
      ],
      pages: [
        {
          pageId: 'page-existing-benefits',
          setUp: function() {
            click(nextButton, 7);
          },
        },
      ],
    },
    {
      sectionId: 'section-results',
      backVisible: true,
      nextVisible: false,
      submitVisible: false,
      disabledSteps: [],
      inProgressStep: 'nav-section-results',
      doneSteps: [
        'nav-section-yourself',
        'nav-section-household',
        'nav-section-income',
        'nav-section-existing-benefits',
        'nav-section-results',
      ],
      pages: [
        {
          pageId: 'page-results',
          setUp: function() {
            // This eval is needed for window access to the eligibility functions.
            window.eval(eligScript);
            click(nextButton, 7);
            click(submitButton);
          },
        },
      ],
    },
  ];


  function clickUntilHidden(button) {
    const start = new Date().getTime();
    let prevPageId = visiblePage().id;
    const pageIdsSeen = [prevPageId];
    while (timeout(start) || !button.classList.contains('hidden')) {
      // NOTE: Errors in the click handler do not propagate back to Jest.
      // When calling such handlers in a loop like this, there is the potential
      // for many errors to accumulate and spam the output console.  We attempt
      // to prevent that by 1) having a timeout and 2) making sure the click()
      // actually does something before continuing the loop.
      // https://github.com/testing-library/react-testing-library/issues/624
      // https://github.com/testing-library/react-testing-library/issues/1068
      click(button);
      const thisPageId = visiblePage().id;
      expect(thisPageId).not.toBe(prevPageId);
      pageIdsSeen.push(thisPageId);
      prevPageId = thisPageId;
    }
    return pageIdsSeen;
  }

  function toFormStart() {
    return clickUntilHidden(backButton);
  }
  function toFormEnd() {
    return clickUntilHidden(nextButton);
  }

  function expectPagesUsed(pageIds) {
    // Get back to the beginning.
    toFormStart();
    // Click through all pages.
    const pageIdsSeen = toFormEnd();
    expect(pageIds.sort()).toEqual(pageIdsSeen.sort());
  }

  beforeEach(() => {
    // This step is a bit slow, so use caution when creating new test() calls.
    document.body.parentElement.innerHTML = html;
    elig.init();
    nextButton = document.getElementById('next-button');
    backButton = document.getElementById('back-button');
    submitButton = document.getElementById('submit-button');
  });

  describe.each(
    pageTestCases)('Section UI is correct for $sectionId', ({sectionId,
    backVisible, nextVisible, submitVisible, disabledSteps, inProgressStep,
    doneSteps, pages}) => {
    test.each(pages)(`$pageId`, ({pageId, setUp, otherChecks}) => {
      // Navigate to the page of interest and do any other setup.
      if (setUp) {
        setUp();
      }
      // Ensure the expected page and section are visible.
      expect(visibleSection().id).toBe(sectionId);
      expect(visiblePage().id).toBe(pageId);
      // Ensure the step indicator state is as expected.
      expectStepsDisabled(disabledSteps);
      expectStepInProgress(inProgressStep);
      expectStepsDone(doneSteps);
      // Ensure the form controls are as expected.
      expectVisibility('back-button', backVisible);
      expectVisibility('next-button', nextVisible);
      expectVisibility('submit-button', submitVisible);
      // Check any page-specific items.
      if (otherChecks) {
        otherChecks();
      }
    });
  });

  test('Can navigate using the back button', () => {
    click(nextButton);
    expect(visiblePage().id).toBe('page-yourself-start');
    click(backButton);
    expect(visiblePage().id).toBe('page-intro');
    click(nextButton, 2);
    // Skips over conditional pages between yourself-start and household-members
    expect(visiblePage().id).toBe('page-household-members');
    click(backButton);
    // Returns to the previously-seen page, not the closest prior page
    expect(visiblePage().id).toBe('page-yourself-start');
  });

  test('Can jump to sections with the step indicator', () => {
    // Get to the very end of the form.
    window.eval(eligScript);
    toFormEnd();
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');
    // Navigate to each section using the step indicator.
    for (const step of getSteps()) {
      let expectedSection;
      let expectedPage;
      switch (step.id) {
      case 'nav-section-yourself':
        expectedSection = 'section-yourself';
        expectedPage = 'page-yourself-start';
        break;
      case 'nav-section-household':
        expectedSection = 'section-household';
        expectedPage = 'page-household-members';
        break;
      case 'nav-section-income':
        expectedSection = 'section-income';
        expectedPage = 'page-income';
        break;
      case 'nav-section-existing-benefits':
        expectedSection = 'section-existing-benefits';
        expectedPage = 'page-existing-benefits';
        break;
      case 'nav-section-results':
        expectedSection = 'section-results';
        expectedPage = 'page-results';
        break;
      default:
        throw new Error(`Section "${step.id}" needs a test case added.`);
      }
      expect(visibleSection().id).not.toBe(expectedSection);
      click(step);
      expect(visibleSection().id).toBe(expectedSection);
      expect(visiblePage().id).toBe(expectedPage);
    }
  });

  test('Follow-up questions shown for certain short duty periods', () => {
    click(nextButton);
    click(document.getElementById('veteran'));
    click(nextButton);
    // Follow up question should be shown
    select(document.getElementById('your-duty-type'), 'active-duty');
    enterText(document.getElementById('served-from'), '2020-01-01');
    enterText(document.getElementById('served-until'), '2020-01-02');
    click(nextButton);
    let thisPage = visiblePage();
    expect(thisPage.id).toBe('page-veteran-duty-period');
    check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
    expect(thisPage.textContent).toContain('from 1/1/2020 until 1/2/2020');
    // Choose an option for the follow up question
    click(document.getElementById('full-dur-yes'));
    click(backButton);
    // Add a new duty period to use for the remainder of the test
    click(visiblePage().querySelector('.field_list_add'));
    select(document.getElementById('your-duty-type-1'), 'active-duty');
    enterText(document.getElementById('served-from-1'), '2000-01-01');
    enterText(document.getElementById('served-until-1'), '2001-12-30'); // 729 days
    click(nextButton);
    check(thisPage.querySelectorAll('fieldset')[1]).isVisible();
    expect(thisPage.textContent).toContain('from 1/1/2000 until 12/30/2001');
    // The selection made in the first question should not be copied to the
    // second question.
    expect(document.getElementById('full-dur-yes').checked).toBe(true);
    expect(document.getElementById('full-dur-yes-period1').checked).toBe(false);
    // Selecting an option in the second question should not affect the
    // option selected in the first question.
    click(document.getElementById('full-dur-yes-period1'));
    expect(document.getElementById('full-dur-yes').checked).toBe(true);
    expect(document.getElementById('full-dur-yes-period1').checked).toBe(true);

    // Not active duty
    const otherDutyTypes = Array.from(
      document.getElementById('your-duty-type-1')
        .querySelectorAll('option:not([value="active-duty"])'),
      (e) => e.value);
    for (const dutyType of otherDutyTypes) {
      click(backButton);
      select(document.getElementById('your-duty-type-1'), dutyType);
      click(nextButton);
      thisPage = visiblePage();
      check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
      check(thisPage.querySelectorAll('fieldset')[1]).isHidden();
    }

    // Duty period is too long
    click(backButton);
    select(document.getElementById('your-duty-type-1'), 'active-duty');
    enterText(document.getElementById('served-from-1'), '2000-01-01');
    enterText(document.getElementById('served-until-1'), '2001-12-31'); // 730 days
    click(nextButton);
    thisPage = visiblePage();
    check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
    check(thisPage.querySelectorAll('fieldset')[1]).isHidden();

    // Service occured too long ago
    click(backButton);
    select(document.getElementById('your-duty-type-1'), 'active-duty');
    enterText(document.getElementById('served-from-1'), '1980-09-07');
    enterText(document.getElementById('served-until-1'), '1980-09-08');
    click(nextButton);
    thisPage = visiblePage();
    check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
    check(thisPage.querySelectorAll('fieldset')[1]).isHidden();
  });

  // TODO: Break tests like this into individual test() calls, presuming
  // the test suite does not take too long to run.  Or even if it does, perhaps
  // then separate this functional test suite out from the unit test suites.
  test('Can add and remove items from dynamicFieldLists', () => {
    // Duty periods
    click(nextButton);
    click(document.getElementById('veteran'));
    click(nextButton);
    let selector = '#page-veteran-details ul.dynamic_field_list > li';
    // Starts with a duty period already populated.
    expect(document.querySelectorAll(selector).length).toBe(1);
    // There should be just one follow-up question corresponding to the one duty
    // period.
    const qSelector = '#page-veteran-duty-period fieldset';
    expect(document.querySelectorAll(qSelector).length).toBe(1);
    addDutyPeriod();
    addDutyPeriod();
    const origDutyPeriods = document.querySelectorAll(selector);
    expect(origDutyPeriods.length).toBe(3);
    // A follow-up question should also be added for the new duty period.
    expect(document.querySelectorAll(qSelector).length).toBe(3);
    // There are 3 duty periods. Remove the middle one.
    removeDutyPeriodAt(1);
    const updatedDutyPeriods = document.querySelectorAll(selector);
    expect(updatedDutyPeriods.length).toBe(2);
    expect(document.querySelectorAll(qSelector).length).toBe(2);
    // The remaining duty periods should be the first and last one in the
    // inital list of 3.
    expect(updatedDutyPeriods[0]).toEqual(origDutyPeriods[0]);
    expect(updatedDutyPeriods[1]).toEqual(origDutyPeriods[2]);

    // Household members
    click(nextButton);
    selector = '#page-household-members ul.dynamic_field_list > li';
    // Starts with user already populated.
    expect(document.querySelectorAll(selector).length).toBe(1);
    // There should be just one income section corresponding to the one member.
    expectNumIncomeListsToBe(1);
    addHouseholdMember();
    addHouseholdMember();
    const origMembers = document.querySelectorAll(selector);
    expect(origMembers.length).toBe(3);
    // An income section should also automatically be added for the new
    // household members
    expectNumIncomeListsToBe(3);
    removeHouseholdMemberAt(1);
    const updatedMembers = document.querySelectorAll(selector);
    expect(updatedMembers.length).toBe(2);
    expectNumIncomeListsToBe(2);
    expect(updatedMembers[0]).toEqual(origMembers[0]);
    expect(updatedMembers[1]).toEqual(origMembers[2]);
    // Ensure household member names can be updated.
    enterText(updatedMembers[1].querySelector('#hh-member-name-2'), 'Ada');
    expect(updatedMembers[1].querySelector('h4').textContent).toBe('Ada');

    // All incomes and assets
    click(nextButton, 2);
    click(document.getElementById('income-has-wages'));
    click(document.getElementById('income-has-self-employed'));
    click(document.getElementById('income-has-disability'));
    click(document.getElementById('income-has-unemployment'));
    click(document.getElementById('income-has-retirement'));
    click(document.getElementById('income-has-veterans'));
    click(document.getElementById('income-has-workers-comp'));
    click(document.getElementById('income-has-child-support'));
    click(document.getElementById('income-has-other'));
    selector = ':scope > li';
    const incomePages = getIncomePages();
    expect(incomePages.length).toBeGreaterThan(0);
    for (const incomePage of incomePages) {
      click(nextButton);
      if (visiblePage().id == 'page-ss-taxes') {
        // Skip over Social Security taxes question to get to assets page.
        click(nextButton);
      }
      const incomeLists = getIncomeLists(incomePage);
      expect(incomeLists.length).toBe(2);
      for (const incomeList of incomeLists) {
        expect(incomeList.querySelectorAll(selector).length).toBe(0);
        const addButton = incomeList.parentElement.querySelector('.field_list_add');
        click(addButton);
        click(addButton);
        const origEntries = incomeList.querySelectorAll(selector);
        expect(origEntries.length).toBe(2);
        for (const entry of origEntries) {
          enterText(entry.querySelector('input[type=number]'), '123');
        }
        const removeButtons = incomeList.querySelectorAll(':scope > li button');
        click(removeButtons[0]);
        const updatedEntries = incomeList.querySelectorAll(selector);
        expect(updatedEntries.length).toBe(1);
        expect(updatedEntries[0]).toEqual(origEntries[1]);
      }
      // Two household members, one income entry each.
      expect(incomePage.textContent).toContain('$246');
      // Named household member should appear.
      expect(incomePage.textContent).toContain('Ada');
    }
    // Go back to add another household member, and ensure the existing
    // income data is not copied to the new income section.
    click(document.getElementById('nav-section-household'));
    addHouseholdMember();
    click(nextButton, 2);
    for (const incomePage of incomePages) {
      click(nextButton);
      if (visiblePage().id == 'page-ss-taxes') {
        // Skip over Social Security taxes question to get to assets page.
        click(nextButton);
      }
      const incomeLists = getIncomeLists(incomePage);
      expect(incomeLists.length).toBe(3);
      const lastIncomeList = incomeLists[incomeLists.length - 1];
      expect(lastIncomeList.querySelectorAll(selector).length).toBe(0);
    }
  });

  test('Selecting no income clears and disables all income options', () => {
    const incomeCheckboxes = document.querySelectorAll(
      '[id^="income-has-"]:not(#income-has-none)');
    const noIncomeCheckbox = document.getElementById('income-has-none');
    click(nextButton, 4);
    expect(visiblePage().id).toBe('page-income');
    for (const checkbox of incomeCheckboxes) {
      expect(checkbox.disabled).toBe(false);
      checkbox.checked = true;
    }
    // Use click() here rather than .checked so that the proper event fires.
    click(noIncomeCheckbox);
    expect(noIncomeCheckbox.checked).toBe(true);
    for (const checkbox of incomeCheckboxes) {
      expect(checkbox.disabled).toBe(true);
      expect(checkbox.checked).toBe(false);
    }
    click(noIncomeCheckbox);
    expect(noIncomeCheckbox.checked).toBe(false);
    for (const checkbox of incomeCheckboxes) {
      expect(checkbox.disabled).toBe(false);
      expect(checkbox.checked).toBe(false);
    }
  });

  test('Selecting a spouse unselects any previous spouse selection', () => {
    click(nextButton, 2);
    addHouseholdMember();
    addHouseholdMember();
    addHouseholdMember();
    const spouse1 = document.getElementById('hh-member-spouse-1');
    const spouse2 = document.getElementById('hh-member-spouse-2');
    const spouse3 = document.getElementById('hh-member-spouse-3');
    click(spouse1);
    expect(spouse1.checked).toBe(true);
    expect(spouse2.checked).toBe(false);
    expect(spouse3.checked).toBe(false);
    click(spouse2);
    expect(spouse1.checked).toBe(false);
    expect(spouse2.checked).toBe(true);
    expect(spouse3.checked).toBe(false);
    click(spouse3);
    expect(spouse1.checked).toBe(false);
    expect(spouse2.checked).toBe(false);
    expect(spouse3.checked).toBe(true);
    click(spouse3);
    expect(spouse1.checked).toBe(false);
    expect(spouse2.checked).toBe(false);
    expect(spouse3.checked).toBe(false);
  });

  test('Setting one age field updates the value of the other age field', () => {
    const yourselfAge = document.getElementById('age');
    const householdAge = document.getElementById('hh-myself-age');
    click(nextButton);
    enterText(yourselfAge, '42');
    expect(yourselfAge.value).toBe('42');
    expect(householdAge.value).toBe('42');
    click(nextButton);
    enterText(householdAge, '43');
    expect(yourselfAge.value).toBe('43');
    expect(householdAge.value).toBe('43');
  });

  test('Pages linked together properly', () => {
    const expectedPages = [
      'page-intro',
      'page-yourself-start',
      'page-household-members',
      'page-household-situation',
      'page-income',
      'page-ss-taxes',
      'page-income-assets',
      'page-existing-benefits',
    ];
    expectPagesUsed(expectedPages);

    expectedPages.push('page-head-of-household');
    document.getElementById('age').value = elig.cnst.calworks.MAX_CHILD_AGE;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-immigration-status');
    document.getElementById('not-citizen').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-disability-details');
    document.getElementById('disabled').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('disabled').checked = false;
    document.getElementById('blind').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('blind').checked = false;
    document.getElementById('deaf').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-veteran-details');
    document.getElementById('veteran').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-veteran-duty-period');
    document.getElementById('served-from').value = '2000-01-01';
    document.getElementById('served-until').value = '2001-12-30'; // 729 days later
    document.getElementById('your-duty-type').value = 'active-duty';
    expectPagesUsed(expectedPages);

    expectedPages.push('page-household-unborn-members');
    document.getElementById('pregnant').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('pregnant').checked = false;
    document.querySelector(
      '#page-household-members .field_list_add').click();
    document.getElementById('hh-member-pregnant-1').checked = true;
    expectPagesUsed(expectedPages);

    document.getElementById('vehicle').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('transitional').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('hotel').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('shelter').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('no-stable-place').checked = true;
    expectPagesUsed(expectedPages);
    expectedPages.push('page-household-housed');
    document.getElementById('housed').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('unlisted-stable-place').checked = true;
    expectPagesUsed(expectedPages);

    document.getElementById('income-has-none').checked = true;
    expectPagesUsed(expectedPages);
    document.getElementById('income-has-none').checked = false;

    expectedPages.push('page-income-details-wages');
    document.getElementById('income-has-wages').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-self-employed');
    document.getElementById('income-has-self-employed').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-disability');
    document.getElementById('income-has-disability').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-unemployment');
    document.getElementById('income-has-unemployment').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-retirement');
    document.getElementById('income-has-retirement').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-veterans');
    document.getElementById('income-has-veterans').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-workers-comp');
    document.getElementById('income-has-workers-comp').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-child-support');
    document.getElementById('income-has-child-support').checked = true;
    expectPagesUsed(expectedPages);

    expectedPages.push('page-income-details-other');
    document.getElementById('income-has-other').checked = true;
    expectPagesUsed(expectedPages);

    const allPages = Array.from(
      document.querySelectorAll('.elig_page:not(#page-results)'), (p) => p.id);
    expectPagesUsed(allPages);
  });

  test('Hidden yes/no questions can be answered after being revealed', () => {
    window.eval(eligScript);
    const pagesSeen = toFormEnd();
    click(submitButton);
    // The page of interest should not have been shown this first time around.
    expect(pagesSeen).not.toContain('page-household-housed');
    // Make the page show up by answering a question appropriately.
    click(document.getElementById('nav-section-household'));
    click(nextButton);
    click(document.getElementById('housed'));
    click(nextButton);
    expect(visiblePage().id).toBe('page-household-housed');
    // Ensure the questions can be answered and submitted with no errors.
    click(document.getElementById('pay-utilities-yes'));
    toFormEnd();
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');
  });
});

test.todo('Unused pages are cleared before eligibility assessment');

describe('buildInputObj', () => {
  beforeAll(() => {
    document.body.parentElement.innerHTML = html;
  });

  test.each([true, false, null])('Sets paysUtilities with value of %s', (val) => {
    setYesNo('pay-utilities', val);
    expect(getInput()).toHaveProperty('paysUtilities', val);
  });

  test.each([true, false, null])('Sets homelessRisk with value of %s', (val) => {
    setYesNo('risk-homeless', val);
    expect(getInput()).toHaveProperty('homelessRisk', val);
  });

  test.each([true, false, null])('Sets usesGuideDog with value of %s', (val) => {
    setYesNo('use-guide-dog', val);
    expect(getInput()).toHaveProperty('usesGuideDog', val);
  });

  test.each([true, false, null])('Sets militaryDisabled with value of %s', (val) => {
    setYesNo('dis-military', val);
    expect(getInput()).toHaveProperty('militaryDisabled', val);
  });

  test.each([true, false, null])('Sets paidSsTaxes with value of %s', (val) => {
    setYesNo('ss-taxes', val);
    expect(getInput()).toHaveProperty('paidSsTaxes', val);
  });

  test.each([
    'housed',
    'vehicle',
    'transitional',
    'hotel',
    'shelter',
    'unlisted-stable-place',
    'no-stable-place',
  ])('Sets housingSituation with value of "%s"', (id) => {
    document.getElementById(id).checked = true;
    expect(getInput()).toHaveProperty('housingSituation', id);
  });

  test.each([
    'permanent_resident',
    'long_term',
    'live_temporarily',
    'none_describe',
  ])('Sets immigrationStatus with value of "%s"', (id) => {
    document.getElementById(id).checked = true;
    expect(getInput()).toHaveProperty('immigrationStatus', id);
  });

  test('Income is invalid with no entries unless no income is explicitly specified', () => {
    expect(getInput().income.valid).toBe(false);
    document.getElementById('income-has-none').checked = true;
    expect(getInput().income.valid).toBe(true);
  });

  test('Sets all data from page elements', () => {
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
      paysUtilities: true,
      hasKitchen: true,
      homelessRisk: true,
      immigrationStatus: 'permanent_resident',
      usesGuideDog: true,
      militaryDisabled: true,
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
        valid: true,
        wages: [[10, 50], [200], [3000]],
        selfEmployed: [[11, 51], [210], [3100]],
        disability: [[12, 52], [220], [3200]],
        unemployment: [[13, 53], [230], [3300]],
        retirement: [[14, 54], [240], [3400]],
        veterans: [[15, 55], [250], [3500]],
        workersComp: [[16, 56], [260], [3600]],
        childSupport: [[17, 57], [270], [3700]],
        other: [[18, 58], [280], [3800]],
      },
      assets: [[1000, 99], [2000], [3000]],
      paidSsTaxes: true,
      ssiIncome: [12, 220],
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
      existingPhaHousehold: true,
      existingPhaMe: true,
      existingSchipMe: true,
      existingSchipHousehold: true,
    };

    document.body.parentElement.innerHTML = html;
    elig.init();
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

    const householdMemberAdd = document.querySelector(
      '#page-household-members .field_list_add');
    householdMemberAdd.click();
    householdMemberAdd.click();
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

    document.querySelector('#page-veteran-details .field_list_add').click();
    document.getElementById('your-duty-type').value = expected.dutyPeriods[0].type;
    document.getElementById('served-from').value = dutyPeriodStartStrs[0];
    document.getElementById('served-until').value = dutyPeriodEndStrs[0];
    document.getElementById('your-duty-type-1').value = expected.dutyPeriods[1].type;
    document.getElementById('served-from-1').value = dutyPeriodStartStrs[1];
    document.getElementById('served-until-1').value = dutyPeriodEndStrs[1];
    expect(getInput().dutyPeriods).toEqual(expected.dutyPeriods);

    addIncome('wages', expected.income.wages);
    addIncome('self-employed', expected.income.selfEmployed);
    addIncome('disability', expected.income.disability);
    addIncome('unemployment', expected.income.unemployment);
    addIncome('retirement', expected.income.retirement);
    addIncome('veterans', expected.income.veterans);
    addIncome('workers-comp', expected.income.workersComp);
    addIncome('child-support', expected.income.childSupport);
    addIncome('other', expected.income.other);
    expect(getInput().income).toEqual(expected.income);

    addAssets(expected.assets);
    expect(getInput().assets).toEqual(expected.assets);

    setYesNo('ss-taxes', expected.paidSsTaxes);
    expect(getInput().paidSsTaxes).toBe(expected.paidSsTaxes);

    document.getElementById('income-disability-is-ssi-capi-0').checked = true;
    document.getElementById('income-disability-is-ssi-capi-member1-0').checked = true;
    expect(getInput().ssiIncome).toEqual(expected.ssiIncome);

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

    document.getElementById('existing-pha-me').checked = expected.existingPhaMe;
    expect(getInput().existingPhaMe).toBe(expected.existingPhaMe);

    document.getElementById('existing-pha-household').checked = expected.existingPhaHousehold;
    expect(getInput().existingPhaHousehold).toBe(expected.existingPhaHousehold);

    document.getElementById('existing-schip-me').checked = expected.existingSchipMe;
    expect(getInput().existingSchipMe).toBe(expected.existingSchipMe);

    document.getElementById('existing-schip-household').checked = expected.existingSchipHousehold;
    expect(getInput().existingSchipHousehold).toBe(expected.existingSchipHousehold);

    expect(getInput()).toEqual(expected);
  });
});
