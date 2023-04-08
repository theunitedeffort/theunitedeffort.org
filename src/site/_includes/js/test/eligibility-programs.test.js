const elig = require('../eligibility');

function verifyOverlay(modifiedInput) {
  expect(modifiedInput._verifyFn(modifiedInput).eligible).toBe(true);
}

// Gets a value from the test input object via property name string.
// Nested properties are accepted for target, e.g. "input.wages"
function getValue(input, target) {
  let obj = input;
  const keys = target.split('.');
  for (const key of keys) {
    obj = obj[key];
  }
  return obj;
}

// Sets a value in the test input object via property name string.
// Nested properties are accepted for target, e.g. "input.wages"
function setValue(input, target, value) {
  let obj = input;
  const keys = target.split('.');
  for (let i = 0; i < keys.length; i++) {
    if (i == (keys.length - 1)) {
      obj[keys[i]] = value;
    } else {
      obj = obj[keys[i]];
    }
  }
}

function isEligibleIf(target) {
  this.target = target;
  this.expected = true;
  // Special handling for testing with input overlays.
  if (typeof this.target === 'function') {
    let mergedInput = this.target(this.input);
    const msg = (
      `Checking ${this.program.name} with ${mergedInput._verifyFn.name} returning ` +
      `eligible`
    );
    expect(this.program(this.input).eligible, msg).not.toBe(true);
    verifyOverlay(mergedInput);
    expect(this.program(mergedInput).eligible, msg).toBe(true);
    return;
  }
  return this;
}

function isNotEligibleIf(target) {
  this.target = target;
  this.expected = false;
  return this;
}

function msg(ctx, whichStr) {
  return (
      `Checking ${ctx.program.name} with ${whichStr} value of ` +
      `${ctx.target}: ${JSON.stringify(getValue(ctx.input, ctx.target))}\n` +
      `${ctx.program.name} returns:\n` +
      `${JSON.stringify(ctx.program(ctx.input), null, 2)}`
    );
}

function is(value) {
  const initValue = getValue(this.input, this.target);
  expect(this.program(this.input).eligible, msg(this, 'initial')).not.toBe(this.expected);
  setValue(this.input, this.target, value);
  expect(this.program(this.input).eligible, msg(this, 'modified')).toBe(this.expected);
  setValue(this.input, this.target, initValue);
};

function isAtLeast(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, value - 1);
  expect(this.program(this.input).eligible, msg(this, 'lower')).not.toBe(this.expected);
  setValue(this.input, this.target, value);
  expect(this.program(this.input).eligible, msg(this, 'given')).toBe(this.expected);
  setValue(this.input, this.target, value + 1);
  expect(this.program(this.input).eligible, msg(this, 'higher')).toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isAtMost(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, value + 1);
  expect(this.program(this.input).eligible, msg(this, 'higher')).not.toBe(this.expected);
  setValue(this.input, this.target, value);
  expect(this.program(this.input).eligible, msg(this, 'given')).toBe(this.expected);
  setValue(this.input, this.target, value - 1);
  expect(this.program(this.input).eligible, msg(this, 'lower')).toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isOver(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, value);
  expect(this.program(this.input).eligible, msg(this, 'given')).not.toBe(this.expected);
  setValue(this.input, this.target, value + 1);
  expect(this.program(this.input).eligible, msg(this, 'higher')).toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isUnder(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, value);
  expect(this.program(this.input).eligible, msg(this, 'given')).not.toBe(this.expected);
  setValue(this.input, this.target, value - 1);
  expect(this.program(this.input).eligible, msg(this, 'lower')).toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function check(program, input) {
  return {
    program,
    input,
    isEligibleIf,
    isNotEligibleIf,
    is,
    isAtLeast,
    isAtMost,
    isUnder,
    isOver,
  };
};

describe('Helper getValue', () => {
  test('Gets value of a property in a simple object', () => {
    const testObj = {firstName: 'Ada', lastName: 'Lovelace'};
    expect(getValue(testObj, 'firstName')).toBe('Ada');
    expect(getValue(testObj, 'lastName')).toBe('Lovelace');
  });

  test('Gets value of a nested property', () => {
    const testObj = {
      income: {
        valid: true,
        wages: [[200]],
        deeper: {
          val: 1
        }
      }
    };
    expect(getValue(testObj, 'income.valid')).toBe(true);
    expect(getValue(testObj, 'income.wages')).toEqual([[200]]);
    expect(getValue(testObj, 'income.deeper.val')).toBe(1);
  });
});

describe('Helper setValue', () => {
  test('Sets value of a property in a simple object', () => {
    const testObj = {firstName: 'Ada', lastName: 'Lovelace'};
    setValue(testObj, 'firstName', 'Fred');
    expect(testObj.firstName).toBe('Fred');
  });

  test('Sets value of a nested property', () => {
    const testObj = {
      income: {
        valid: true,
        wages: [[200]],
        deeper: {
          val: 1
        }
      }
    };
    setValue(testObj, 'income.wages', [[140]]);
    expect(testObj.income.wages).toEqual([[140]]);
    setValue(testObj, 'income.deeper.val', 42);
    expect(testObj.income.deeper.val).toBe(42);
  });
});


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

  function calfreshMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.income.valid = true;
    modified._verifyFn = elig.calfreshResult;
    return modified;
  }

  function calworksMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 20;
    modified.pregnant = true;
    modified.income.valid = true;
    modified._verifyFn = elig.calworksResult;
    return modified;
  }

  function capiMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.notCitizen = true;
    modified.immigrationStatus = 'prucol';
    modified.age = 99;
    modified.income.valid = true;
    modified._verifyFn = elig.capiResult;
    return modified;
  }

  function gaMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 99;
    modified.income.valid = true;
    modified._verifyFn = elig.gaResult;
    return modified;
  }

  function ihssMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 99;
    modified.housingSituation = 'housed';
    modified.existingMedicalMe = true;
    modified._verifyFn = elig.ihssResult;
    return modified;
  }

  function ssiMadeEligible(baseInput) {
    let modified = deepCopy(baseInput);
    modified.age = 99;
    modified.income.valid = true;
    modified._verifyFn = elig.ssiResult;
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

    test('Requires disability, blindness, or deafness', () => {
      input.existingSsiMe = true;
      input.usesGuideDog = true;
      check(elig.adsaResult, input).isEligibleIf('disabled').is(true);
      check(elig.adsaResult, input).isEligibleIf('blind').is(true);
      check(elig.adsaResult, input).isEligibleIf('deaf').is(true);
    });

    test('Requires use of a guide dog', () => {
      input.existingSsiMe = true;
      input.blind = true;
      check(elig.adsaResult, input).isEligibleIf('usesGuideDog').is(true);
    });

    test('Requires certain existing assistance', () => {
      input.blind = true;
      input.usesGuideDog = true;
      check(elig.adsaResult, input).isEligibleIf('existingSsiMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingSsdiMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingIhssMe').is(true);
      check(elig.adsaResult, input).isEligibleIf('existingCapiMe').is(true);

      check(elig.adsaResult, input).isEligibleIf(capiMadeEligible);
      check(elig.adsaResult, input).isEligibleIf(ihssMadeEligible);
      check(elig.adsaResult, input).isEligibleIf(ssiMadeEligible);
      // TODO: Add check for SSDI once ssdiResult() is implemented;
    });
  });

  describe('CalFresh Program', () => {
    let expectedIncomeLimit;
    beforeEach(() => {
      expectedIncomeLimit = (
        elig.cnst.calfresh.FED_POVERTY_LEVEL[0] *
        elig.cnst.calfresh.GROSS_INCOME_LIMIT_MCE_FACTOR);
    })
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(calfreshMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.calfreshResult(input).eligible).not.toBe(true);
    });

    test('Requires when U.S. citizenship or qualified immigration status', () => {
      input.income.valid = true;
      input.notCitizen = true;
      check(elig.calfreshResult, input)
        .isEligibleIf('immigrationStatus').is('permanent_resident');
      check(elig.calfreshResult, input)
        .isEligibleIf('immigrationStatus').is('qualified_noncitizen_gt5y');
      check(elig.calfreshResult, input)
        .isEligibleIf('notCitizen').is(false);
    });

    test('Eligible without waiting period when young qualified immigrant', () => {
      input.income.valid = true;
      input.notCitizen = true;
      input.immigrationStatus = 'qualified_noncitizen_le5y';
      check(elig.calfreshResult, input).isEligibleIf('age')
        .isUnder(elig.cnst.calfresh.SHORT_RESIDENCY_OK_BELOW_AGE);
    });

    test('Eligible without waiting period when blind/disabled and receiving assistance', () => {
      input.income.valid = true;
      input.notCitizen = true;
      input.immigrationStatus = 'qualified_noncitizen_le5y';
      input.existingSsiMe = true;
      check(elig.calfreshResult, input).isEligibleIf('blind').is(true);
      check(elig.calfreshResult, input).isEligibleIf('disabled').is(true);

      input.existingSsiMe = false;
      input.blind = true;
      check(elig.calfreshResult, input).isEligibleIf('existingSsiMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingSsdiMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingCapiMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingMedicalMe').is(true);
    });

    test('Eligible categorically when receiving CalWORKS or GA', () => {
      check(elig.calfreshResult, input).isEligibleIf('existingCalworksMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingCalworksHousehold').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingGaMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf('existingGaHousehold').is(true);

      check(elig.calfreshResult, input).isEligibleIf(calworksMadeEligible);
      check(elig.calfreshResult, input).isEligibleIf(gaMadeEligible);
    });

    // TODO: consider breaking adjusted gross income calculations out of their
    // respective program result functions for easier testing of this
    // potentially complex aspect of program eligibility.  (Across the board,
    // not just for CalFresh)
    test('Eligible when wage income is at or below modified categorically-eligible limit', () => {
      const testIncome = expectedIncomeLimit;
      input.income.valid = true;
      input.income.wages = [[testIncome + 1]];
      check(elig.calfreshResult, input)
        .isEligibleIf('income.wages').is([[testIncome]]);
      check(elig.calfreshResult, input)
        .isEligibleIf('income.wages').is([[testIncome - 1]]);
    });

    test('Eligible with higher self-employed income due to exemptions', () => {
      // Raise gross income above the income limit value.
      const testIncome = expectedIncomeLimit /
        (1 - elig.cnst.calfresh.SELF_EMPLOYED_EXEMPT_FRACTION);
      input.income.valid = true;
      // Adjusted income should be over the limit if all income is from wages.
      input.income.wages = [[testIncome]];
      expect(elig.calfreshResult(input).eligible).not.toBe(true);
      // Adjusted income should be ok when all income is from self-employment.
      input.income.wages = [[0]];
      input.income.selfEmployed = [[testIncome + 1]];
      check(elig.calfreshResult, input)
        .isEligibleIf('income.selfEmployed').is([[testIncome]]);
    });

    test('Unknown result for invalid income with no categorical eligibility', () => {
      input.income.valid = true;
      expect(elig.calfreshResult(input).eligible).toBe(true);
      input.income.valid = false;
      expect(elig.calfreshResult(input).eligible).toBe(null);
    });
  });

  describe('CalWORKS Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(calworksMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.calworksResult(input).eligible).not.toBe(true);
    });

    test('Requires U.S. citizenship or qualified immigration status', () => {
      input.income.valid = true;
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE - 1;
      input.pregnant = true;
      input.notCitizen = true;
      check(elig.calworksResult, input)
        .isEligibleIf('immigrationStatus').is('permanent_resident');
      check(elig.calworksResult, input)
        .isEligibleIf('immigrationStatus').is('qualified_noncitizen_gt5y');
      check(elig.calworksResult, input)
        .isEligibleIf('immigrationStatus').is('qualified_noncitizen_le5y');
      check(elig.calworksResult, input)
        .isEligibleIf('notCitizen').is(false);
    });

    test('Eligible when pregnant', () => {
      input.income.valid = true;
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE - 1;
      check(elig.calworksResult, input).isEligibleIf('pregnant').is(true);
    });

    test('Eligible when household contains a pregnant person', () => {
      input.income.valid = true;
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE - 1;
      input.householdSize = 2;
      input.householdPregnant = [false];
      check(elig.calworksResult, input)
        .isEligibleIf('householdPregnant').is([true]);
    });

    test('Eligible when household includes a child', () => {
      input.income.valid = true;
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE - 1;
      input.householdSize = 2;
      input.householdAges = [elig.cnst.calworks.MAX_CHILD_AGE + 1];
      check(elig.calworksResult, input)
        .isEligibleIf('householdAges').is([elig.cnst.calworks.MAX_CHILD_AGE]);
    });

    test('Eligible when main caretaker is young', () => {
      input.income.valid = true;
      input.age = elig.cnst.calworks.MAX_CHILD_AGE;
      check(elig.calworksResult, input).isEligibleIf('headOfHousehold').is(true);
    });

    // TODO: Add income and resources tests.
  });

  describe('CAPI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(capiMadeEligible(input));
    });
  });

  describe('FERA Program', () => {
    let expectedLowIncomeLimit;
    beforeEach(() => {
      const incomeIdx = elig.cnst.fera.MIN_HOUSEHOLD_SIZE - 1;
      expectedLowIncomeLimit = (
        elig.cnst.care.ANNUAL_INCOME_LIMITS[incomeIdx] / 12);
    })

    test('Not eligible with default input', () => {
      expect(elig.calworksResult(input).eligible).not.toBe(true);
    });

    test('Requires minimum household size', () => {
      input.income.valid = true;
      input.income.wages = [[expectedLowIncomeLimit + 1]];
      input.housingSituation = 'housed';
      input.paysUtilities = true;
      // Start with a household that's too small.
      input.householdSize = elig.cnst.fera.MIN_HOUSEHOLD_SIZE - 1;
      // Then ensure a result of eligible when the household size is increased.
      check(elig.feraResult, input)
        .isEligibleIf('householdSize').is(elig.cnst.fera.MIN_HOUSEHOLD_SIZE);
    });

    test('Requires utility bill payment', () => {
      input.householdSize = elig.cnst.fera.MIN_HOUSEHOLD_SIZE;
      input.income.valid = true;
      input.income.wages = [[expectedLowIncomeLimit + 1]];
      input.housingSituation = 'housed';
      check(elig.feraResult, input).isEligibleIf('paysUtilities').is(true);
    });

    test('Requires being housed', () => {
      input.householdSize = elig.cnst.fera.MIN_HOUSEHOLD_SIZE;
      input.income.valid = true;
      input.income.wages = [[expectedLowIncomeLimit + 1]];
      input.paysUtilities = true;
      input.housingSituation = 'no-stable-place';
      check(elig.feraResult, input)
        .isEligibleIf('housingSituation').is('housed');
      check(elig.feraResult, input)
        .isEligibleIf('housingSituation').is('unlisted-stable-place');
    });

    test('Requires income above CARE limit', () => {
      input.householdSize = elig.cnst.fera.MIN_HOUSEHOLD_SIZE;
      input.income.valid = true;
      input.housingSituation = 'housed';
      input.paysUtilities = true;
      input.income.wages = [[expectedLowIncomeLimit]];
      check(elig.feraResult, input)
        .isEligibleIf('income.wages').is([[expectedLowIncomeLimit + 1]]);
    });

    test('Requires income at or below FERA limit', () => {
      input.householdSize = elig.cnst.fera.MIN_HOUSEHOLD_SIZE;
      const testIncome = (
        elig.cnst.fera.ANNUAL_INCOME_LIMITS[input.householdSize - 1] / 12);
      input.income.valid = true;
      input.housingSituation = 'housed';
      input.paysUtilities = true;
      input.income.wages = [[testIncome + 1]];
      check(elig.feraResult, input)
        .isEligibleIf('income.wages').is([[testIncome]]);
    check(elig.feraResult, input)
        .isEligibleIf('income.wages').is([[testIncome - 1]]);
    });
  });

  describe('GA Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(gaMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.gaResult(input).eligible).not.toBe(true);
    });

    test('Requires applicant to be older than a minimum age', () => {
      input.income.valid = true;
      check(elig.gaResult, input).isEligibleIf('age')
        .isAtLeast(elig.cnst.ga.MIN_ELIGIBLE_AGE);
    });

    test('Requires no dependent children', () => {
      input.income.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.householdDependents = [false, true];
      check(elig.gaResult, input)
        .isEligibleIf('householdDependents').is([false, false]);
    });

    test('Requires income at or below income limit', () => {
      const testIncome = elig.cnst.ga.MONTHLY_INCOME_LIMITS[0];
      input.income.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.income.wages = [[testIncome + 1]];
      check(elig.gaResult, input)
        .isEligibleIf('income.wages').is([[testIncome]]);
      check(elig.gaResult, input)
        .isEligibleIf('income.wages').is([[testIncome - 1]]);
    });

    test('Requires assets at or below resource limit', () => {
      input.income.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.assets = [[elig.cnst.ga.MAX_RESOURCES + 1]];
      check(elig.gaResult, input)
        .isEligibleIf('assets').is([[elig.cnst.ga.MAX_RESOURCES]]);
      check(elig.gaResult, input)
        .isEligibleIf('assets').is([[elig.cnst.ga.MAX_RESOURCES - 1]]);
    });

    test('Requires U.S. citizenship or qualified immigration status', () => {
      input.income.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.notCitizen = true;
      check(elig.gaResult, input)
        .isEligibleIf('immigrationStatus').is('permanent_resident');
      check(elig.gaResult, input)
        .isEligibleIf('immigrationStatus').is('qualified_noncitizen_gt5y');
      check(elig.gaResult, input)
        .isEligibleIf('immigrationStatus').is('qualified_noncitizen_le5y');
      check(elig.gaResult, input)
        .isEligibleIf('notCitizen').is(false);
    });
  });

  describe('IHSS Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(ihssMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.ihssResult(input).eligible).not.toBe(true);
    });

    test('Requires Medi-Cal', () => {
      input.blind = true;
      input.housingSituation = 'housed';
      check(elig.ihssResult, input).isEligibleIf('existingMedicalMe').is(true);
    });

    test('Requires living at home', () => {
      input.blind = true;
      input.existingMedicalMe = true;
      check(elig.ihssResult, input)
        .isEligibleIf('housingSituation').is('housed');
      check(elig.ihssResult, input)
        .isEligibleIf('housingSituation').is('unlisted-stable-place');
    });

    test('Eligible when disabled', () => {
      input.existingMedicalMe = true;
      input.housingSituation = 'housed'
      check(elig.ihssResult, input).isEligibleIf('disabled').is(true);
    });

    test('Eligible when blind', () => {
      input.existingMedicalMe = true;
      input.housingSituation = 'housed'
      check(elig.ihssResult, input).isEligibleIf('blind').is(true);
    });

    test('Eligible when elderly', () => {
      input.existingMedicalMe = true;
      input.housingSituation = 'housed'
      check(elig.ihssResult, input)
        .isEligibleIf('age').isAtLeast(elig.cnst.ihss.MIN_ELDERLY_AGE);
    });
  });

  describe('No Fee ID Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.noFeeIdResult(input).eligible).not.toBe(true);
    });

    test('Eligible when elderly', () => {
      check(elig.noFeeIdResult, input).isEligibleIf('age')
        .isAtLeast(elig.cnst.noFeeId.MIN_ELIGIBLE_AGE);
    });

    test('Eligible when unhoused', () => {
      input.housingSituation = 'housed';
      check(elig.noFeeIdResult, input)
        .isEligibleIf('housingSituation').is('vehicle');
      input.housingSituation = 'unlisted-stable-place';
      check(elig.noFeeIdResult, input)
        .isEligibleIf('housingSituation').is('transitional');
      check(elig.noFeeIdResult, input)
        .isEligibleIf('housingSituation').is('hotel');
      check(elig.noFeeIdResult, input)
        .isEligibleIf('housingSituation').is('shelter');
      check(elig.noFeeIdResult, input)
        .isEligibleIf('housingSituation').is('no-stable-place');
    });
  });

  describe('SSI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(ssiMadeEligible(input));
    });
  });

  describe('VA Disability Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.vaDisabilityResult(input).eligible).not.toBe(true);
    });

    test('Requires veteran status', () => {
      input.disabled = true;
      input.militaryDisabled = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      check(elig.vaDisabilityResult, input).isEligibleIf('veteran').is(true);
    });

    test('Requires active duty, active duty for training, or inactive duty training service', () => {
      input.veteran = true;
      input.disabled = true;
      input.militaryDisabled = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [
        {type: 'reserve-duty'},
        {type: 'guard-duty'},
      ];
      check(elig.vaDisabilityResult, input)
        .isEligibleIf('dutyPeriods').is([
          {type: 'reserve-duty'},
          {type: 'active-duty'},
        ]);
      check(elig.vaDisabilityResult, input)
        .isEligibleIf('dutyPeriods').is([
          {type: 'active-training'},
          {type: 'guard-duty'},
        ]);
      check(elig.vaDisabilityResult, input)
        .isEligibleIf('dutyPeriods').is([
          {type: 'inactive-training'},
        ]);
    });

    test('Requires disability related to military service', () => {
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      input.militaryDisabled = true;
      check(elig.vaDisabilityResult, input).isEligibleIf('disabled').is(true);

      input.militaryDisabled = false;
      input.disabled = true;
      check(elig.vaDisabilityResult, input)
        .isEligibleIf('militaryDisabled').is(true);
    });

    test('Requires discharge that is not other-than-honorable, bad conduct, or dishonorable', () => {
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      input.militaryDisabled = true;
      input.disabled = true;
      check(elig.vaDisabilityResult, input)
        .isNotEligibleIf('dischargeStatus').is('oth');
      check(elig.vaDisabilityResult, input)
        .isNotEligibleIf('dischargeStatus').is('dishonorable');
      check(elig.vaDisabilityResult, input)
        .isNotEligibleIf('dischargeStatus').is('bad-conduct');
    });
  });
});