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
  const visibleSections = document.querySelectorAll(
    '.elig_section:not(.hidden)');
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
  check(elem).isVisible();
  if (elem.tagName == 'SELECT') {
    elem.value = option.toString();
    const inputEvent = new Event('input', {bubbles: true});
    const changeEvent = new Event('change', {bubbles: true});
    elem.dispatchEvent(inputEvent);
    elem.dispatchEvent(changeEvent);
  } else {
    throw new Error(`Can not select an item on a ${elem.type} element`);
  }
}

// Enters text into an element, but _only_ if it's visible to the user.
function enterText(elem, text) {
  check(elem).isVisible();
  if (['INPUT', 'TEXTAREA'].includes(elem.tagName)) {
    const inputStr = text.toString();
    elem.value = '';
    for (const char of inputStr) {
      const keydownEvent = new Event('keydown', {bubbles: true});
      elem.dispatchEvent(keydownEvent);
      elem.value += char;
      const inputEvent = new Event('input', {bubbles: true});
      elem.dispatchEvent(inputEvent);
    }
    const changeEvent = new Event('change', {bubbles: true});
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

let html;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
  html = fs.readFileSync(
    path.resolve(__dirname,
      '../../../../../test/dist/benefits-eligibility/index.html'),
    'utf8');
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
            document.getElementById('age').value = (
              elig.cnst.calworks.MAX_CHILD_AGE);
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
            document.getElementById('served-from-year').value = '2000';
            document.getElementById('served-from-month').value = '01';
            document.getElementById('served-from-day').value = '01';
            // 729 days later:
            document.getElementById('served-until-year').value = '2001';
            document.getElementById('served-until-month').value = '12';
            document.getElementById('served-until-day').value = '30';
            document.getElementById('your-duty-type').value = 'active-duty';
            click(nextButton);
          },
          otherChecks: function() {
            expect(
              document.getElementById('page-veteran-duty-period').textContent)
              .toContain('from\u20091/1/2000\u2009until\u200912/30/2001');
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
    enterText(document.getElementById('served-from-year'), '2020');
    enterText(document.getElementById('served-from-month'), '01');
    enterText(document.getElementById('served-from-day'), '01');
    enterText(document.getElementById('served-until-year'), '2020');
    enterText(document.getElementById('served-until-month'), '01');
    enterText(document.getElementById('served-until-day'), '02');
    click(nextButton);
    let thisPage = visiblePage();
    expect(thisPage.id).toBe('page-veteran-duty-period');
    check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
    expect(thisPage.textContent).toContain('from\u20091/1/2020\u2009until\u20091/2/2020');
    // Choose an option for the follow up question
    click(document.getElementById('full-dur-yes'));
    click(backButton);
    // Add a new duty period to use for the remainder of the test
    click(visiblePage().querySelector('.field_list_add'));
    select(document.getElementById('your-duty-type-1'), 'active-duty');
    enterText(document.getElementById('served-from-year-1'), '2000');
    enterText(document.getElementById('served-from-month-1'), '01');
    enterText(document.getElementById('served-from-day-1'), '01');
    // 729 days later:
    enterText(document.getElementById('served-until-year-1'), '2001');
    enterText(document.getElementById('served-until-month-1'), '12');
    enterText(document.getElementById('served-until-day-1'), '30');
    click(nextButton);
    check(thisPage.querySelectorAll('fieldset')[1]).isVisible();
    expect(thisPage.textContent).toContain('from\u20091/1/2000\u2009until\u200912/30/2001');
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
    enterText(document.getElementById('served-from-year-1'), '2000');
    enterText(document.getElementById('served-from-month-1'), '01');
    enterText(document.getElementById('served-from-day-1'), '01');
    // 730 days later:
    enterText(document.getElementById('served-until-year-1'), '2001');
    enterText(document.getElementById('served-until-month-1'), '12');
    enterText(document.getElementById('served-until-day-1'), '31');
    click(nextButton);
    thisPage = visiblePage();
    check(thisPage.querySelectorAll('fieldset')[0]).isVisible();
    check(thisPage.querySelectorAll('fieldset')[1]).isHidden();

    // Service occured too long ago
    click(backButton);
    select(document.getElementById('your-duty-type-1'), 'active-duty');
    enterText(document.getElementById('served-from-year-1'), '1980');
    enterText(document.getElementById('served-from-month-1'), '09');
    enterText(document.getElementById('served-from-day-1'), '07');
    enterText(document.getElementById('served-until-year-1'), '1980');
    enterText(document.getElementById('served-until-month-1'), '09');
    enterText(document.getElementById('served-until-day-1'), '08');
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
        const addButton = incomeList.parentElement.querySelector(
          '.field_list_add');
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
      if (visiblePage().id == 'page-income-assets') {
        expect(incomePage.textContent).toContain('$246');
        expect(incomePage.textContent).not.toContain('per month');
      } else {
        expect(incomePage.textContent).toContain('$246\u2009per month');
      }
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
    expect(incomeCheckboxes.length).toBeGreaterThan(0);
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

  test('Selecting no assets disables add asset buttons', () => {
    click(nextButton, 2);
    expect(visiblePage().id).toBe('page-household-members');
    addHouseholdMember();
    addHouseholdMember();
    click(nextButton, 4);
    expect(visiblePage().id).toBe('page-income-assets');
    const itemSelector = 'ul.dynamic_field_list > li';
    const wrapper = document.querySelector(
      '#page-income-assets .income_details_wrapper');
    const buttons = wrapper.querySelectorAll('button.field_list_add');
    const noAssets = document.getElementById('assets-has-none');
    for (const button of buttons) {
      expect(button.hasAttribute('aria-disabled')).toBe(false);
    }
    click(noAssets);
    expect(wrapper.querySelectorAll(itemSelector).length).toBe(0);
    for (const button of buttons) {
      expect(button.hasAttribute('aria-disabled')).toBe(true);
      click(button);
    }
    // Clicking the add button should not add any assets.
    expect(wrapper.querySelectorAll(itemSelector).length).toBe(0);
    click(noAssets);
    for (const button of buttons) {
      expect(button.hasAttribute('aria-disabled')).toBe(false);
      click(button);
    }
    expect(wrapper.querySelectorAll(itemSelector).length).toBe(3);
  });

  test('Selecting "none of the above" clears and disables all yourself descriptors', () => {
    const yourselfCheckboxes = document.querySelectorAll(
      '#yourself-details input[type="checkbox"]:not(#yourself-details-none)');
    expect(yourselfCheckboxes.length).toBeGreaterThan(0);
    const noneCheckbox = document.getElementById('yourself-details-none');
    click(nextButton);
    expect(visiblePage().id).toBe('page-yourself-start');
    for (const checkbox of yourselfCheckboxes) {
      expect(checkbox.disabled).toBe(false);
      checkbox.checked = true;
    }
    // Use click() here rather than .checked so that the proper event fires.
    click(noneCheckbox);
    expect(noneCheckbox.checked).toBe(true);
    for (const checkbox of yourselfCheckboxes) {
      expect(checkbox.disabled).toBe(true);
      expect(checkbox.checked).toBe(false);
    }
    click(noneCheckbox);
    expect(noneCheckbox.checked).toBe(false);
    for (const checkbox of yourselfCheckboxes) {
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

  test('Selecting a spouse unselects dependent and vice versa', () => {
    click(nextButton, 2);
    addHouseholdMember();
    const spouse1 = document.getElementById('hh-member-spouse-1');
    const dependent1 = document.getElementById('hh-member-dependent-1');
    click(dependent1);
    expect(spouse1.checked).toBe(false);
    expect(dependent1.checked).toBe(true);
    click(spouse1);
    expect(dependent1.checked).toBe(false);
    expect(spouse1.checked).toBe(true);
    click(dependent1);
    expect(spouse1.checked).toBe(false);
    expect(dependent1.checked).toBe(true);
    click(dependent1);
    expect(spouse1.checked).toBe(false);
    expect(dependent1.checked).toBe(false);
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

  test('Clearing household member name field resets the heading', () => {
    click(nextButton, 2);
    addHouseholdMember();
    const nameInput = document.getElementById('hh-member-name-1');
    const member = document.querySelectorAll(
      '#page-household-members ul.dynamic_field_list > li')[1];
    const heading = member.querySelector('h4');
    const defaultHeading = 'Household Member 2';
    const customName = 'Alan';
    expect(heading.textContent).toBe(defaultHeading);
    enterText(nameInput, customName);
    expect(heading.textContent).toBe(customName);
    enterText(nameInput, '');
    expect(heading.textContent).toBe(defaultHeading);
    enterText(nameInput, ' ');
    expect(heading.textContent).toBe(defaultHeading);
    enterText(nameInput, customName);
    expect(heading.textContent).toBe(customName);
  });

  test('Numerical inputs disallow invalid input', () => {
    click(nextButton);
    expect(visiblePage().id).toBe('page-yourself-start');
    const yourselfAge = document.getElementById('age');
    enterText(yourselfAge, '-1');
    expect(yourselfAge.value).toBe('1');
    enterText(yourselfAge, '0');
    expect(yourselfAge.value).toBe('');
    enterText(yourselfAge, '131');
    expect(yourselfAge.value).toBe('13');
    enterText(yourselfAge, '54');
    expect(yourselfAge.value).toBe('54');

    click(nextButton);
    expect(visiblePage().id).toBe('page-household-members');
    const householdAge = document.getElementById('hh-myself-age');
    enterText(householdAge, '-1');
    expect(householdAge.value).toBe('1');
    enterText(householdAge, '0');
    expect(householdAge.value).toBe('');
    enterText(householdAge, '131');
    expect(householdAge.value).toBe('13');
    enterText(householdAge, '54');
    expect(householdAge.value).toBe('54');

    addHouseholdMember();
    const otherAge = document.getElementById('hh-member-age-1');
    enterText(otherAge, '-1');
    expect(otherAge.value).toBe('1');
    enterText(otherAge, '0');
    expect(otherAge.value).toBe('0');
    enterText(otherAge, '131');
    expect(otherAge.value).toBe('13');
    enterText(otherAge, '54');
    expect(otherAge.value).toBe('54');

    click(document.getElementById('hh-member-pregnant-1'));
    click(nextButton);
    expect(visiblePage().id).toBe('page-household-unborn-members');
    const unborn = document.getElementById('unborn-children');
    enterText(unborn, '-1');
    expect(unborn.value).toBe('1');
    enterText(unborn, '0');
    expect(unborn.value).toBe('0');
    enterText(unborn, '4');
    expect(unborn.value).toBe('4');

    click(nextButton, 2);
    expect(visiblePage().id).toBe('page-income');
    click(document.getElementById('income-has-wages'));
    click(nextButton);
    expect(visiblePage().id).toBe('page-income-details-wages');
    const addButton = visiblePage().querySelector('.field_list_add');
    click(addButton);
    const wages = document.getElementById('income-wages-0');
    enterText(wages, '-1');
    expect(wages.value).toBe('1');
    enterText(wages, '0');
    expect(wages.value).toBe('0');
    enterText(wages, '123');
    expect(wages.value).toBe('123');
  });

  test('Date inputs disallow invalid input', () => {
    click(nextButton);
    document.getElementById('veteran').checked = true;
    click(nextButton);
    expect(visiblePage().id).toBe('page-veteran-details');
    // Month
    const monthInput = document.getElementById('served-from-month');
    enterText(monthInput, '0');
    expect(monthInput.value).toBe('');
    enterText(monthInput, '13');
    expect(monthInput.value).toBe('1');
    enterText(monthInput, '-2');
    expect(monthInput.value).toBe('2');
    enterText(monthInput, '12');
    expect(monthInput.value).toBe('12');
    enterText(monthInput, '1');
    expect(monthInput.value).toBe('1');
    enterText(monthInput, '01');
    expect(monthInput.value).toBe('01');
    // Day
    const dayInput = document.getElementById('served-from-day');
    enterText(dayInput, '0');
    expect(dayInput.value).toBe('');
    enterText(dayInput, '32');
    expect(dayInput.value).toBe('3');
    enterText(dayInput, '-1');
    expect(dayInput.value).toBe('1');
    enterText(dayInput, '31');
    expect(dayInput.value).toBe('31');
    enterText(dayInput, '1');
    expect(dayInput.value).toBe('1');
    enterText(dayInput, '01');
    expect(dayInput.value).toBe('01');
    // Year
    const yearInput = document.getElementById('served-from-year');
    const thisYear = new Date().getFullYear();
    enterText(yearInput, '0');
    expect(yearInput.value).toBe('2000');
    enterText(yearInput, '33');
    expect(yearInput.value).toBe('1933');
    enterText(yearInput, '99');
    expect(yearInput.value).toBe('1999');
    enterText(yearInput, '-1');
    expect(yearInput.value).toBe('2001');
    enterText(yearInput, '3024');
    expect(yearInput.value).toBe('302');
    enterText(yearInput, thisYear + 1);
    expect(yearInput.value).toBe(thisYear.toString().slice(0, 3));
    enterText(yearInput, thisYear);
    expect(yearInput.value).toBe(thisYear.toString());
  });

  test('Dynamic field lists are reset on unused pages.', () => {
    const wagesCheckbox = document.getElementById('income-has-wages');
    const veteranCheckbox = document.getElementById('veteran');
    const itemSelector = 'ul.dynamic_field_list > li';

    // Get to the veteran details page
    click(nextButton);
    click(veteranCheckbox);
    click(nextButton);
    let page = visiblePage();
    expect(page.id).toBe('page-veteran-details');

    // Add duty period entries
    click(document.querySelector('#page-veteran-details .field_list_add'), 2);
    expect(page.querySelectorAll(itemSelector).length).toBe(3);

    // Go back and unselect veteran option
    click(backButton);
    click(veteranCheckbox);
    expect(veteranCheckbox.checked).toBe(false);

    // Get to the wages income details page
    click(nextButton);
    addHouseholdMember();
    click(nextButton, 2);
    click(wagesCheckbox);
    click(nextButton);

    // Add data for both household members
    page = visiblePage();
    expect(page.id).toBe('page-income-details-wages');
    const addButtons = page.querySelectorAll('.field_list_add');
    for (const addButton of addButtons) {
      click(addButton);
    }
    expect(page.querySelectorAll(itemSelector).length).toBe(2);
    enterText(document.getElementById('income-wages-0'), 50);
    enterText(document.getElementById('income-wages-member1-0'), 40);
    expect(page.textContent).toContain('$90');

    // Go back and un-select income from wages
    click(backButton);
    click(wagesCheckbox);
    expect(wagesCheckbox.checked).toBe(false);

    // See results, then return to the veteran and wages income details pages to
    // ensure the lists have reset to the initial state.
    toFormEnd();
    click(submitButton);
    click(document.getElementById('nav-section-yourself'));
    click(veteranCheckbox);
    click(nextButton);
    page = visiblePage();
    expect(page.id).toBe('page-veteran-details');
    expect(page.querySelectorAll(itemSelector).length).toBe(1);
    click(document.getElementById('nav-section-income'));
    click(wagesCheckbox);
    click(nextButton);
    page = visiblePage();
    expect(page.id).toBe('page-income-details-wages');
    expect(page.querySelectorAll(itemSelector).length).toBe(0);
    expect(page.textContent).toContain('$0');
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
    document.getElementById('served-from-year').value = '2000';
    document.getElementById('served-from-month').value = '01';
    document.getElementById('served-from-day').value = '01';
    // 729 days later:
    document.getElementById('served-until-year').value = '2001';
    document.getElementById('served-until-month').value = '12';
    document.getElementById('served-until-day').value = '30';
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

  test('Can return to the form via the "more info needed" note', () => {
    toFormEnd();
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');
    click(document.querySelector('button.back_to_form'));
    expect(visiblePage().id).toBe('page-yourself-start');
  });

  test('Programs are displayed correctly in the results page', () => {
    function classVisible(rootElem, className, expectVisible) {
      const numElems = rootElem.querySelectorAll(`.${className}`).length;
      const numVisibleElems = rootElem.querySelectorAll(
        `.${className}:not(.hidden)`).length;
      if (expectVisible && numElems > 0) {
        expect(numVisibleElems).toBeGreaterThan(0);
      } else {
        expect(numVisibleElems).toBe(0);
      }
    }

    function expectResultsTextVisible(rootElem, expectVisible) {
      classVisible(rootElem, 'has_results', expectVisible);
    }

    function expectNoResultsTextVisible(rootElem, expectVisible) {
      classVisible(rootElem, 'no_results', expectVisible);
    }

    function expectDetailsVisible(rootElem, expectVisible) {
      classVisible(rootElem, 'unenrolled_only', expectVisible);
    }

    function expectNoResults(rootElem) {
      expect(rootElem.querySelectorAll(itemSelector).length).toBe(0);
      expectResultsTextVisible(rootElem, false);
      expectNoResultsTextVisible(rootElem, true);
    }

    function expectResults(rootElem, numExpected=null) {
      const numItems = rootElem.querySelectorAll(itemSelector).length;
      if (numExpected === null) {
        expect(numItems).toBeGreaterThan(0);
      } else {
        expect(numItems).toBe(numExpected);
      }
      expectResultsTextVisible(rootElem, true);
      expectNoResultsTextVisible(rootElem, false);
    }

    function expectProgramsSorted(rootElem) {
      const titles = Array.from(rootElem.querySelectorAll(itemSelector),
        (i) => i.querySelector('h4').textContent);
      expect([].concat(titles).sort()).toEqual(titles);
    }

    const itemSelector = ':scope > ul > li';
    const moreInfoStr = 'need more information';
    const noFeeIdSelector = '#program-no-fee-id';

    // Start with everything unknown or ineligible.
    toFormEnd();
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');

    const eligible = document.getElementById('eligible-programs');
    const unknown = document.getElementById('unknown-programs');
    const ineligible = document.getElementById('ineligible-programs');
    const enrolled = document.getElementById('enrolled-programs');
    const summary = document.getElementById('elig-summary');

    expectNoResults(summary);
    expectNoResults(eligible);
    expectResults(ineligible);
    expectDetailsVisible(ineligible, true);
    expectProgramsSorted(ineligible);
    expectResults(unknown);
    expectDetailsVisible(unknown, true);
    expectProgramsSorted(unknown);
    let noFeeId = unknown.querySelector(noFeeIdSelector);
    expect(noFeeId).not.toBeNull();
    // Flag should be rendered.
    expect(noFeeId.textContent).toContain(moreInfoStr);
    expectNoResults(enrolled);

    click(document.getElementById('nav-section-yourself'));
    // Make eligible for no fee ID.
    enterText(document.getElementById('age'),
      elig.cnst.noFeeId.MIN_ELIGIBLE_AGE);
    click(nextButton, 2);
    // Make ineligible for CARE.
    click(document.getElementById('housed'));
    click(nextButton);
    click(document.getElementById('pay-utilities-no'));
    click(nextButton, 4);
    // Make LifeLine already enrolled.
    click(document.getElementById('existing-lifeline-me'));
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');

    expectResults(summary, 1);
    const firstItem = summary.querySelector(itemSelector);
    expect(firstItem.querySelector('a').hash).toEqual(noFeeIdSelector);
    expect(summary.textContent).toContain('No-Fee ID Card');
    expect(summary.textContent).toContain('checked\u200920\u2009programs');
    expect(summary.textContent).toContain('1\u2009you may qualify for');
    expect(summary.textContent).toContain('1 program you\'re already enrolled');
    expectResults(eligible, 1);
    expectDetailsVisible(eligible, true);
    expectProgramsSorted(eligible);
    noFeeId = eligible.querySelector(noFeeIdSelector);
    expect(noFeeId).not.toBeNull();
    // Flag should not be rendered.
    expect(noFeeId.textContent).not.toContain(moreInfoStr);
    expectResults(ineligible);
    expectDetailsVisible(ineligible, true);
    expectProgramsSorted(ineligible);
    expect(ineligible.querySelector('#program-care')).not.toBeNull();
    expectResults(unknown);
    expectDetailsVisible(unknown, true);
    expectProgramsSorted(unknown);
    expectResults(enrolled, 1);
    expectDetailsVisible(enrolled, false);
    expectProgramsSorted(enrolled);
    expect(enrolled.querySelector('#program-lifeline')).not.toBeNull();

    // Go back to having no eligible programs and check that the "no results"
    // text shows up.
    click(document.getElementById('nav-section-yourself'));
    // Reset age.
    enterText(document.getElementById('age'), '');
    click(nextButton, 7);
    // Reset existing lifeline checkbox.
    click(document.getElementById('existing-lifeline-me'));
    click(submitButton);
    expect(visiblePage().id).toBe('page-results');
    expectNoResults(summary);
    expectNoResults(eligible);
    expectNoResults(enrolled);
  });
});

test.todo('Unused pages are cleared before eligibility assessment');

describe('buildInputObj', () => {
  beforeAll(() => {
    document.body.parentElement.innerHTML = html;
  });

  test.each(
    [true, false, null],
  )('Sets paysUtilities with value of %s', (val) => {
    setYesNo('pay-utilities', val);
    expect(getInput()).toHaveProperty('paysUtilities', val);
  });

  test.each(
    [true, false, null],
  )('Sets usesGuideDog with value of %s', (val) => {
    setYesNo('use-guide-dog', val);
    expect(getInput()).toHaveProperty('usesGuideDog', val);
  });

  test.each(
    [true, false, null],
  )('Sets militaryDisabled with value of %s', (val) => {
    setYesNo('dis-military', val);
    expect(getInput()).toHaveProperty('militaryDisabled', val);
  });

  test.each(
    [true, false, null],
  )('Sets paidSsTaxes with value of %s', (val) => {
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
      immigrationStatus: 'permanent_resident',
      usesGuideDog: true,
      militaryDisabled: true,
      dischargeStatus: 'honorable',
      servedFullDuration: true,
      dutyPeriods: [
        {
          end: new Date(`1961-12-31T00:00`),
          start: new Date(`1960-01-25T00:00`),
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
      assets: {
        valid: true,
        values: [[1000, 99], [2000], [3000]],
      },
      paidSsTaxes: true,
      ssiIncome: [12, 220],
      existingAdsaHousehold: true,
      existingAdsaMe: true,
      existingCalfreshHousehold: true,
      existingCalfreshMe: true,
      existingCalworksHousehold: true,
      existingCalworksMe: true,
      existingCareHousehold: true,
      existingCareMe: true,
      existingCapiHousehold: true,
      existingCapiMe: true,
      existingCfapHousehold: true,
      existingCfapMe: true,
      existingFeraHousehold: true,
      existingFeraMe: true,
      existingGaHousehold: true,
      existingGaMe: true,
      existingIhssHousehold: true,
      existingIhssMe: true,
      existingLifelineHousehold: true,
      existingLifelineMe: true,
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
      existingVaDisabilityHousehold: true,
      existingVaDisabilityMe: true,
      existingVaPensionHousehold: true,
      existingVaPensionMe: true,
      existingVtaParatransitHousehold: true,
      existingVtaParatransitMe: true,
      existingWicHousehold: true,
      existingWicMe: true,
      existingPhaHousehold: true,
      existingPhaMe: true,
      existingSchipMe: true,
      existingSchipHousehold: true,
      existingRtcClipperHousehold: true,
      existingRtcClipperMe: true,
    };
    Object.preventExtensions(expected);

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
    document.getElementById('hh-member-age-1').value = (
      expected.householdAges[0]);
    document.getElementById('hh-member-age-2').value = (
      expected.householdAges[1]);
    expect(getInput().householdAges).toEqual(expected.householdAges);

    document.getElementById('hh-member-disabled-1').checked = (
      expected.householdDisabled[0]);
    document.getElementById('hh-member-disabled-2').checked = (
      expected.householdDisabled[1]);
    expect(getInput().householdDisabled).toEqual(expected.householdDisabled);

    document.getElementById('hh-member-pregnant-1').checked = (
      expected.householdPregnant[0]);
    document.getElementById('hh-member-pregnant-2').checked = (
      expected.householdPregnant[1]);
    expect(getInput().householdPregnant).toEqual(expected.householdPregnant);

    document.getElementById('hh-member-breastfeeding-1').checked = (
      expected.householdFeeding[0]);
    document.getElementById('hh-member-breastfeeding-2').checked = (
      expected.householdFeeding[1]);
    expect(getInput().householdFeeding).toEqual(expected.householdFeeding);

    document.getElementById('hh-member-spouse-1').checked = (
      expected.householdSpouse[0]);
    document.getElementById('hh-member-spouse-2').checked = (
      expected.householdSpouse[1]);
    expect(getInput().householdSpouse).toEqual(expected.householdSpouse);

    document.getElementById('hh-member-dependent-1').checked = (
      expected.householdDependents[0]);
    document.getElementById('hh-member-dependent-2').checked = (
      expected.householdDependents[1]);
    expect(getInput().householdDependents).toEqual(
      expected.householdDependents);

    document.getElementById('unborn-children').value = expected.unbornChildren;
    expect(getInput().unbornChildren).toBe(expected.unbornChildren);

    document.getElementById(expected.housingSituation).checked = true;
    expect(getInput().housingSituation).toBe(expected.housingSituation);

    setYesNo('pay-utilities', expected.paysUtilities);
    expect(getInput().paysUtilities).toBe(expected.paysUtilities);

    document.getElementById('has-kitchen-yes').checked = expected.hasKitchen;
    expect(getInput().hasKitchen).toBe(expected.hasKitchen);

    document.getElementById(expected.immigrationStatus).checked = true;
    expect(getInput().immigrationStatus).toBe(expected.immigrationStatus);

    setYesNo('use-guide-dog', expected.usesGuideDog);
    expect(getInput().usesGuideDog).toBe(expected.usesGuideDog);

    setYesNo('dis-military', expected.militaryDisabled);
    expect(getInput().militaryDisabled).toBe(expected.militaryDisabled);

    document.getElementById('your-discharge-status').value = (
      expected.dischargeStatus);
    expect(getInput().dischargeStatus).toBe(expected.dischargeStatus);

    document.getElementById('full-dur-yes').checked = (
      expected.servedFullDuration);
    expect(getInput().servedFullDuration).toBe(expected.servedFullDuration);

    document.querySelector('#page-veteran-details .field_list_add').click();
    document.getElementById('your-duty-type').value = (
      expected.dutyPeriods[0].type);
    document.getElementById('served-from-year').value = '1960';
    document.getElementById('served-from-month').value = '01';
    document.getElementById('served-from-day').value = '25';
    document.getElementById('served-until-year').value = '1961';
    document.getElementById('served-until-month').value = '12';
    document.getElementById('served-until-day').value = '31';
    document.getElementById('your-duty-type-1').value = (
      expected.dutyPeriods[1].type);
    document.getElementById('served-from-year-1').value = '';
    document.getElementById('served-from-month-1').value = '';
    document.getElementById('served-from-day-1').value = '';
    document.getElementById('served-until-year-1').value = '';
    document.getElementById('served-until-month-1').value = '';
    document.getElementById('served-until-day-1').value = '';
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

    addAssets(expected.assets.values);
    expect(getInput().assets).toEqual(expected.assets);

    setYesNo('ss-taxes', expected.paidSsTaxes);
    expect(getInput().paidSsTaxes).toBe(expected.paidSsTaxes);

    document.getElementById('income-disability-is-ssi-capi-0').checked = true;
    document.getElementById(
      'income-disability-is-ssi-capi-member1-0').checked = true;
    expect(getInput().ssiIncome).toEqual(expected.ssiIncome);

    document.getElementById('existing-adsa-household').checked = (
      expected.existingAdsaHousehold);
    expect(getInput().existingAdsaHousehold).toBe(
      expected.existingAdsaHousehold);

    document.getElementById('existing-adsa-me').checked = (
      expected.existingAdsaMe);
    expect(getInput().existingAdsaMe).toBe(expected.existingAdsaMe);

    document.getElementById('existing-calfresh-household').checked = (
      expected.existingCalfreshHousehold);
    expect(getInput().existingCalfreshHousehold).toBe(
      expected.existingCalfreshHousehold);

    document.getElementById('existing-calfresh-me').checked = (
      expected.existingCalfreshMe);
    expect(getInput().existingCalfreshMe).toBe(expected.existingCalfreshMe);

    document.getElementById('existing-calworks-household').checked = (
      expected.existingCalworksHousehold);
    expect(getInput().existingCalworksHousehold).toBe(
      expected.existingCalworksHousehold);

    document.getElementById('existing-calworks-me').checked = (
      expected.existingCalworksMe);
    expect(getInput().existingCalworksMe).toBe(expected.existingCalworksMe);

    document.getElementById('existing-capi-household').checked = (
      expected.existingCapiHousehold);
    expect(getInput().existingCapiHousehold).toBe(
      expected.existingCapiHousehold);

    document.getElementById('existing-capi-me').checked = (
      expected.existingCapiMe);
    expect(getInput().existingCapiMe).toBe(expected.existingCapiMe);

    document.getElementById('existing-care-household').checked = (
      expected.existingCareHousehold);
    expect(getInput().existingCareHousehold).toBe(
      expected.existingCareHousehold);

    document.getElementById('existing-care-me').checked = (
      expected.existingCareMe);
    expect(getInput().existingCareMe).toBe(expected.existingCareMe);

    document.getElementById('existing-cfap-household').checked = (
      expected.existingCfapHousehold);
    expect(getInput().existingCfapHousehold).toBe(
      expected.existingCfapHousehold);

    document.getElementById('existing-cfap-me').checked = (
      expected.existingCfapMe);
    expect(getInput().existingCfapMe).toBe(expected.existingCfapMe);

    document.getElementById('existing-fera-household').checked = (
      expected.existingFeraHousehold);
    expect(getInput().existingFeraHousehold).toBe(
      expected.existingFeraHousehold);

    document.getElementById('existing-fera-me').checked = (
      expected.existingFeraMe);
    expect(getInput().existingFeraMe).toBe(expected.existingFeraMe);

    document.getElementById('existing-ga-household').checked = (
      expected.existingGaHousehold);
    expect(getInput().existingGaHousehold).toBe(expected.existingGaHousehold);

    document.getElementById('existing-ga-me').checked = expected.existingGaMe;
    expect(getInput().existingGaMe).toBe(expected.existingGaMe);

    document.getElementById('existing-ihss-household').checked = (
      expected.existingIhssHousehold);
    expect(getInput().existingIhssHousehold).toBe(
      expected.existingIhssHousehold);

    document.getElementById('existing-ihss-me').checked = (
      expected.existingIhssMe);
    expect(getInput().existingIhssMe).toBe(expected.existingIhssMe);

    document.getElementById('existing-lifeline-household').checked = (
      expected.existingLifelineHousehold);
    expect(getInput().existingLifelineHousehold).toBe(
      expected.existingLifelineHousehold);

    document.getElementById('existing-lifeline-me').checked = (
      expected.existingLifelineMe);
    expect(getInput().existingLifelineMe).toBe(expected.existingLifelineMe);

    document.getElementById('existing-liheap-household').checked = (
      expected.existingLiheapHousehold);
    expect(getInput().existingLiheapHousehold).toBe(
      expected.existingLiheapHousehold);

    document.getElementById('existing-liheap-me').checked = (
      expected.existingLiheapMe);
    expect(getInput().existingLiheapMe).toBe(expected.existingLiheapMe);

    document.getElementById('existing-medical-household').checked = (
      expected.existingMedicalHousehold);
    expect(getInput().existingMedicalHousehold).toBe(
      expected.existingMedicalHousehold);

    document.getElementById('existing-medical-me').checked = (
      expected.existingMedicalMe);
    expect(getInput().existingMedicalMe).toBe(expected.existingMedicalMe);

    document.getElementById('existing-nslp-household').checked = (
      expected.existingNslpHousehold);
    expect(getInput().existingNslpHousehold).toBe(
      expected.existingNslpHousehold);

    document.getElementById('existing-nslp-me').checked = (
      expected.existingNslpMe);
    expect(getInput().existingNslpMe).toBe(expected.existingNslpMe);

    document.getElementById('existing-ssdi-household').checked = (
      expected.existingSsdiHousehold);
    expect(getInput().existingSsdiHousehold).toBe(
      expected.existingSsdiHousehold);

    document.getElementById('existing-ssdi-me').checked = (
      expected.existingSsdiMe);
    expect(getInput().existingSsdiMe).toBe(expected.existingSsdiMe);

    document.getElementById('existing-ssi-household').checked = (
      expected.existingSsiHousehold);
    expect(getInput().existingSsiHousehold).toBe(expected.existingSsiHousehold);

    document.getElementById('existing-ssi-me').checked = expected.existingSsiMe;
    expect(getInput().existingSsiMe).toBe(expected.existingSsiMe);

    document.getElementById('existing-va-disability-household').checked = (
      expected.existingVaDisabilityHousehold);
    expect(getInput().existingVaDisabilityHousehold).toBe(
      expected.existingVaDisabilityHousehold);

    document.getElementById('existing-va-disability-me').checked = (
      expected.existingVaDisabilityMe);
    expect(getInput().existingVaDisabilityMe)
      .toBe(expected.existingVaDisabilityMe);

    document.getElementById('existing-va-pension-household').checked = (
      expected.existingVaPensionHousehold);
    expect(getInput().existingVaPensionHousehold).toBe(
      expected.existingVaPensionHousehold);

    document.getElementById('existing-va-pension-me').checked = (
      expected.existingVaPensionMe);
    expect(getInput().existingVaPensionMe).toBe(expected.existingVaPensionMe);

    document.getElementById('existing-vta-paratransit-household').checked = (
      expected.existingVtaParatransitHousehold);
    expect(getInput().existingVtaParatransitHousehold).toBe(
      expected.existingVtaParatransitHousehold);

    document.getElementById('existing-vta-paratransit-me').checked = (
      expected.existingVtaParatransitMe);
    expect(getInput().existingVtaParatransitMe)
      .toBe(expected.existingVtaParatransitMe);

    document.getElementById('existing-wic-household').checked = (
      expected.existingWicHousehold);
    expect(getInput().existingWicHousehold).toBe(expected.existingWicHousehold);

    document.getElementById('existing-wic-me').checked = expected.existingWicMe;
    expect(getInput().existingWicMe).toBe(expected.existingWicMe);

    document.getElementById('existing-pha-me').checked = expected.existingPhaMe;
    expect(getInput().existingPhaMe).toBe(expected.existingPhaMe);

    document.getElementById('existing-pha-household').checked = (
      expected.existingPhaHousehold);
    expect(getInput().existingPhaHousehold).toBe(expected.existingPhaHousehold);

    document.getElementById('existing-schip-me').checked = (
      expected.existingSchipMe);
    expect(getInput().existingSchipMe).toBe(expected.existingSchipMe);

    document.getElementById('existing-schip-household').checked = (
      expected.existingSchipHousehold);
    expect(getInput().existingSchipHousehold).toBe(
      expected.existingSchipHousehold);

    document.getElementById('existing-rtc-clipper-me').checked = (
      expected.existingRtcClipperMe);
    expect(getInput().existingRtcClipperMe).toBe(expected.existingRtcClipperMe);

    document.getElementById('existing-rtc-clipper-household').checked = (
      expected.existingRtcClipperHousehold);
    expect(getInput().existingSchipHousehold).toBe(
      expected.existingRtcClipperHousehold);

    expect(getInput()).toEqual(expected);
  });
});
