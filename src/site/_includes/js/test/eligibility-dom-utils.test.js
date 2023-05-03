/**
 * @jest-environment jsdom
 */

const elig = require('../eligibility');

beforeEach(() => {
  document.body.innerHTML = '';
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
    ['checkbox', 'radio']
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
          <input type="radio" id="test-question-yes" name="test-question" value="yes">
        </li>
        <li>
          <input type="radio" id="test-question-no" name="test-question" value="no">
        </li>
      </ul>`;

    const testId = 'test-question';
    expect(elig.getValueOrNull(testId)).toBe(null);
    document.getElementById(`${testId}-yes`).checked = true;
    expect(elig.getValueOrNull(testId)).toBe(true);
    document.getElementById(`${testId}-no`).checked = true;
    expect(elig.getValueOrNull(testId)).toBe(false);
  });
});