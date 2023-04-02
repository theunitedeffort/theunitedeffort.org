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
  let input;

  function deepCopy(original) {
    return JSON.parse(JSON.stringify(original));
  }

  function makeCapiEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.notCitizen = true;
    modified.immigrationStatus = 'prucol';
    modified.age = 99;
    modified.income.valid = true;
    return modified;
  }

  function makeIhssEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 99;
    modified.housingSituation = 'housed';
    modified.existingMedicalMe = true;
    return modified;
  }

  function makeSsiEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 99;
    modified.income.valid = true;
    return modified;
  }

  beforeEach(() => {
    input = {
      age: null,
      notCitizen: false,
      disabled: false,
      blind: false,
      deaf: false,
      veteran: false,
      pregnant: false,
      feeding: false,
      headOfHousehold: false,
      householdAges: [],
      householdDisabled: [],
      householdPregnant: [],
      householdFeeding: [],
      householdSpouse: [],
      householdDependents: [],
      householdSize: 1,
      unbornChildren: null,
      housingSituation: null,
      paysUtilities: false,
      hasKitchen: false,
      homelessRisk: false,
      immigrationStatus: null,
      usesGuideDog: false,
      militaryDisabled: false,
      dischargeStatus: null,
      enlisted: false,
      officer: false,
      dutyPeriods: [],
      income: {
        valid: false,
        wages: [[]],
        selfEmployed: [[]],
        disability: [[]],
        unemployment: [[]],
        veterans: [[]],
        workersComp: [[]],
        childSupport: [[]],
        retirement: [[]],
        other: [[]],
      },
      assets: [[]],
      ssiIncome: [],
      existingSsiMe: false,
      existingSsiHousehold: false,
      existingSsdiMe: false,
      existingSsdiHousehold: false,
      existingCalworksMe: false,
      existingCalworksHousehold: false,
      existingCalfreshMe: false,
      existingCalfreshHousehold: false,
      existingCfapMe: false,
      existingCfapHousehold: false,
      existingMedicalMe: false,
      existingMedicalHousehold: false,
      existingIhssMe: false,
      existingIhssHousehold: false,
      existingCapiMe: false,
      existingCapiHousehold: false,
      existingLiheapMe: false,
      existingLiheapHousehold: false,
      existingWicMe: false,
      existingWicHousehold: false,
      existingNslpMe: false,
      existingNslpHousehold: false,
      existingGaMe: false,
      existingGaHousehold: false,
      existingVaPensionMe: false,
      existingVaPensionHousehold: false,
    };
  });

  describe('ADSA Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.adsaResult(input).eligible).toBe(false);
    });

    test('Eligible when disabled, blind, or deaf', () => {
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

      expect(elig.adsaResult(input).eligible).not.toBe(true);
      let mergedInput = makeSsiEligible(input);
      expect(elig.ssiResult(mergedInput).eligible).toBe(true);
      expect(elig.adsaResult(mergedInput).eligible).toBe(true);

      expect(elig.adsaResult(input).eligible).not.toBe(true);
      mergedInput = makeIhssEligible(input);
      expect(elig.ihssResult(mergedInput).eligible).toBe(true);
      expect(elig.adsaResult(mergedInput).eligible).toBe(true);

      expect(elig.adsaResult(input).eligible).not.toBe(true);
      mergedInput = makeCapiEligible(input);
      expect(elig.capiResult(mergedInput).eligible).toBe(true);
      expect(elig.adsaResult(mergedInput).eligible).toBe(true);
    });
  });

  describe('CAPI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      expect(elig.capiResult(makeCapiEligible(input)).eligible).toBe(true);
    });
  });

  describe('IHSS Program', () => {
    test('Eligible with input for other program dependencies', () => {
      expect(elig.ihssResult(makeIhssEligible(input)).eligible).toBe(true);
    });
  });

  describe('SSI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      expect(elig.ssiResult(makeSsiEligible(input)).eligible).toBe(true);
    });
  });
});