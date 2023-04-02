const elig = require('../eligibility');

function isEligibleIf(target) {
  this.target = target;
  this.expected = true;
  return this;
};

function isIneligibleIf(target) {
  this.target = target;
  this.expected = false;
  return this;
};

function returns(value) {
  const msg = (
    `Checking ${this.program.name} with ` +
    `${this.target.getMockName()} returning ${JSON.stringify(value)}`
  );
  expect(this.program(this.input).eligible, msg).not.toBe(this.expected);
  this.target.mockReturnValueOnce(value);
  expect(this.program(this.input).eligible, msg).toBe(this.expected);
};

function is(value) {
  const caller = this;
  function msg(whichStr) {
    return (
      `Checking ${caller.program.name} with ${whichStr} value of ` +
      `${caller.target}: ${caller.input[caller.target]})`
    );
  }
  const initValue = this.input[this.target];
  expect(this.program(this.input).eligible, msg('initial')).not.toBe(this.expected);
  this.input[this.target] = value;
  expect(this.program(this.input).eligible, msg('modified')).toBe(this.expected);
  this.input[this.target] = initValue;
};

function check(program, input) {
  return {
    program,
    input,
    isEligibleIf,
    isIneligibleIf,
    is,
    returns,
  };
};

describe('MonthlyIncomeLimit', () => {
  let monthlyValues;
  let annualValues;
  beforeEach(() => {
    monthlyValues = [
      100,
      200,
      300,
    ];
    annualValues = [
      12000,
      24000,
      36000,
    ];
  });

  test('Computes limit from static list', () => {
    const limits = new elig.MonthlyIncomeLimit(monthlyValues, 1);
    expect(limits.getLimit(1)).toBe(100);
    expect(limits.getLimit(2)).toBe(200);
    expect(limits.getLimit(3)).toBe(300);
  });

  test('Computes limit outside provided household size range', () => {
    const limits = new elig.MonthlyIncomeLimit(monthlyValues, 1);
    expect(limits.getLimit(4)).toBe(301);
    expect(limits.getLimit(6)).toBe(303);
  });

  test('Computes limit outside household size range with custom function', () => {
    const limits = new elig.MonthlyIncomeLimit(monthlyValues,
      (numExtraPeople) => 10 + numExtraPeople);
    expect(limits.getLimit(4)).toBe(311);
    expect(limits.getLimit(6)).toBe(313);
  });

  test('Computes monthly limit from provided annual limits', () => {
    const limits = elig.MonthlyIncomeLimit.fromAnnual(annualValues, 12);
    expect(limits.getLimit(1)).toBe(1000);
    expect(limits.getLimit(2)).toBe(2000);
    expect(limits.getLimit(3)).toBe(3000);
  });

  test('Computes monthly limit from annual limits outside provided household size range', () => {
    const limits = elig.MonthlyIncomeLimit.fromAnnual(annualValues, 12);
    expect(limits.getLimit(4)).toBe(3001);
    expect(limits.getLimit(6)).toBe(3003);
  });

  test('Computes monthly limit from annual limits outside provided household size range with custom fuction', () => {
    const limits = elig.MonthlyIncomeLimit.fromAnnual(annualValues,
      (numExtraPeople) => 12 * 2 * numExtraPeople);
    expect(limits.getLimit(4)).toBe(3002);
    expect(limits.getLimit(6)).toBe(3006);
  });
});

describe('Program eligibility', () => {
  let eligible;
  beforeEach(() => {
    eligible = {eligible: true};
  });

  describe('ADSA Program', () => {
    let input;
    let mockSsiResult;
    let mockSsdiResult;
    let mockIhssResult;
    let mockCapiResult;
    beforeEach(() => {
      input = {
        disabled: false,
        blind: false,
        deaf: false,
        usesGuideDog: false,
        existingSsiMe: false,
        existingSsdiMe: false,
        existingIhssMe: false,
        existingCapiMe: false,
      };
      mockSsiResult = jest.spyOn(elig, 'ssiResult');
      mockSsdiResult = jest.spyOn(elig, 'ssdiResult');
      mockIhssResult = jest.spyOn(elig, 'ihssResult');
      mockCapiResult = jest.spyOn(elig, 'capiResult');
      mockSsiResult.mockName('mockSsiResult');
      mockSsdiResult.mockName('mockSsdiResult');
      mockIhssResult.mockName('mockIhssResult');
      mockCapiResult.mockName('mockCapiResult');
      mockSsiResult.mockReturnValue({eligible: false});
      mockSsdiResult.mockReturnValue({eligible: false});
      mockIhssResult.mockReturnValue({eligible: false});
      mockCapiResult.mockReturnValue({eligible: false});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('Not eligible with default input', () => {
      expect(elig.adsaResult(input).eligible).toBe(false);
    });

    test('Eligibile when disabled, blind, or deaf', () => {
      input.existingSsiMe = true;
      input.usesGuideDog = true;
      check(elig.adsaResult, input).isEligibleIf('disabled').is(true);
      check(elig.adsaResult, input).isEligibleIf('blind').is(true);
      check(elig.adsaResult, input).isEligibleIf('deaf').is(true);
    });

    test('Eligible when using a guide dog', () => {
      input.existingSsiMe = true;
      input.blind = true;
      check(elig.adsaResult, input).isEligibleIf('usesGuideDog').is(true);
    });

    test('Eligible with existing assistance', () => {
      input.blind = true;
      input.usesGuideDog = true;
      check(elig.adsaResult, input).isEligibleIf('existingSsiMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingSsdiMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingIhssMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingCapiMe').is(true);
      check(elig.adsaResult, input).isEligibleIf(mockSsiResult).returns(eligible);
      check(elig.adsaResult, input).isEligibleIf(mockSsdiResult).returns(eligible);
      check(elig.adsaResult, input).isEligibleIf(mockIhssResult).returns(eligible);
      check(elig.adsaResult, input).isEligibleIf(mockCapiResult).returns(eligible);
    });
  });
});