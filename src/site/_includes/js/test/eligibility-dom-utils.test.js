/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */

const elig = require('../eligibility');

beforeEach(() => {
  document.body.innerHTML = '';
});

test('Elements can be hidden or shown via class', () => {
  document.body.innerHTML = '<div id="testdiv" class="example"></div>';
  const elem = document.getElementById('testdiv');
  elig.setElementVisible(elem, false);
  expect(elem.className).toContain('hidden');
  elig.setElementVisible(elem, true);
  expect(elem.className).not.toContain('hidden');
  expect(() => elig.setElementVisible(document.getElementById('bogus')))
    .not.toThrow();
});

describe('modifyIds', () => {
  test('Modifies descendant elements with an id', () => {
    document.body.innerHTML = `
      <span id="parent">
        <div id="child-div"><span id="grandchild-span"></span></div>
        <input type="text" id="child-input">
      </span>`;
    const parent = document.getElementById('parent');
    elig.modifyIds(parent, '-v2');
    expect(parent.querySelector('div').id).toBe('child-div-v2');
    expect(parent.querySelector('span').id).toBe('grandchild-span-v2');
    expect(parent.querySelector('input').id).toBe('child-input-v2');
  });

  test('Does not modify elements with no id', () => {
    document.body.innerHTML = `
      <span id="parent">
        <p>Hello world</p>
      </span>`;
    const parent = document.getElementById('parent');
    elig.modifyIds(parent, '-v2');
    expect(parent.querySelector('p').id).toBe('');
  });

  test('Updates label elements to match modified inputs', () => {
    document.body.innerHTML = `
      <span id="parent">
        <input type="text" id="child">
        <label for="child">Label</label>
      </span>`;
    const parent = document.getElementById('parent');
    elig.modifyIds(parent, '-v2');
    expect(parent.querySelector('input').id).toBe('child-v2');
    expect(
      parent.querySelector('label').getAttribute('for')).toBe('child-v2');
  });

  test('Modifies name attributes in descendant elements', () => {
    document.body.innerHTML = `
      <span id="parent">
        <input type="radio" id="child" name="button-group">
        <input type="radio" id="child2" name="button-group">
      </span>`;
    const parent = document.getElementById('parent');
    elig.modifyIds(parent, '-v2');
    const inputs = parent.querySelectorAll('input');
    expect(inputs[0].name).toBe('button-group-v2');
    expect(inputs[1].name).toBe('button-group-v2');
  });
});

describe('clearInputs', () => {
  test('Clears all descendant inputs', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="text" id="input1" value="one">
        <input type="number" id="input2" value="2">
        <div>
          <input type="checkbox" id="input3" checked>
          <div>
            <input type="radio" id="input4" checked>
          </div>
        </div>
      </div>`;
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    const input3 = document.getElementById('input3');
    const input4 = document.getElementById('input4');
    expect(input1.value).toBe('one');
    expect(input2.value).toBe('2');
    expect(input3.checked).toBe(true);
    expect(input4.checked).toBe(true);
    elig.clearInputs(document.getElementById('parent'));
    expect(input1.value).toBe('');
    expect(input2.value).toBe('');
    expect(input3.checked).toBe(false);
    expect(input4.checked).toBe(false);
  });

  test('Clears all descendant selects', () => {
    document.body.innerHTML = `
      <div id="parent">
        <select id="input1">
          <option value="">None</option>
          <option value="A">A</option>
          <option value="B" selected>B</option>
        </select>
        <div>
          <select id="input2">
            <option value="">None</option>
            <option value="1" selected>1</option>
            <option value="2">2</option>
          </select>
        </div>
      </div>`;
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    expect(input1.value).toBe('B');
    expect(input2.value).toBe('1');
    elig.clearInputs(document.getElementById('parent'));
    expect(input1.value).toBe('');
    expect(input2.value).toBe('');
    expect(input1.querySelectorAll('option')[0].selected).toBe(true);
    expect(input2.querySelectorAll('option')[0].selected).toBe(true);
  });

  test('Does not clear button values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="button" id="input1" value="Click Here">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('Click Here');
  });

  test('Does not clear reset values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="reset" id="input1" value="Reset Me">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('Reset Me');
  });

  test('Does not clear submit values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="submit" id="input1" value="Submit NOW!">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('Submit NOW!');
  });

  test('Does not clear hidden values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="hidden" id="input1" value="Invisible">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('Invisible');
  });

  test('Does not clear radio values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="radio" id="input1" value="AM/FM">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('AM/FM');
  });

  test('Does not clear checkbox values', () => {
    document.body.innerHTML = `
      <div id="parent">
        <input type="checkbox" id="input1" value="DONE">
      </div>`;
    elig.clearInputs(document.getElementById('parent'));
    expect(document.getElementById('input1').value).toBe('DONE');
  });
});

describe('getValueOrNull', () => {
  test('Gets the value of an input field', () => {
    document.body.innerHTML = `
      <input type="text" id="test-text">
      <input type="text" id="test-number">`;

    let testId = 'test-text';
    let expectedVal = 'baz';
    expect(elig.getValueOrNull(testId)).toBe(null);
    document.getElementById(testId).value = expectedVal;
    expect(elig.getValueOrNull(testId)).toBe(expectedVal);
    document.getElementById(testId).value = '';
    expect(elig.getValueOrNull(testId)).toBe(null);

    testId = 'test-number';
    expectedVal = 314159;
    expect(elig.getValueOrNull(testId)).toBe(null);
    document.getElementById(testId).value = expectedVal;
    expect(elig.getValueOrNull(testId)).toBe(expectedVal.toString());
  });

  test.each(
    ['checkbox', 'radio'],
  )('Gets the value of a %s element', (type) => {
    document.body.innerHTML = `
      <input type="${type}" id="test-${type}">`;

    const testId = `test-${type}`;
    expect(elig.getValueOrNull(testId)).toBe(false);
    document.getElementById(testId).checked = true;
    expect(elig.getValueOrNull(testId)).toBe(true);
  });

  test('Gets the value of a singleselect list', () => {
    document.body.innerHTML = `
      <ul id="test-singleselect" class="singleselect">
        <li>
          <input type="radio" id="option1" name="test-singleselect">
        </li>
        <li>
          <input type="radio" id="option2" name="test-singleselect">
        </li>
      </ul>`;

    const testId = 'test-singleselect';
    expect(elig.getValueOrNull(testId)).toBe(null);
    document.getElementById('option1').checked = true;
    expect(elig.getValueOrNull(testId)).toBe('option1');
    document.getElementById('option2').checked = true;
    expect(elig.getValueOrNull(testId)).toBe('option2');
  });

  test('Gets the value of a yes-no list', () => {
    document.body.innerHTML = `
      <ul id="test-question" class="yes-no">
        <li>
          <input type="radio" id="test-question-yes" name="test-question">
        </li>
        <li>
          <input type="radio" id="test-question-no" name="test-question">
        </li>
      </ul>`;

    const testId = 'test-question';
    expect(elig.getValueOrNull(testId)).toBe(null);
    document.getElementById(`${testId}-yes`).checked = true;
    expect(elig.getValueOrNull(testId)).toBe(true);
    document.getElementById(`${testId}-no`).checked = true;
    expect(elig.getValueOrNull(testId)).toBe(false);
  });

  test('Returns null for unsupported elements', () => {
    document.body.innerHTML = `
      <ul id="test-ul" class="unsupported">
        <li>A</li>
        <li>B</li>
      </ul>
      <ul id="bad-question" class="yes-no">
        <li>
          <input type="radio" id="bad-question-oui" name="bad-question">
        </li>
        <li>
          <input type="radio" id="bad-question-non" name="bad-question">
        </li>
      </ul>`;

    expect(elig.getValueOrNull('test-ul')).toBe(null);
    expect(elig.getValueOrNull('bad-question')).toBe(null);
    document.getElementById(`bad-question-oui`).checked = true;
    expect(elig.getValueOrNull('bad-question')).toBe(null);
    document.getElementById(`bad-question-non`).checked = true;
    expect(elig.getValueOrNull('bad-question')).toBe(null);
  });
});

describe('sortByProgramName', () => {
  test('Sorts alphabetically regardless of case', () => {
    document.body.innerHTML = `
      <ul id="list">
        <li><h4>Banana</h4></li>
        <li><h4>zucchini</h4></li>
        <li><h4>apple</h4></li>
        <li><h4>Banana</h4></li>
      </ul>`;
    elig.sortByProgramName(document.getElementById('list'));
    const listItems = document.querySelectorAll('#list > li');
    expect(Array.from(listItems, (i) => i.textContent)).toEqual([
      'apple',
      'Banana',
      'Banana',
      'zucchini',
    ]);
  });

  test('Handles empty lists', () => {
    document.body.innerHTML = `
      <ul id="list">
      </ul>`;
    elig.sortByProgramName(document.getElementById('list'));
    const listItems = document.querySelectorAll('#list > li');
    expect(listItems.length).toBe(0);
  });

  test('Does not modify singleton lists', () => {
    document.body.innerHTML = `
      <ul id="list">
        <li><h4>the cheese</h4></li>
      </ul>`;
    elig.sortByProgramName(document.getElementById('list'));
    const listItems = document.querySelectorAll('#list > li');
    expect(Array.from(listItems, (i) => i.textContent)).toEqual([
      'the cheese',
    ]);
  });
});

describe('renderFlags', () => {
  const expectedStrs = {};
  beforeEach(() => {
    expectedStrs[elig.FlagCodes.MORE_INFO_NEEDED] = 'need more information';
    expectedStrs[elig.FlagCodes.COMPLEX_IMMIGRATION] = (
      'immigrant eligibility rules');
    expectedStrs[elig.FlagCodes.COMPLEX_RETIREMENT_AGE] = 'full retirement age';
  });

  test.each(Object.values(elig.FlagCodes))('Renders %s flag', (flag) => {
    document.body.innerHTML = `
      <ul id="flag-list">
      </ul>`;
    elig.renderFlags([flag], document.getElementById('flag-list'));
    const listItems = document.querySelectorAll('#flag-list > li');
    const expectedSubstr = expectedStrs[flag] || '';
    if (expectedSubstr === '') {
      expect(listItems.length).toBe(0);
    } else {
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain(expectedSubstr);
    }
  });

  test('Renders multiple flags', () => {
    document.body.innerHTML = `
      <ul id="flag-list">
      </ul>`;
    elig.renderFlags([
      elig.FlagCodes.COMPLEX_IMMIGRATION,
      elig.FlagCodes.COMPLEX_RETIREMENT_AGE,
    ], document.getElementById('flag-list'));
    const listItems = document.querySelectorAll('#flag-list > li');
    expect(listItems.length).toBe(2);
  });
});

describe('addConditionIcon', () => {
  test.each([
    {
      met: true,
      displayMet: true,
      displayUnmet: true,
      displayUnk: true,
      expected: 'condition condition__met',
    },
    {
      met: true,
      displayMet: false,
      displayUnmet: true,
      displayUnk: true,
      expected: 'condition ',
    },
    {
      met: false,
      displayMet: true,
      displayUnmet: true,
      displayUnk: true,
      expected: 'condition condition__unmet',
    },
    {
      met: false,
      displayMet: true,
      displayUnmet: false,
      displayUnk: true,
      expected: 'condition ',
    },
    {
      met: null,
      displayMet: true,
      displayUnmet: true,
      displayUnk: true,
      expected: 'condition condition__unk',
    },
    {
      met: null,
      displayMet: true,
      displayUnmet: true,
      displayUnk: false,
      expected: 'condition ',
    },
  ])('Displays icon for $met condition with displayMet=$displayMet, displayUnmet=$displayUnmet, displayUnk=$displayUnk',
    ({met, displayMet, displayUnmet, displayUnk, expected}) => {
      document.body.innerHTML = `
        <ul>
          <li id="item">Example</li>
        </ul>`;
      const item = document.getElementById('item');
      elig.addConditionIcon(item, met, {
        displayMet: displayMet,
        displayUnmet: displayUnmet,
        displayUnk: displayUnk,
      });
      expect(item.className).toBe(expected);
    });
});

describe('renderConditions', () => {
  test('Renders a list of AND conditions', () => {
    document.body.innerHTML = `
      <ul id="cond-list">
      </ul>`;
    const conditions = [
      new elig.EligCondition('condition 1', true),
      new elig.EligCondition('condition 2', null),
      new elig.EligCondition('condition 3', false),
    ];
    elig.renderConditions(conditions, document.getElementById('cond-list'));
    const listItems = document.querySelectorAll('#cond-list > li');
    expect(Array.from(listItems, (i) => i.textContent)).toEqual([
      'condition 1',
      'condition 2',
      'condition 3',
    ]);
    expect(Array.from(listItems, (i) => i.className)).toEqual([
      'condition condition__met',
      'condition condition__unk',
      'condition condition__unmet',
    ]);
  });

  test.each([
    {
      met: [true, true],
      classes: ['condition condition__met', 'condition condition__met'],
      overallClass: 'condition condition__met',
    },
    {
      met: [false, true],
      // The individual failing condition should not render as condition__unmet
      // when the overall grouping is met.
      classes: ['condition ', 'condition condition__met'],
      overallClass: 'condition condition__met',
    },
    {
      met: [null, true],
      // The individual failing condition should not render as condition__unmet
      // when the overall grouping is met.
      classes: ['condition ', 'condition condition__met'],
      overallClass: 'condition condition__met',
    },
    {
      met: [false, false],
      classes: ['condition condition__unmet', 'condition condition__unmet'],
      overallClass: 'condition condition__unmet',
    },
    {
      met: [null, null],
      classes: ['condition condition__unk', 'condition condition__unk'],
      overallClass: 'condition condition__unk',
    },
  ])('Renders a list of OR conditions with values $met',
    ({met, classes, overallClass}) => {
      document.body.innerHTML = `
        <ul id="cond-list">
        </ul>`;
      const conditions = [
        new elig.EligCondition('condition 1', true),
        [
          new elig.EligCondition('condition 2', met[0]),
          new elig.EligCondition('condition 3', met[1]),
        ],
      ];
      elig.renderConditions(conditions, document.getElementById('cond-list'));
      const topListItems = document.querySelectorAll('#cond-list > li');
      expect(Array.from(topListItems, (i) => i.textContent)).toEqual([
        'condition 1',
        'Either:',
      ]);
      expect(Array.from(topListItems, (i) => i.className)).toEqual([
        'condition condition__met',
        overallClass,
      ]);
      const nestListItems = document.querySelectorAll('#cond-list > ul > li');
      expect(Array.from(nestListItems, (i) => i.textContent)).toEqual([
        'condition 2\xa0or',
        'condition 3',
      ]);
      expect(Array.from(nestListItems, (i) => i.className)).toEqual(classes);
    });
});

describe('showResultText', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test">
        <p id="shown-for-results" class="has_results">There are results</p>
        <p id="hidden-for-results" class="no_results">No results found</p>
      </div>`;
  });

  test('Shows only text for results when results are present', () => {
    elig.showResultText(document.getElementById('test'), true);
    expect(document.getElementById('shown-for-results').classList)
      .not.toContain('hidden');
    expect(document.getElementById('hidden-for-results').classList)
      .toContain('hidden');
  });

  test('Shows only text for no results when results are not present', () => {
    elig.showResultText(document.getElementById('test'), false);
    expect(document.getElementById('shown-for-results').classList)
      .toContain('hidden');
    expect(document.getElementById('hidden-for-results').classList)
      .not.toContain('hidden');
  });
});

describe('renderResultsSummaryFooter', () => {
  let footer;
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="footer">
      </div>`;
    footer = document.getElementById('footer');
  });

  test('Old contents get cleared', () => {
    footer.appendChild(document.createTextNode('remove me'));
    const paragraph = document.createElement('p');
    paragraph.textContent = 'goodbye';
    footer.appendChild(paragraph);
    expect(footer.textContent).toContain('remove me');
    expect(footer.textContent).toContain('goodbye');
    elig.renderResultsSummaryFooter(footer, 0, 0, 0);
    expect(footer.textContent).not.toContain('remove me');
    expect(footer.textContent).not.toContain('goodbye');
  });

  test.each([
    {
      numUnknown: 4,
      numIneligible: 0,
      numEnrolled: 0,
      expected: (
        'We need additional information from you to assess 4 programs. '),
    },
    {
      numUnknown: 1,
      numIneligible: 0,
      numEnrolled: 0,
      expected: 'We need additional information from you to assess 1 program. ',
    },
    {
      numUnknown: 0,
      numIneligible: 5,
      numEnrolled: 0,
      expected: 'There are also 5 programs you likely do not qualify for. ',
    },
    {
      numUnknown: 0,
      numIneligible: 1,
      numEnrolled: 0,
      expected: 'There is also 1 program you likely do not qualify for. ',
    },
    {
      numUnknown: 0,
      numIneligible: 0,
      numEnrolled: 3,
      expected: 'There are also 3 programs you\'re already enrolled in. ',
    },
    {
      numUnknown: 0,
      numIneligible: 0,
      numEnrolled: 1,
      expected: 'There is also 1 program you\'re already enrolled in. ',
    },
    {
      numUnknown: 0,
      numIneligible: 2,
      numEnrolled: 1,
      expected: (
        'There are also 2 programs you likely do not qualify for and ' +
        '1 program you\'re already enrolled in. '),
    },
    {
      numUnknown: 0,
      numIneligible: 1,
      numEnrolled: 9,
      expected: (
        'There is also 1 program you likely do not qualify for and ' +
        '9 programs you\'re already enrolled in. '),
    },
    {
      numUnknown: 0,
      numIneligible: 1,
      numEnrolled: 1,
      expected: (
        'There is also 1 program you likely do not qualify for and ' +
        '1 program you\'re already enrolled in. '),
    },
    {
      numUnknown: 0,
      numIneligible: 7,
      numEnrolled: 9,
      expected: (
        'There are also 7 programs you likely do not qualify for and ' +
        '9 programs you\'re already enrolled in. '),
    },
    {
      numUnknown: 3,
      numIneligible: 7,
      numEnrolled: 9,
      expected: (
        'We need additional information from you to assess 3 programs. ' +
        'There are also 7 programs you likely do not qualify for and ' +
        '9 programs you\'re already enrolled in. '),
    },
  ])('Text renders correctly for numUnknown=$numUnknown, numIneligible=$numIneligible, numEnrolled=$numEnrolled',
    ({numUnknown, numIneligible, numEnrolled, expected}) => {
      elig.renderResultsSummaryFooter(footer, numUnknown, numIneligible,
        numEnrolled);
      expect(footer.textContent).toEqual(expected);
    });
});
