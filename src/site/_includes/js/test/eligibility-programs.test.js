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
  this.prop = 'eligible';
  this.expected = true;
  // Special handling for testing with input overlays.
  if (typeof this.target === 'function') {
    const mergedInput = this.target(this.input);
    expect(this.program(this.input).eligible,
      dependencyMsg(this, this.input)).not.toBe(true);
    verifyOverlay(mergedInput);
    expect(this.program(mergedInput).eligible,
      dependencyMsg(this, mergedInput)).toBe(true);
    return;
  }
  return this;
}

function isNotEligibleIf(target) {
  this.target = target;
  this.prop = 'eligible';
  this.expected = false;
  // Special handling for testing with input overlays.
  if (typeof this.target === 'function') {
    const mergedInput = this.target(this.input);
    expect(this.program(this.input).eligible,
      dependencyMsg(this, this.input)).toBe(true);
    verifyOverlay(mergedInput);
    expect(this.program(mergedInput).eligible,
      dependencyMsg(this, mergedInput)).toBe(false);
    return;
  }
  return this;
}

function isEnrolledIf(target) {
  this.target = target;
  this.prop = 'enrolled';
  this.expected = true;
  return this;
}

function isUnknownIf(target) {
  this.target = target;
  this.prop = 'eligible';
  this.expected = null;
  return this;
}

function dependencyMsg(ctx, input) {
  let whichStr = 'unmodified input';
  if (input._verifyFn) {
    whichStr = `${input._verifyFn.name} returning eligible`;
  }
  return (
    `Checking ${ctx.program.name} with ${whichStr}\n` +
      `${ctx.program.name} returns:\n` +
      `${JSON.stringify(ctx.program(input), null, 2)}`
  );
}
function msg(ctx, whichStr) {
  return (
    `Checking ${ctx.program.name} with ${whichStr} value of ` +
      `${ctx.target}: ${JSON.stringify(getValue(ctx.input, ctx.target))}\n` +
      `${ctx.program.name} returns:\n` +
      `${JSON.stringify(ctx.program(ctx.input), null, 2)}`
  );
}

// A bit of a hack to allow for easier income value perturbations in
// isAtLeast, isAtMost, isOver, and isUnder.
function incomeSafeVal(target, value) {
  if (target.includes('income') || target.includes('assets')) {
    return [[value]];
  }
  return value;
}

function is(value) {
  const initValue = getValue(this.input, this.target);
  expect(this.program(this.input)[this.prop], msg(this, 'initial'))
    .not.toBe(this.expected);
  setValue(this.input, this.target, value);
  expect(this.program(this.input)[this.prop], msg(this, 'modified'))
    .toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isAtLeast(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, incomeSafeVal(this.target, value - 1));
  expect(this.program(this.input)[this.prop], msg(this, 'lower'))
    .not.toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value));
  expect(this.program(this.input)[this.prop], msg(this, 'given'))
    .toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value + 1));
  expect(this.program(this.input)[this.prop], msg(this, 'higher'))
    .toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isAtMost(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, incomeSafeVal(this.target, value + 1));
  expect(this.program(this.input)[this.prop], msg(this, 'higher'))
    .not.toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value));
  expect(this.program(this.input)[this.prop], msg(this, 'given'))
    .toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value - 1));
  expect(this.program(this.input)[this.prop], msg(this, 'lower'))
    .toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isOver(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, incomeSafeVal(this.target, value));
  expect(this.program(this.input)[this.prop], msg(this, 'given'))
    .not.toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value + 1));
  expect(this.program(this.input)[this.prop], msg(this, 'higher'))
    .toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function isUnder(value) {
  const initValue = getValue(this.input, this.target);
  setValue(this.input, this.target, incomeSafeVal(this.target, value));
  expect(this.program(this.input)[this.prop], msg(this, 'given'))
    .not.toBe(this.expected);
  setValue(this.input, this.target, incomeSafeVal(this.target, value - 1));
  expect(this.program(this.input)[this.prop], msg(this, 'lower'))
    .toBe(this.expected);
  setValue(this.input, this.target, initValue);
}

function check(program, input) {
  return {
    program,
    input,
    isEligibleIf,
    isNotEligibleIf,
    isUnknownIf,
    isEnrolledIf,
    is,
    isAtLeast,
    isAtMost,
    isUnder,
    isOver,
  };
}

function plusDays(date, numDays) {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + numDays);
  return newDate;
}

function dayAfter(date) {
  return plusDays(date, 1);
}

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
          val: 1,
        },
      },
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
          val: 1,
        },
      },
    };
    setValue(testObj, 'income.wages', [[140]]);
    expect(testObj.income.wages).toEqual([[140]]);
    setValue(testObj, 'income.deeper.val', 42);
    expect(testObj.income.deeper.val).toBe(42);
  });
});

describe('Helper incomeSafeVal', () => {
  test('Returns unchanged value in the general case', () => {
    expect(incomeSafeVal('age', 42)).toBe(42);
    expect(incomeSafeVal('property', 'hello')).toBe('hello');
    expect(incomeSafeVal('example', [1, 2, 3])).toEqual([1, 2, 3]);
  });

  test('Returns value in a nested list for income', () => {
    expect(incomeSafeVal('income.wages', 42)).toEqual([[42]]);
    expect(incomeSafeVal('income.unemployment', 100)).toEqual([[100]]);
  });

  test('Returns value in a nested list for assets', () => {
    expect(incomeSafeVal('assets', 99)).toEqual([[99]]);
  });
});


describe('MonthlyIncomeLimits', () => {
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
    const limits = new elig.MonthlyIncomeLimits(monthlyValues, 1);
    expect(limits.getLimit(1)).toBe(100);
    expect(limits.getLimit(2)).toBe(200);
    expect(limits.getLimit(3)).toBe(300);
  });

  test('Computes limit outside provided household size range', () => {
    const limits = new elig.MonthlyIncomeLimits(monthlyValues, 1);
    expect(limits.getLimit(0)).toBe(0);
    expect(limits.getLimit(4)).toBe(301);
    expect(limits.getLimit(6)).toBe(303);
  });

  test('Computes limit outside household size range with custom function', () => {
    const limits = new elig.MonthlyIncomeLimits(monthlyValues,
      (numExtraPeople) => 10 + numExtraPeople);
    expect(limits.getLimit(0)).toBe(0);
    expect(limits.getLimit(4)).toBe(311);
    expect(limits.getLimit(6)).toBe(313);
  });

  test('Computes monthly limit from provided annual limits', () => {
    const limits = elig.MonthlyIncomeLimits.fromAnnual(annualValues, 12);
    expect(limits.getLimit(1)).toBe(1000);
    expect(limits.getLimit(2)).toBe(2000);
    expect(limits.getLimit(3)).toBe(3000);
  });

  test('Computes monthly limit from annual limits outside provided household size range', () => {
    const limits = elig.MonthlyIncomeLimits.fromAnnual(annualValues, 12);
    expect(limits.getLimit(0)).toBe(0);
    expect(limits.getLimit(4)).toBe(3001);
    expect(limits.getLimit(6)).toBe(3003);
  });

  test('Computes monthly limit from annual limits outside provided household size range with custom fuction', () => {
    const limits = elig.MonthlyIncomeLimits.fromAnnual(annualValues,
      (numExtraPeople) => 12 * 2 * numExtraPeople);
    expect(limits.getLimit(0)).toBe(0);
    expect(limits.getLimit(4)).toBe(3002);
    expect(limits.getLimit(6)).toBe(3006);
  });
});

describe('Program eligibility', () => {
  let input;

  function calfreshMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.calfresh.FED_POVERTY_LEVEL[0] *
      elig.cnst.calfresh.GROSS_INCOME_LIMIT_MCE_FACTOR]];
    modified._verifyFn = elig.calfreshResult;
    return modified;
  }

  function calworksMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.pregnant = true;
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.calworks.MBSAC[0]]];
    modified.assets.valid = true;
    modified.assets.values = [[elig.cnst.calworks.BASE_RESOURCE_LIMIT]];
    modified._verifyFn = elig.calworksResult;
    return modified;
  }

  function capiMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.citizen = false;
    modified.immigrationStatus = 'long_term';
    modified.disabled = true;
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.ssiCapi.MAX_BENEFIT_NON_BLIND]];
    modified.assets.valid = true;
    modified.assets.values = [[elig.cnst.ssiCapi.MAX_RESOURCES - 1]];
    modified._verifyFn = elig.capiResult;
    return modified;
  }

  function gaMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.ga.MONTHLY_INCOME_LIMITS[0]]];
    modified.assets.valid = true;
    modified.assets.values = [[elig.cnst.ga.MAX_RESOURCES]];
    modified._verifyFn = elig.gaResult;
    return modified;
  }

  function ihssMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.age = elig.cnst.ihss.MIN_ELDERLY_AGE;
    modified.housingSituation = 'housed';
    modified.existingMedicalMe = true;
    modified._verifyFn = elig.ihssResult;
    return modified;
  }

  function liheapMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.housingSituation = 'housed';
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.liheap.MONTHLY_INCOME_LIMITS[0]]];
    modified._verifyFn = elig.liheapResult;
    return modified;
  }

  function noFeeIdMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.housingSituation = 'no-stable-place';
    modified.age = elig.cnst.noFeeId.MIN_ELIGIBLE_AGE;
    modified._verifyFn = elig.noFeeIdResult;
    return modified;
  }

  function noFeeIdMadeIneligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.housingSituation = 'housed';
    modified.age = elig.cnst.noFeeId.MIN_ELIGIBLE_AGE - 1;
    return modified;
  }

  function ssdiMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.age = elig.cnst.ssdi.FULL_RETIREMENT_AGE - 1;
    modified.disabled = true;
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.ssiCapi.SGA_NON_BLIND]];
    modified.paidSsTaxes = true;
    modified._verifyFn = elig.ssdiResult;
    return modified;
  }

  function ssiMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.disabled = true;
    modified.income.valid = true;
    modified.income.wages = [[elig.cnst.ssiCapi.MAX_BENEFIT_NON_BLIND]];
    modified.assets.valid = true;
    modified.assets.values = [[elig.cnst.ssiCapi.MAX_RESOURCES - 1]];
    modified._verifyFn = elig.ssiResult;
    return modified;
  }

  function vaPensionMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.veteran = true;
    modified.dischargeStatus = 'honorable';
    modified.disabled = true;
    modified.income.valid = true;
    modified.income.wages = (
      [[elig.cnst.vaPension.ANNUAL_INCOME_LIMITS[0] / 12]]);
    modified.assets.valid = true;
    modified.assets.values = [[elig.cnst.vaPension.ANNUAL_NET_WORTH_LIMIT -
        12 * modified.income.wages[0][0]]];
    modified.dutyPeriods = [{
      type: 'active-duty',
      start: new Date('1955-11-01T00:00'),
      end: new Date('1956-11-01T00:00'),
    }];
    modified._verifyFn = elig.vaPensionResult;
    return modified;
  }

  function wicMadeEligible(baseInput) {
    const modified = structuredClone(baseInput);
    modified.pregnant = true;
    modified.income.valid = true;
    modified._verifyFn = elig.wicResult;
    modified.income.wages = [[elig.cnst.wic.MONTHLY_INCOME_LIMITS[0]]];
    return modified;
  }

  function testImmigration(setupFn, resultFn, testCases) {
    const cases = testCases || [
      {immStatus: 'permanent_resident', expectedElig: true, flagExpected: false},
      {immStatus: 'long_term', expectedElig: true, flagExpected: true},
      {immStatus: 'live_temporarily', expectedElig: false, flagExpected: false},
      {immStatus: 'none_describe', expectedElig: true, flagExpected: true},
    ];
    describe.each(cases)('Immigration status "$immStatus"', (
      {immStatus, expectedElig, flagExpected}) => {
      beforeEach(() => {
        setupFn();
      });
      test(`Eligibility result is ${expectedElig}`, () => {
        input.citizen = false;
        input.immigrationStatus = immStatus;
        expect(resultFn(input).eligible).toBe(expectedElig);
      });

      test(`${flagExpected ? 'Has' : 'Does not have'} complex immigration flag`, () => {
        input.citizen = false;
        input.immigrationStatus = immStatus;
        let expectResult = expect(resultFn(input).flags);
        if (!flagExpected) {
          expectResult = expectResult.not;
        }
        expectResult.toContain(elig.FlagCodes.COMPLEX_IMMIGRATION);
      });

      test('Complex immigration flag not present for citizens', () => {
        input.citizen = true;
        input.immigrationStatus = immStatus;
        expect(resultFn(input).flags)
          .not.toContain(elig.FlagCodes.COMPLEX_IMMIGRATION);
      });

      test('Complex immigration flag not present for an ineligible result', () => {
        input.citizen = false;
        input.immigrationStatus = immStatus;
        input.income.wages = [[1e6]];
        expect(resultFn(input).eligible).toBe(false);
        expect(resultFn(input).flags)
          .not.toContain(elig.FlagCodes.COMPLEX_IMMIGRATION);
      });

      test('Complex immigration flag not present for an unknown result', () => {
        input.citizen = false;
        input.immigrationStatus = immStatus;
        input.income.valid = false;
        expect(resultFn(input).eligible).toBe(expectedElig ? null : false);
        expect(resultFn(input).flags)
          .not.toContain(elig.FlagCodes.COMPLEX_IMMIGRATION);
      });
    });
  }

  function testDischargeStatus(setupFn, resultFn, testCases) {
    describe.each(testCases)('Discharge status "$dischargeStatus"', (
      {dischargeStatus, expectedFlag, expectedEligible}) => {
      beforeEach(() => {
        setupFn(input);
      });

      if (expectedEligible !== undefined) {
        test(`Eligibility result is ${expectedEligible}`, () => {
          input.veteran = true;
          input.dischargeStatus = dischargeStatus;
          expect(resultFn(input).eligible).toBe(expectedEligible);
        });
      }

      test(`Complex discharge flag ${expectedFlag ? 'is' : 'is not'} present`, () => {
        input.veteran = true;
        input.dischargeStatus = dischargeStatus;
        const result = resultFn(input);
        if (expectedFlag) {
          expect(result.flags).toContain(elig.FlagCodes.COMPLEX_DISCHARGE);
        } else {
          expect(result.flags).not.toContain(elig.FlagCodes.COMPLEX_DISCHARGE);
        }
      });
    });
  }

  beforeEach(() => {
    input = {
      age: null,
      citizen: true,
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
      paysUtilities: null,
      hasKitchen: false,
      unhousedRisk: null,
      immigrationStatus: null,
      usesGuideDog: null,
      militaryDisabled: null,
      dischargeStatus: null,
      servedFullDuration: false,
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
      assets: {
        valid: false,
        values: [[]],
      },
      paidSsTaxes: null,
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
      existingPhaMe: false,
      existingPhaHousehold: false,
      existingSchipMe: false,
      existingSchipHousehold: false,
      existingAdsaMe: false,
      existingAdsaHousehold: false,
      existingCareMe: false,
      existingCareHousehold: false,
      existingFeraMe: false,
      existingFeraHousehold: false,
      existingLifelineMe: false,
      existingLifelineHousehold: false,
      existingVaDisabilityMe: false,
      existingVaDisabilityHousehold: false,
      existingVtaParatransitMe: false,
      existingVtaParatransitHousehold: false,
      existingRtcClipperMe: false,
      existingRtcClipperHousehold: false,
    };
    Object.preventExtensions(input);
  });

  // TODO: add tests for MORE_INFO_NEEDED flag for all programs.
  describe('ADSA Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.adsaResult(input).eligible).toBe(false);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingAdsaHousehold = true;
      check(elig.adsaResult, input).isEnrolledIf('existingAdsaMe').is(true);
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
      check(elig.adsaResult, input).isEligibleIf(ssdiMadeEligible);
    });
  });

  describe('CalFresh Program', () => {
    let expectedIncomeLimit;
    beforeEach(() => {
      expectedIncomeLimit = (
        elig.cnst.calfresh.FED_POVERTY_LEVEL[0] *
        elig.cnst.calfresh.GROSS_INCOME_LIMIT_MCE_FACTOR);
    });
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(calfreshMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.calfreshResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.calfreshResult, input).isEnrolledIf('existingCalfreshMe').is(true);
      check(elig.calfreshResult, input).isEnrolledIf(
        'existingCalfreshHousehold').is(true);
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.citizen = false;
      check(elig.calfreshResult, input)
        .isEligibleIf('citizen').is(true);
    });

    test('Eligible categorically when receiving CalWORKS or GA', () => {
      check(elig.calfreshResult, input).isEligibleIf(
        'existingCalworksMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf(
        'existingCalworksHousehold').is(true);
      check(elig.calfreshResult, input).isEligibleIf(
        'existingGaMe').is(true);
      check(elig.calfreshResult, input).isEligibleIf(
        'existingGaHousehold').is(true);

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
      check(elig.calfreshResult, input)
        .isEligibleIf('income.wages').isAtMost(testIncome);
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
      check(elig.calfreshResult, input)
        .isEligibleIf('income.selfEmployed').isAtMost(testIncome);
    });

    test('Unknown result for invalid income with no categorical eligibility', () => {
      input.income.valid = true;
      check(elig.calfreshResult, input).isUnknownIf('income.valid').is(false);
    });

    testImmigration(() => {
      input.income.valid = true;
    },
    elig.calfreshResult,
    );
  });

  describe('CalWORKS Program', () => {
    describe('Adjusted income calculation', () => {
      test('Disregards 40% of self-employment income', () => {
        input.income.valid = true;
        input.income.selfEmployed = [[1000]];
        // The other employment disregard also applies to self-employment income
        expect(elig.calworksAdjustedIncome(input))
          .toBe(600 - elig.cnst.calworks.EMPLOYMENT_DISREGARD);
      });

      test('Disregards $450 of total earned income for each employed person', () => {
        input.income.valid = true;
        // Single employed person
        input.householdSize = 1;
        input.income.unemployment = [[9]];
        input.income.wages = [[100]];
        expect(elig.calworksAdjustedIncome(input)).toBe(9);
        input.income.wages = [[600]];
        expect(elig.calworksAdjustedIncome(input)).toBe(159);
        input.income.wages = [[]];
        input.income.selfEmployed = [[1000]];
        // The other 40% self-employment disregard also applies here.
        expect(elig.calworksAdjustedIncome(input)).toBe(159);
        // Two employed people
        input.householdSize = 3;
        input.income.unemployment = [[], [], []];
        input.income.selfEmployed = [[], [], []];
        input.income.wages = [[100], [], [500]];
        expect(elig.calworksAdjustedIncome(input)).toBe(0);
        input.income.wages = [[500], [], [500]];
        expect(elig.calworksAdjustedIncome(input)).toBe(100);
        input.income.wages = [[1], [], [1899]];
        expect(elig.calworksAdjustedIncome(input)).toBe(1000);
      });

      test('Disregards a portion of child support income', () => {
        input.income.valid = true;
        // Disregard up to $100 for one child
        input.householdSize = 2;
        input.householdAges = [35, elig.cnst.calworks.MAX_CHILD_AGE];
        input.income.childSupport = [[50], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(0);
        input.income.childSupport = [[100], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(0);
        input.income.childSupport = [[200], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(100);
        // Disregard up to $200 for two or more children
        input.householdSize = 3;
        input.householdAges = [35, elig.cnst.calworks.MAX_CHILD_AGE,
          elig.cnst.calworks.MAX_CHILD_AGE];
        input.income.childSupport = [[100], [], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(0);
        input.income.childSupport = [[200], [], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(0);
        input.income.childSupport = [[300], [], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(100);
        input.householdSize = 4;
        input.householdAges = [35, elig.cnst.calworks.MAX_CHILD_AGE,
          elig.cnst.calworks.MAX_CHILD_AGE, elig.cnst.calworks.MAX_CHILD_AGE];
        expect(elig.calworksAdjustedIncome(input)).toBe(100);
      });

      test('No child support disregard for null ages', () => {
        const supportPayment = 500;
        input.income.valid = true;
        input.householdSize = 2;
        input.income.childSupport = [[supportPayment], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(supportPayment);
      });

      test('No child support disregard for household with no children', () => {
        const supportPayment = 500;
        input.income.valid = true;
        input.householdSize = 2;
        input.householdAges = [35, elig.cnst.calworks.MAX_CHILD_AGE + 1];
        input.income.childSupport = [[supportPayment], []];
        expect(elig.calworksAdjustedIncome(input)).toBe(supportPayment);
      });

      test('Disregards SSI and CAPI payments from income', () => {
        input.income.valid = true;
        input.income.disability = [[500, 200, 300]];
        input.householdSize = 1;
        input.ssiIncome = [500, 300];
        expect(elig.calworksAdjustedIncome(input)).toBe(200);
      });

      test('Returns NaN if income data is not valid', () => {
        input.income.valid = false;
        expect(elig.calworksAdjustedIncome(input)).toBe(NaN);
      });
    });

    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(calworksMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.calworksResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.calworksResult, input).isEnrolledIf('existingCalworksMe').is(true);
      check(elig.calworksResult, input).isEnrolledIf(
        'existingCalworksHousehold').is(true);
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.pregnant = true;
      input.citizen = false;
      check(elig.calworksResult, input)
        .isEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.assets.valid = true;
      input.pregnant = true;
    },
    elig.calworksResult,
    );

    test('Eligible when pregnant', () => {
      input.income.valid = true;
      input.assets.valid = true;
      check(elig.calworksResult, input).isEligibleIf('pregnant').is(true);
    });

    test('Eligible when household contains a pregnant person', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.householdSize = 2;
      input.householdPregnant = [false];
      check(elig.calworksResult, input)
        .isEligibleIf('householdPregnant').is([true]);
    });

    test('Eligible when household includes a child', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.householdSize = 2;
      input.householdAges = [elig.cnst.calworks.MAX_CHILD_AGE + 1];
      check(elig.calworksResult, input)
        .isEligibleIf('householdAges').is([elig.cnst.calworks.MAX_CHILD_AGE]);
    });

    test('Eligible when main caretaker is young', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.calworks.MAX_CHILD_AGE;
      check(elig.calworksResult, input).isEligibleIf('headOfHousehold').is(true);
    });

    test('Requires adjusted income to be at or below Minimum Basic Standard for Adequate Care', () => {
      input.pregnant = true;
      input.income.valid = true;
      input.assets.valid = true;
      // Note part of income from employment is disregarded, so use unemployment
      // income for this test.
      check(elig.calworksResult, input).isEligibleIf('income.unemployment')
        .isAtMost(elig.cnst.calworks.MBSAC[0]);
    });

    test('Requires assets to be at or below the limit', () => {
      input.pregnant = true;
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE - 1;
      input.householdSize = 2;
      // Elderly household member
      input.householdAges = [elig.cnst.calworks.MIN_ELDERLY_AGE];
      input.householdDisabled = [false];
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.DISABLED_ELDERLY_RESOURCE_LIMIT);
      // Disabled household member
      input.householdAges = [elig.cnst.calworks.MIN_ELDERLY_AGE - 1];
      input.householdDisabled = [true];
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.DISABLED_ELDERLY_RESOURCE_LIMIT);
      // No elderly or disabled member
      input.householdAges = [elig.cnst.calworks.MIN_ELDERLY_AGE - 1];
      input.householdDisabled = [false];
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.BASE_RESOURCE_LIMIT);
      // Elderly applicant
      input.age = elig.cnst.calworks.MIN_ELDERLY_AGE;
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.DISABLED_ELDERLY_RESOURCE_LIMIT);
      // Disabled applicant
      input.disabled = true;
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.DISABLED_ELDERLY_RESOURCE_LIMIT);
      // Unknown ages
      input.householdAges = [null];
      input.age = null;
      input.disabled = false;
      check(elig.calworksResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.calworks.BASE_RESOURCE_LIMIT);
    });
  });

  describe('CAPI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(capiMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.capiResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingCapiHousehold = true;
      check(elig.capiResult, input).isEnrolledIf('existingCapiMe').is(true);
    });

    test('Requires valid immigration status', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
      input.citizen = false;
      input.immigrationStatus = 'long_term';
      check(elig.capiResult, input)
        .isNotEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
    }, elig.capiResult, [
      {immStatus: 'permanent_resident', expectedElig: true, flagExpected: true},
      {immStatus: 'long_term', expectedElig: true, flagExpected: true},
      {immStatus: 'live_temporarily', expectedElig: false, flagExpected: false},
      {immStatus: 'none_describe', expectedElig: true, flagExpected: true},
    ]);
  });

  describe('CARE Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.careResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.careResult, input).isEnrolledIf('existingCareMe').is(true);
      check(elig.careResult, input).isEnrolledIf(
        'existingCareHousehold').is(true);
    });

    test('Requires utility bill payment', () => {
      input.income.valid = true;
      input.housingSituation = 'housed';
      check(elig.careResult, input).isEligibleIf('paysUtilities').is(true);
    });

    test('Requires being housed', () => {
      input.income.valid = true;
      input.paysUtilities = true;
      input.housingSituation = 'no-stable-place';
      check(elig.careResult, input)
        .isEligibleIf('housingSituation').is('housed');
      check(elig.careResult, input)
        .isEligibleIf('housingSituation').is('unlisted-stable-place');
    });

    test('Eligible when gross income is at or below the limit', () => {
      const testIncome = elig.cnst.care.ANNUAL_INCOME_LIMITS[0] / 12;
      input.income.valid = true;
      input.housingSituation = 'housed';
      input.paysUtilities = true;
      check(elig.careResult, input)
        .isEligibleIf('income.wages').isAtMost(testIncome);
    });

    test('Eligible when receiving certain existing assistance', () => {
      input.income.valid = false;
      input.housingSituation = 'housed';
      input.paysUtilities = true;

      check(elig.careResult, input).isEligibleIf('existingMedicalMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingMedicalHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingWicMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingWicHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingNslpMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingNslpHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingCalfreshMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingCalfreshHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingCfapMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingCfapHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingLiheapMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingLiheapHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingSsiMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingSsiHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingCalworksMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingCalworksHousehold').is(true);
      check(elig.careResult, input).isEligibleIf('existingSchipMe').is(true);
      check(elig.careResult, input).isEligibleIf('existingSchipHousehold').is(true);

      check(elig.careResult, input).isEligibleIf(wicMadeEligible);
      check(elig.careResult, input).isEligibleIf(calfreshMadeEligible);
      check(elig.careResult, input).isEligibleIf(liheapMadeEligible);
      check(elig.careResult, input).isEligibleIf(ssiMadeEligible);
      check(elig.careResult, input).isEligibleIf(calworksMadeEligible);
    });
  });

  describe('FERA Program', () => {
    let expectedLowIncomeLimit;
    beforeEach(() => {
      const incomeIdx = elig.cnst.fera.MIN_HOUSEHOLD_SIZE - 1;
      expectedLowIncomeLimit = (
        elig.cnst.care.ANNUAL_INCOME_LIMITS[incomeIdx] / 12);
    });

    test('Not eligible with default input', () => {
      expect(elig.calworksResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.feraResult, input).isEnrolledIf('existingFeraMe').is(true);
      check(elig.feraResult, input).isEnrolledIf(
        'existingFeraHousehold').is(true);
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
      check(elig.feraResult, input)
        .isEligibleIf('income.wages').isAtMost(testIncome);
    });
  });

  describe('GA Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(gaMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.gaResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingGaHousehold = true;
      check(elig.gaResult, input).isEnrolledIf('existingGaMe').is(true);
    });

    test('Requires applicant to be older than a minimum age', () => {
      input.income.valid = true;
      input.assets.valid = true;
      check(elig.gaResult, input).isEligibleIf('age')
        .isAtLeast(elig.cnst.ga.MIN_ELIGIBLE_AGE);
    });

    test('Requires no dependent children', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.householdDependents = [false, true];
      check(elig.gaResult, input)
        .isEligibleIf('householdDependents').is([false, false]);
    });

    test('Requires income at or below income limit', () => {
      const maxIncome = elig.cnst.ga.MONTHLY_INCOME_LIMITS[0];
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      check(elig.gaResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });

    test('Requires assets at or below resource limit', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      check(elig.gaResult, input)
        .isEligibleIf('assets.values').isAtMost(elig.cnst.ga.MAX_RESOURCES);
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
      input.citizen = false;
      check(elig.gaResult, input)
        .isEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ga.MIN_ELIGIBLE_AGE;
    },
    elig.gaResult,
    );
  });

  describe('Housing Choice Voucher Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.housingChoiceResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.housingChoiceResult, input).isEnrolledIf(
        'existingPhaMe').is(true);
      check(elig.housingChoiceResult, input).isEnrolledIf(
        'existingPhaHousehold').is(true);
    });

    test('Requires applicant to be older than a minimum age', () => {
      input.income.valid = true;
      check(elig.housingChoiceResult, input).isEligibleIf('age')
        .isAtLeast(elig.cnst.housingChoice.MIN_ELIGIBLE_AGE);
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.age = elig.cnst.housingChoice.MIN_ELIGIBLE_AGE;
      input.citizen = false;
      check(elig.housingChoiceResult, input)
        .isEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.age = elig.cnst.housingChoice.MIN_ELIGIBLE_AGE;
    },
    elig.housingChoiceResult,
    );

    test('Requires gross income at or below income limit', () => {
      const maxIncome = elig.cnst.housingChoice.ANNUAL_INCOME_LIMITS[0] / 12;
      input.income.valid = true;
      input.age = elig.cnst.housingChoice.MIN_ELIGIBLE_AGE;
      check(elig.housingChoiceResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });

    // This program has a particularly complex income limit calculation for
    // household sizes above the maximum size listed in the limit table.  This
    // Test ensures the calculation was done correctly by checking against the
    // values given by the HUD income limit calculator.
    test('Extended income limit is computed correctly', () => {
      // https://www.huduser.gov/portal/datasets/il/il2025/2025IlCalc.odn?inputname=Santa+Clara+County&area_id=METRO41940M41940&fips=0608599999&type=county&year=2025&yy=25&stname=California&stusps=CA&statefp=06&ACS_Survey=&State_Count=&areaname=San+Jose-Sunnyvale-Santa+Clara%2C+CA+HUD+Metro+FMR+Area&incpath=&level=50
      const expectedAnnualLimitNinePpl = 140650;
      const expectedAnnualLimitTwentyFivePpl = 269250;

      input.income.valid = true;
      input.age = elig.cnst.housingChoice.MIN_ELIGIBLE_AGE;

      input.householdSize = 9;
      let maxIncome = expectedAnnualLimitNinePpl / 12;
      check(elig.housingChoiceResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);

      input.householdSize = 25;
      maxIncome = expectedAnnualLimitTwentyFivePpl / 12;
      check(elig.housingChoiceResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });
  });

  describe('IHSS Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(ihssMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.ihssResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingIhssHousehold = true;
      check(elig.ihssResult, input).isEnrolledIf('existingIhssMe').is(true);
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
      input.housingSituation = 'housed';
      check(elig.ihssResult, input).isEligibleIf('disabled').is(true);
    });

    test('Eligible when blind', () => {
      input.existingMedicalMe = true;
      input.housingSituation = 'housed';
      check(elig.ihssResult, input).isEligibleIf('blind').is(true);
    });

    test('Eligible when elderly', () => {
      input.existingMedicalMe = true;
      input.housingSituation = 'housed';
      check(elig.ihssResult, input)
        .isEligibleIf('age').isAtLeast(elig.cnst.ihss.MIN_ELDERLY_AGE);
    });
  });

  describe('Lifeline Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.lifelineResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingLifelineHousehold = true;
      check(elig.lifelineResult, input).isEnrolledIf(
        'existingLifelineMe').is(true);
    });

    test('Eligible when gross income is at or below the limit', () => {
      const maxIncome = elig.cnst.lifeline.ANNUAL_INCOME_LIMITS[0] / 12;
      input.income.valid = true;
      // The Lifeline income limit is low, so we have to force ineligibility
      // for Calfresh to only check Lifeline.
      input.citizen = false;
      check(elig.lifelineResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });

    test('Eligible when receiving certain existing assistance', () => {
      input.income.valid = false;

      check(elig.lifelineResult, input)
        .isEligibleIf('existingMedicalMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingMedicalHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingLiheapMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingLiheapHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingSsiMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingSsiHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingCalfreshMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingCalfreshHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingWicMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingWicHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingNslpMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingNslpHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingCalworksMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingCalworksHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingVaPensionMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingVaPensionHousehold').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingPhaMe').is(true);
      check(elig.lifelineResult, input)
        .isEligibleIf('existingPhaHousehold').is(true);

      check(elig.lifelineResult, input).isEligibleIf(liheapMadeEligible);
      check(elig.lifelineResult, input).isEligibleIf(ssiMadeEligible);
      check(elig.lifelineResult, input).isEligibleIf(calfreshMadeEligible);
      check(elig.lifelineResult, input).isEligibleIf(wicMadeEligible);
      check(elig.lifelineResult, input).isEligibleIf(calworksMadeEligible);
      check(elig.lifelineResult, input).isEligibleIf(vaPensionMadeEligible);
    });
  });

  describe('LIHEAP Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(liheapMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.liheapResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.liheapResult, input).isEnrolledIf('existingLiheapMe').is(true);
      check(elig.liheapResult, input).isEnrolledIf(
        'existingLiheapHousehold').is(true);
    });

    test('Requires being housed', () => {
      input.income.valid = true;
      input.housingSituation = 'no-stable-place';
      check(elig.liheapResult, input)
        .isEligibleIf('housingSituation').is('housed');
      check(elig.liheapResult, input)
        .isEligibleIf('housingSituation').is('unlisted-stable-place');
    });

    test('Requires gross income at or below limit', () => {
      const maxIncome = elig.cnst.liheap.MONTHLY_INCOME_LIMITS[0];
      input.income.valid = true;
      input.housingSituation = 'housed';
      check(elig.liheapResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });
  });

  describe('No Fee ID Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(noFeeIdMadeEligible(input));
    });

    test('Not eligible with ineligible input', () => {
      expect(elig.noFeeIdResult(noFeeIdMadeIneligible(input)).eligible)
        .toBe(false);
    });

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

  describe('Reduced Fee ID Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.reducedFeeIdResult(input).eligible).not.toBe(true);
    });

    test('Eligible when receiving or eligible for certain assistance', () => {
      input = noFeeIdMadeIneligible(input);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingCalworksMe').is(true);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingSsiMe').is(true);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingGaMe').is(true);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingCalfreshMe').is(true);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingCfapMe').is(true);
      check(elig.reducedFeeIdResult, input)
        .isEligibleIf('existingCapiMe').is(true);

      check(elig.reducedFeeIdResult, input).isEligibleIf(calworksMadeEligible);
      check(elig.reducedFeeIdResult, input).isEligibleIf(ssiMadeEligible);
      check(elig.reducedFeeIdResult, input).isEligibleIf(gaMadeEligible);
      check(elig.reducedFeeIdResult, input).isEligibleIf(calfreshMadeEligible);
      check(elig.reducedFeeIdResult, input).isEligibleIf(capiMadeEligible);
      // TODO: Add CFAP eligibility check here once it's supported.
    });

    test('Not eligible when no-fee ID is available', () => {
      input = noFeeIdMadeIneligible(input);
      input.existingCalworksMe = true;
      check(elig.reducedFeeIdResult, input).isNotEligibleIf(
        noFeeIdMadeEligible);
    });
  });

  describe('SSI/CAPI adjusted income calcuation', () => {
    test('Works with only unearned income', () => {
      // First $20 of unearned income is excluded.
      expect(elig.ssiCapiAdjustedIncome(0, 100)).toBe(80);
      expect(elig.ssiCapiAdjustedIncome(0, 20)).toBe(0);
      expect(elig.ssiCapiAdjustedIncome(0, 10)).toBe(0);
    });

    test('Works with only earned income', () => {
      // First $65 of earned income is excluded, plus any remaining of the
      // $20 unearned income exclusion.  The remainder is then cut in half.
      expect(elig.ssiCapiAdjustedIncome(185, 0)).toBe(50);
      expect(elig.ssiCapiAdjustedIncome(85, 0)).toBe(0);
      expect(elig.ssiCapiAdjustedIncome(10, 0)).toBe(0);
    });

    test('Works with both unearned income and earned income', () => {
      expect(elig.ssiCapiAdjustedIncome(165, 120)).toBe(150);
      expect(elig.ssiCapiAdjustedIncome(170, 15)).toBe(50);
      expect(elig.ssiCapiAdjustedIncome(65, 20)).toBe(0);
      expect(elig.ssiCapiAdjustedIncome(10, 5)).toBe(0);
    });

    test.todo('Returns NaN for invalid (NaN) inputs');
  });

  // SSI and CAPI have the same basic eligibility requirements except for
  // immigration, so re-use the test code for each program.
  describe.each([
    [elig.ssiResult, true, null],
    [elig.capiResult, false, 'long_term'],
  ])('SSI and CAPI Programs (%p)', (resultFn,
    defaultCitizen, defaultImmigrationStatus) => {
    beforeEach(() => {
      input.citizen = defaultCitizen;
      input.immigrationStatus = defaultImmigrationStatus;
    });

    test('Requires applicant to be disabled, blind, or elderly', () => {
      input.income.valid = true;
      input.assets.valid = true;
      check(resultFn, input).isEligibleIf('disabled').is(true);
      check(resultFn, input).isEligibleIf('blind').is(true);
      check(resultFn, input)
        .isEligibleIf('age').isAtLeast(elig.cnst.ssiCapi.MIN_ELDERLY_AGE);
    });

    test('Requires no substantial gainful activity for disabled applicants', () => {
      const sgaLimit = elig.cnst.ssiCapi.SGA_NON_BLIND;
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
      // SGA should only count earned income.
      input.income.unemployment = [[1]];
      check(resultFn, input)
        .isEligibleIf('income.wages').isAtMost(sgaLimit);
    });

    test('Substantial gainful activity test not applied for non-disabled and blind applicants', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.age = elig.cnst.ssiCapi.MIN_ELDERLY_AGE;
      input.income.wages = [[elig.cnst.ssiCapi.SGA_NON_BLIND + 1]];
      expect(resultFn(input).eligible).toBe(true);
      input.blind = true;
      expect(resultFn(input).eligible).toBe(true);
    });

    test('Requires assets below resource limit', () => {
      input.income.valid = true;
      input.disabled = true;
      input.assets.valid = true;
      check(resultFn, input)
        .isEligibleIf('assets.values').isUnder(elig.cnst.ssiCapi.MAX_RESOURCES);
    });

    test('Requires adjusted income below maximum benefit amount', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;

      // Non-blind with a kitchen
      input.hasKitchen = true;
      let maxIncome = (elig.cnst.ssiCapi.MAX_BENEFIT_NON_BLIND +
        elig.cnst.ssiCapi.MAX_UNEARNED_INCOME_EXCLUSION);
      check(resultFn, input)
        .isEligibleIf('income.unemployment').isUnder(maxIncome);

      // Non-blind without a kitchen
      input.hasKitchen = false;
      maxIncome = (elig.cnst.ssiCapi.MAX_BENEFIT_NON_BLIND_NO_KITCHEN +
        elig.cnst.ssiCapi.MAX_UNEARNED_INCOME_EXCLUSION);
      check(resultFn, input)
        .isEligibleIf('income.unemployment').isUnder(maxIncome);

      // Blind
      input.blind = true;
      maxIncome = (elig.cnst.ssiCapi.MAX_BENEFIT_BLIND +
        elig.cnst.ssiCapi.MAX_UNEARNED_INCOME_EXCLUSION);
      check(resultFn, input)
        .isEligibleIf('income.unemployment').isUnder(maxIncome);
    });
  });

  describe('SSI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(ssiMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.ssiResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingSsiHousehold = true;
      check(elig.ssiResult, input).isEnrolledIf('existingSsiMe').is(true);
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
      input.citizen = false;
      check(elig.ssiResult, input).isEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
    },
    elig.ssiResult,
    );
  });

  describe('SSDI Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(ssdiMadeEligible(input));
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingSsdiHousehold = true;
      check(elig.ssdiResult, input).isEnrolledIf('existingSsdiMe').is(true);
    });

    test('Requires age under full retirement age', () => {
      input.income.valid = true;
      input.disabled = true;
      input.paidSsTaxes = true;
      check(elig.ssdiResult, input).isEligibleIf('age')
        .isUnder(elig.cnst.ssdi.FULL_RETIREMENT_AGE);
    });

    test('Requires past payment of Social Security taxes', () => {
      input.income.valid = true;
      input.disabled = true;
      input.age = elig.cnst.ssdi.FULL_RETIREMENT_AGE - 1;
      check(elig.ssdiResult, input).isEligibleIf('paidSsTaxes').is(true);
    });

    test('Requires no substantial gainful activity', () => {
      input.income.valid = true;
      input.age = elig.cnst.ssdi.FULL_RETIREMENT_AGE - 1;
      input.paidSsTaxes = true;
      input.disabled = true;
      // SGA should only count earned income.
      input.income.unemployment = [[1]];
      check(elig.ssdiResult, input)
        .isEligibleIf('income.wages').isAtMost(elig.cnst.ssiCapi.SGA_NON_BLIND);

      input.blind = true;
      check(elig.ssdiResult, input)
        .isEligibleIf('income.wages').isAtMost(elig.cnst.ssiCapi.SGA_BLIND);
    });

    test('Eligible if disabled', () => {
      input.income.valid = true;
      input.paidSsTaxes = true;
      input.age = elig.cnst.ssdi.FULL_RETIREMENT_AGE - 1;
      check(elig.ssdiResult, input).isEligibleIf('disabled').is(true);
    });

    test('Eligible if blind', () => {
      input.income.valid = true;
      input.paidSsTaxes = true;
      input.age = elig.cnst.ssdi.FULL_RETIREMENT_AGE - 1;
      check(elig.ssdiResult, input).isEligibleIf('blind').is(true);
    });

    test('Has COMPLEX_RETIREMENT_AGE flag for transitional retirement age', () => {
      input.paidSsTaxes = true;
      input.age = elig.cnst.ssdi.TRANSITION_RETIREMENT_AGE;
      input.disabled = true;

      input.income.valid = false;
      expect(elig.ssdiResult(input).eligible).toBe(null);
      expect(elig.ssdiResult(input).flags)
        .not.toContain(elig.FlagCodes.COMPLEX_RETIREMENT_AGE);

      input.income.valid = true;
      input.disabled = false;
      expect(elig.ssdiResult(input).eligible).toBe(false);
      expect(elig.ssdiResult(input).flags)
        .not.toContain(elig.FlagCodes.COMPLEX_RETIREMENT_AGE);

      input.disabled = true;
      expect(elig.ssdiResult(input).eligible).toBe(true);
      expect(elig.ssdiResult(input).flags)
        .toContain(elig.FlagCodes.COMPLEX_RETIREMENT_AGE);

      input.age = elig.cnst.ssdi.TRANSITION_RETIREMENT_AGE - 1;
      expect(elig.ssdiResult(input).flags)
        .not.toContain(elig.FlagCodes.COMPLEX_RETIREMENT_AGE);

      input.age = elig.cnst.ssdi.TRANSITION_RETIREMENT_AGE + 1;
      expect(elig.ssdiResult(input).flags)
        .not.toContain(elig.FlagCodes.COMPLEX_RETIREMENT_AGE);
    });
  });

  describe('VA Disability Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.vaDisabilityResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingVaDisabilityHousehold = true;
      check(elig.vaDisabilityResult, input).isEnrolledIf(
        'existingVaDisabilityMe').is(true);
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

    test('Requires discharge that is not dishonorable', () => {
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      input.militaryDisabled = true;
      input.disabled = true;
      check(elig.vaDisabilityResult, input)
        .isNotEligibleIf('dischargeStatus').is('dishonorable');
    });

    testDischargeStatus(
      (input) => {
        input.disabled = true;
        input.militaryDisabled = true;
        input.dutyPeriods = [{type: 'active-duty'}];
      },
      elig.vaDisabilityResult,
      [
        {dischargeStatus: 'honorable', expectedFlag: false, expectedEligible: true},
        {dischargeStatus: 'general', expectedFlag: false, expectedEligible: true},
        {dischargeStatus: 'oth', expectedFlag: true, expectedEligible: true},
        {dischargeStatus: 'bad-conduct', expectedFlag: true, expectedEligible: true},
        {dischargeStatus: 'dishonorable', expectedFlag: false, expectedEligible: false},
      ],
    );
  });

  describe('VA Pension Program', () => {
    let validDutyPeriod;
    beforeEach(() => {
      validDutyPeriod = {
        type: 'active-duty',
        start: new Date('1955-11-01T00:00'),
        end: new Date('1956-11-01T00:00'),
      };
    });

    describe('Household size', () => {
      test('Includes spouse', () => {
        input.householdSize = 4;
        input.householdSpouse = [true, false, false];
        input.householdDependents = [false, false, false];
        expect(elig.vaPensionHouseholdSize(input)).toBe(2);
      });

      test('Includes dependents', () => {
        input.householdSize = 4;
        input.householdSpouse = [false, false, false];
        input.householdDependents = [true, true, false];
        expect(elig.vaPensionHouseholdSize(input)).toBe(3);
      });

      test('Does not double count any person', () => {
        input.householdSize = 4;
        input.householdSpouse = [true, false, false];
        input.householdDependents = [true, true, false];
        expect(elig.vaPensionHouseholdSize(input)).toBe(3);
      });
    });

    describe('Countable income', () => {
      test('Includes income from spouse', () => {
        input.householdSpouse = [true, false];
        input.householdDependents = [false, false];
        input.income.valid = true;
        input.income.wages = [[100], [300], [99]];
        expect(elig.vaPensionCountableIncome(input)).toBe(400);
      });

      test('Includes income from dependents over a threshold', () => {
        input.householdSpouse = [false, false, false, false];
        input.householdDependents = [true, true, true, false];
        input.income.valid = true;
        input.income.wages = [
          [100],
          [elig.cnst.vaPension.MAX_DEPENDENT_ANNUAL_WAGES_EXCLUSION / 12 + 200],
          [elig.cnst.vaPension.MAX_DEPENDENT_ANNUAL_WAGES_EXCLUSION / 12 + 300],
          [elig.cnst.vaPension.MAX_DEPENDENT_ANNUAL_WAGES_EXCLUSION / 12],
          [999],
        ];
        expect(elig.vaPensionCountableIncome(input)).toBeCloseTo(600, 3);
      });

      test('Does not double count income from a dependent spouse', () => {
        input.householdSpouse = [true];
        input.householdDependents = [true];
        input.income.valid = true;
        input.income.wages = [
          [100],
          [elig.cnst.vaPension.MAX_DEPENDENT_ANNUAL_WAGES_EXCLUSION / 12 + 200],
        ];
        expect(elig.vaPensionCountableIncome(input)).toBe(300);
      });

      testDischargeStatus(
        (input) => {
          input.disabled = true;
          input.militaryDisabled = true;
          input.dutyPeriods = [{type: 'active-duty'}];
        },
        elig.vaDisabilityResult,
        [
          {dischargeStatus: 'honorable', expectedFlag: false, expectedEligible: true},
          {dischargeStatus: 'general', expectedFlag: false, expectedEligible: true},
          {dischargeStatus: 'oth', expectedFlag: true, expectedEligible: true},
          {dischargeStatus: 'bad-conduct', expectedFlag: true, expectedEligible: true},
          {dischargeStatus: 'dishonorable', expectedFlag: false, expectedEligible: false},
        ],
      );
    });

    describe('Net worth', () => {
      test('Sums yearly income and total assets', () => {
        const monthlyIncome = 10;
        input.assets.valid = true;
        input.assets.values = [[1000, 1000]];
        expect(elig.vaPensionNetWorth(input, monthlyIncome)).toBe(2120);
      });

      test('Includes assets from spouse', () => {
        input.householdSpouse = [true, false];
        input.assets.valid = true;
        input.assets.values = [[100], [200], [899]];
        expect(elig.vaPensionNetWorth(input, 0)).toBe(300);
      });

      test('Does not include assets from dependents', () => {
        input.householdDependents = [true];
        input.assets.valid = true;
        input.assets.values = [[100], [300]];
        expect(elig.vaPensionNetWorth(input, 0)).toBe(100);
      });
    });

    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(vaPensionMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.vaPensionResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingVaPensionHousehold = true;
      check(elig.vaPensionResult, input).isEnrolledIf(
        'existingVaPensionMe').is(true);
    });

    test('Requires veteran status', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.disabled = true;
      input.dutyPeriods = [validDutyPeriod];
      input.dischargeStatus = 'honorable';
      check(elig.vaPensionResult, input).isEligibleIf('veteran').is(true);
    });

    test('Requires discharge that is not dishonorable', () => {
      input.income.valid = true;
      input.assets.valid = true;
      input.veteran = true;
      input.disabled = true;
      input.dutyPeriods = [validDutyPeriod];
      input.dischargeStatus = 'honorable';
      check(elig.vaPensionResult, input)
        .isNotEligibleIf('dischargeStatus').is('dishonorable');
    });

    test('Requires adjusted income to be at or below the limit', () => {
      input.veteran = true;
      input.disabled = true;
      input.dutyPeriods = [validDutyPeriod];
      input.dischargeStatus = 'honorable';
      input.income.valid = true;
      input.assets.valid = true;
      check(elig.vaPensionResult, input).isEligibleIf('income.wages')
        .isAtMost(elig.cnst.vaPension.ANNUAL_INCOME_LIMITS[0] / 12);
    });

    test('Requires net worth to be at or below the limit', () => {
      input.veteran = true;
      input.disabled = true;
      input.dutyPeriods = [validDutyPeriod];
      input.dischargeStatus = 'honorable';
      input.income.valid = true;
      input.assets.valid = true;
      // All assets, no income
      check(elig.vaPensionResult, input).isEligibleIf('assets.values')
        .isAtMost(elig.cnst.vaPension.ANNUAL_NET_WORTH_LIMIT);

      input.assets.values = [[elig.cnst.vaPension.ANNUAL_NET_WORTH_LIMIT]];
      // Adding some income here should put the net worth over the limit.
      check(elig.vaPensionResult, input)
        .isNotEligibleIf('income.wages').is([[1]]);
    });

    test('Eligible when starting 90-day active duty before Sept 8, 1980, serving during wartime', () => {
      input.veteran = true;
      input.disabled = true;
      input.income.valid = true;
      input.assets.valid = true;
      input.dischargeStatus = 'honorable';

      // During wartime, early enough start date, duty duration too short
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1950-06-30T00:00'),
        end: new Date('1950-09-27T00:00'), // 89 day duration
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: input.dutyPeriods[0].type,
        start: input.dutyPeriods[0].start,
        end: dayAfter(input.dutyPeriods[0].end),
      }]);

      // During wartime, duration long enough, start date too late
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1990-08-02T00:00'), // Too late
        end: new Date('1990-12-02T00:00'),
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: input.dutyPeriods[0].type,
        start: new Date('1980-09-07T00:00'),
        end: input.dutyPeriods[0].end,
      }]);

      // Duration long enough, early enough start date, not during wartime
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1980-09-07T00:00'),
        end: new Date('1990-08-01T00:00'), // Just before Gulf War
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: input.dutyPeriods[0].type,
        start: input.dutyPeriods[0].start,
        end: dayAfter(input.dutyPeriods[0].end),
      }]);

      // Wrong duty type
      input.dutyPeriods = [{
        type: 'reserve-duty', // Invalid duty type
        start: new Date('1950-01-01T00:00'),
        end: new Date('1980-09-07T00:00'),
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: 'active-duty',
        start: input.dutyPeriods[0].start,
        end: input.dutyPeriods[0].end,
      }]);
    });

    test('Eligible when starting 24-month active duty after Sept 7, 1980, serving during wartime', () => {
      input.veteran = true;
      input.disabled = true;
      input.income.valid = true;
      input.assets.valid = true;
      input.dischargeStatus = 'honorable';

      // During wartime, late enough start date, duration too short
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1990-08-03T00:00'),
        end: new Date('1992-08-01T00:00'), // 729 days, note leap year
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: input.dutyPeriods[0].type,
        start: input.dutyPeriods[0].start,
        end: dayAfter(input.dutyPeriods[0].end),
      }]);
      check(elig.vaPensionResult, input)
        .isEligibleIf('servedFullDuration').is(true);

      // During wartime, duration long enough, start date too early
      // input.dutyPeriods = [{
      //   type: 'active-duty',
      //   start: new Date('1980-09-07T00:00'),  // Too early
      //   end: new Date('1990-08-03T00:00'),
      // }];
      // A typical check() will not work here because if only the start date is
      // too early, then the applicant will _still_ be eligible thanks to the
      // other pre-Sept 8, 1980 rules.  So we just verify the applicant is
      // eligible with the later start date of Sept 8, 1980.
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1980-09-08T00:00'),
        end: new Date('1990-08-03T00:00'),
      }];
      expect(elig.vaPensionResult(input).eligible).toBe(true);

      // Duration long enough, late enough start date, not during wartime
      input.dutyPeriods = [{
        type: 'active-duty',
        start: new Date('1980-09-08T00:00'),
        end: new Date('1990-08-01T00:00'), // Just before Gulf War
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: input.dutyPeriods[0].type,
        start: input.dutyPeriods[0].start,
        end: dayAfter(input.dutyPeriods[0].end),
      }]);

      // Wrong duty type
      input.dutyPeriods = [{
        type: 'reserve-duty',
        start: new Date('1980-09-08T00:00'),
        end: new Date('1990-08-02T00:00'),
      }];
      check(elig.vaPensionResult, input).isEligibleIf('dutyPeriods').is([{
        type: 'active-duty',
        start: input.dutyPeriods[0].start,
        end: input.dutyPeriods[0].end,
      }]);
    });

    test('Requires applicant be disabled, elderly, or receiving SSI or SSDI', () => {
      input.veteran = true;
      input.income.valid = true;
      input.assets.valid = true;
      input.dutyPeriods = [validDutyPeriod];
      input.dischargeStatus = 'honorable';
      check(elig.vaPensionResult, input).isEligibleIf('disabled').is(true);
      check(elig.vaPensionResult, input)
        .isEligibleIf('age').isAtLeast(elig.cnst.vaPension.MIN_ELDERLY_AGE);
      check(elig.vaPensionResult, input)
        .isEligibleIf('existingSsiMe').is(true);
      check(elig.vaPensionResult, input)
        .isEligibleIf('existingSsdiMe').is(true);
      check(elig.vaPensionResult, input).isEligibleIf(ssiMadeEligible);
      // Due to interactions between the VA Pension income limit and the SSDI
      // income limit, we need to add a dependent here to ensure the VA Pension
      // income limit is above the SSDI income limit for this test.
      input.householdSize = 2;
      input.householdDependents = [true];
      check(elig.vaPensionResult, input).isEligibleIf(ssdiMadeEligible);
    });
  });

  describe('VTA Paratransit Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.vtaParatransitResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      // Existing household assistance should not affect enrollment status.
      input.existingVtaParatransitHousehold = true;
      check(elig.vtaParatransitResult, input).isEnrolledIf(
        'existingVtaParatransitMe').is(true);
    });

    test('Requires disability', () => {
      check(elig.vtaParatransitResult, input).isEligibleIf('disabled').is(true);
    });
  });

  describe('WIC Program', () => {
    test('Eligible with input for other program dependencies', () => {
      verifyOverlay(wicMadeEligible(input));
    });

    test('Not eligible with default input', () => {
      expect(elig.wicResult(input).eligible).not.toBe(true);
    });

    test('Can be marked as already enrolled', () => {
      check(elig.wicResult, input).isEnrolledIf('existingWicMe').is(true);
      check(elig.wicResult, input).isEnrolledIf(
        'existingWicHousehold').is(true);
    });

    test('Eligible when gross income is at or below the income limit', () => {
      input.income.valid = true;
      input.pregnant = true;
      // Force ineligibility for CalFresh to explicitly test gross income only.
      input.citizen = false;
      input.immigrationStatus = 'qualified_noncitizen_le5y';
      check(elig.wicResult, input).isEligibleIf('income.wages')
        .isAtMost(elig.cnst.wic.MONTHLY_INCOME_LIMITS[0]);
    });

    test('Eligible when receiving specific existing assistance', () => {
      input.income.valid = false;
      input.pregnant = true;
      check(elig.wicResult, input)
        .isEligibleIf('existingMedicalMe').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('existingMedicalHousehold').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('existingCalworksMe').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('existingCalworksHousehold').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('existingCalfreshMe').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('existingCalfreshHousehold').is(true);

      check(elig.wicResult, input).isEligibleIf(calworksMadeEligible);
      check(elig.wicResult, input).isEligibleIf(calfreshMadeEligible);
    });

    test('Household size includes expected babies', () =>{
      input.income.valid = true;
      input.pregnant = true;
      input.unbornChildren = 1;
      // Force ineligibility for CalFresh to explicitly test gross income only.
      input.citizen = false;
      input.immigrationStatus = 'qualified_noncitizen_le5y';
      check(elig.wicResult, input).isEligibleIf('income.wages')
        .isAtMost(elig.cnst.wic.MONTHLY_INCOME_LIMITS[1]);
    });

    test('Eligible when anyone in the household is pregnant or was pregnant in the last 6 months', () => {
      input.income.valid = true;
      input.householdPregnant = [false, false];
      check(elig.wicResult, input).isEligibleIf('pregnant').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('householdPregnant').is([true, false]);
    });

    test('Eligible when anyone in the household is breastfeeding a baby under 1 year old', () => {
      input.income.valid = true;
      input.householdFeeding = [false, false];
      check(elig.wicResult, input).isEligibleIf('feeding').is(true);
      check(elig.wicResult, input)
        .isEligibleIf('householdFeeding').is([true, false]);
    });

    test('Eligible when the household includes a child or baby', () => {
      input.income.valid = true;
      input.householdAges = [elig.cnst.wic.CHILD_EXIT_AGE, 99];
      check(elig.wicResult, input).isEligibleIf('householdAges')
        .is([elig.cnst.wic.CHILD_EXIT_AGE - 1, 99]);
    });
  });

  describe('Clipper START Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.clipperStartResult(input).eligible).not.toBe(true);
    });

    test('Cannot have RTC Clipper Card', () => {
      input.income.valid = true;
      input.age = elig.cnst.clipper.MIN_ELIGIBLE_AGE;
      check(elig.clipperStartResult, input).isNotEligibleIf(
        'existingRtcClipperMe').is(true);
    });

    test('Age must be within the limits', () => {
      input.income.valid = true;
      input.existingRtcClipperMe = false;
      check(elig.clipperStartResult, input).isEligibleIf(
        'age').isAtLeast(elig.cnst.clipper.MIN_ELIGIBLE_AGE);
      check(elig.clipperStartResult, input).isEligibleIf(
        'age').isAtMost(elig.cnst.clipper.MAX_ELIGIBLE_AGE);
    });

    test('Income must be at or below the limit', () => {
      input.income.valid = true;
      input.existingRtcClipperMe = false;
      input.age = elig.cnst.clipper.MIN_ELIGIBLE_AGE;
      check(elig.clipperStartResult, input).isEligibleIf(
        'income.wages').isAtMost(
        elig.cnst.clipper.ANNUAL_INCOME_LIMITS[0] / 12);
    });
  });

  describe('Homelessness Prevention System Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.homelessnessPreventionResult(input)
        .eligible).not.toBe(true);
    });

    test('Income must be at or below the limit', () => {
      input.unhousedRisk = true;
      input.income.valid = true;
      input.housingSituation = 'housed';
      check(elig.homelessnessPreventionResult, input).isEligibleIf(
        'income.wages').isAtMost(elig.cnst.hps.ANNUAL_INCOME_LIMITS[0] / 12);
    });

    test('Must be housed', () => {
      input.income.valid = true;
      input.unhousedRisk = true;
      input.housingSituation = 'no-stable-place';
      check(elig.homelessnessPreventionResult, input).isEligibleIf(
        'housingSituation').is('housed');
      check(elig.homelessnessPreventionResult, input).isEligibleIf(
        'housingSituation').is('unlisted-stable-place');
    });

    test('Must be at risk of losing housing', () => {
      input.income.valid = true;
      input.housingSituation = 'housed';
      check(elig.homelessnessPreventionResult, input).isEligibleIf(
        'unhousedRisk').is(true);
    });

    // This program has a particularly complex income limit calculation for
    // household sizes above the maximum size listed in the limit table.  This
    // Test ensures the calculation was done correctly by checking against the
    // values given by the HUD income limit calculator.
    test('Extended income limit is computed correctly', () => {
      // https://www.huduser.gov/portal/datasets/il/il2024/2024ILCalc3080.odn?inputname=Santa+Clara+County&area_id=METRO41940M41940&fips=0608599999&type=county&year=2024&yy=24&stname=California&stusps=CA&statefp=06&ACS_Survey=%24ACS_Survey%24&State_Count=%24State_Count%24&areaname=%24passname%24&incpath=%24incpath%24&level=80
      const expectedAnnualLimitNinePpl = 204550;
      const expectedAnnualLimitTwentyFivePpl = 391550;

      input.income.valid = true;
      input.unhousedRisk = true;
      input.housingSituation = 'housed';

      input.householdSize = 9;
      let maxIncome = expectedAnnualLimitNinePpl / 12;
      check(elig.homelessnessPreventionResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);

      input.householdSize = 25;
      maxIncome = expectedAnnualLimitTwentyFivePpl / 12;
      check(elig.homelessnessPreventionResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });
  });

  describe('HUD VASH Program', () => {
    test('Not eligible with default input', () => {
      expect(elig.hudVashResult(input).eligible).not.toBe(true);
    });

    test('Requires veteran status', () => {
      input.income.valid = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      input.housingSituation = 'no-stable-place';
      check(elig.hudVashResult, input).isEligibleIf('veteran').is(true);
    });

    test('Eligible when unhoused', () => {
      input.income.valid = true;
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.housingSituation = 'housed';
      input.dutyPeriods = [{type: 'active-duty'}];
      check(elig.hudVashResult, input)
        .isEligibleIf('housingSituation').is('vehicle');
      check(elig.hudVashResult, input)
        .isEligibleIf('housingSituation').is('transitional');
      check(elig.hudVashResult, input)
        .isEligibleIf('housingSituation').is('hotel');
      check(elig.hudVashResult, input)
        .isEligibleIf('housingSituation').is('shelter');
      check(elig.hudVashResult, input)
        .isEligibleIf('housingSituation').is('no-stable-place');
    });

    test('Eligible when income is at or below the limit', () => {
      input.income.valid = true;
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.housingSituation = 'no-stable-place';
      check(elig.hudVashResult, input).isEligibleIf('income.wages')
        .isAtMost(elig.cnst.hudvash.ANNUAL_INCOME_LIMITS[0] / 12);
    });

    test('Requires discharge that is not dishonorable', () => {
      input.income.valid = true;
      input.housingSituation = 'no-stable-place';
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.dutyPeriods = [{type: 'active-duty'}];
      check(elig.hudVashResult, input)
        .isNotEligibleIf('dischargeStatus').is('dishonorable');
    });

    test('Eligible with U.S. citizenship', () => {
      input.income.valid = true;
      input.citizen = false;
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.housingSituation = 'no-stable-place';
      check(elig.hudVashResult, input)
        .isEligibleIf('citizen').is(true);
    });

    testImmigration(() => {
      input.income.valid = true;
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.housingSituation = 'no-stable-place';
    },
    elig.hudVashResult,
    );

    // TODO: test hudLargeFamilyCalc instead of copying this test code to each
    // program that uses that function.
    // This program has a particularly complex income limit calculation for
    // household sizes above the maximum size listed in the limit table.  This
    // Test ensures the calculation was done correctly by checking against the
    // values given by the HUD income limit calculator.
    test('Extended income limit is computed correctly', () => {
      // https://www.huduser.gov/portal/datasets/il/il2024/2024ILCalc3080.odn?inputname=Santa+Clara+County&area_id=METRO41940M41940&fips=0608599999&type=county&year=2024&yy=24&stname=California&stusps=CA&statefp=06&ACS_Survey=%24ACS_Survey%24&State_Count=%24State_Count%24&areaname=%24passname%24&incpath=%24incpath%24&level=80
      const expectedAnnualLimitNinePpl = 204550;
      const expectedAnnualLimitTwentyFivePpl = 391550;

      input.income.valid = true;
      input.veteran = true;
      input.dischargeStatus = 'honorable';
      input.housingSituation = 'no-stable-place';

      input.householdSize = 9;
      let maxIncome = expectedAnnualLimitNinePpl / 12;
      check(elig.hudVashResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);

      input.householdSize = 25;
      maxIncome = expectedAnnualLimitTwentyFivePpl / 12;
      check(elig.hudVashResult, input)
        .isEligibleIf('income.wages').isAtMost(maxIncome);
    });
  });
});
