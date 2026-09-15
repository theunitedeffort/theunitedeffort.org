const elig = require('../eligibility');

// TODO: Reset emptyInput each time in case it changes in a test.
const emptyInput = {
  income: {
    valid: true,
    wages: [[], []],
    selfEmployed: [[], []],
    disability: [[], []],
    unemployment: [[], []],
    veterans: [[], []],
    workersComp: [[], []],
    childSupport: [[], []],
    guaranteed: [[], []],
    retirement: [[], []],
    other: [[], []],
  },
  assets: {
    valid: true,
    values: [[], []],
  },
};

describe('categoryTotal', () => {
  test('Returns 0 for an empty income array', () => {
    expect(elig.categoryTotal([
      [],
    ])).toBe(0);
    expect(elig.categoryTotal([
      [],
      [],
      [],
    ])).toBe(0);
  });

  test('Sums all income array values', () => {
    expect(elig.categoryTotal([[10], [20], [30]])).toBe(60);
    expect(elig.categoryTotal([[10], [20, 40], []])).toBe(70);
  });

  test('Sums income array values from specified group indices', () => {
    const income = [[10], [20, 40], [30]];
    expect(elig.categoryTotal(income, 1)).toBe(60);
    expect(elig.categoryTotal(income, [1, 2])).toBe(90);
    expect(elig.categoryTotal(income, null)).toBe(100);
  });

  test('Out of bounds indices are ignored', () => {
    expect(elig.categoryTotal([[10], [20], [30]], 3)).toBe(0);
    expect(elig.categoryTotal([[]], 0)).toBe(0);
  });
});

describe('totalEarnedIncome', () => {
  const testInput = {};
  beforeEach(() => {
    testInput.income = {
      valid: true,
      wages: [[100], [400]],
      selfEmployed: [[200, 200], []],
      disability: [[99], [99]],
      unemployment: [[99], [99]],
      veterans: [[99], [99]],
      workersComp: [[99], [99]],
      childSupport: [[99], [99]],
      guaranteed: [[99], [99]],
      retirement: [[99], [99]],
      other: [[99], [99]],
    };
  });

  // TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
    expect(elig.totalEarnedIncome(emptyInput)).toBe(0);
  });

  test('Sums all earned income only', () => {
    expect(elig.totalEarnedIncome(testInput)).toBe(900);
  });

  test('Sums only earned income from specified group indices', () => {
    expect(elig.totalEarnedIncome(testInput, 1)).toBe(400);
    expect(elig.totalEarnedIncome(testInput, [0, 1])).toBe(900);
    expect(elig.totalEarnedIncome(testInput, null)).toBe(900);
  });

  test('Returns NaN for invalid input', () => {
    testInput.income.valid = false;
    expect(elig.totalEarnedIncome(testInput)).toBe(NaN);
  });
});

describe('totalUnearnedIncome', () => {
  const testInput = {};
  beforeEach(() => {
    testInput.income = {
      valid: true,
      wages: [[99], [99]],
      selfEmployed: [[99], [99]],
      disability: [[100, 50], [50]],
      unemployment: [[100], []],
      veterans: [[100], []],
      workersComp: [[100], []],
      childSupport: [[100], []],
      guaranteed: [[100], []],
      retirement: [[100], []],
      other: [[100], []],
    };
  });

  // TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
    expect(elig.totalUnearnedIncome(emptyInput)).toBe(0);
  });

  test('Sums all unearned income only', () => {
    expect(elig.totalUnearnedIncome(testInput)).toBe(900);
  });

  test('Sums only unearned income from specified group indices', () => {
    expect(elig.totalUnearnedIncome(testInput, 1)).toBe(50);
    expect(elig.totalUnearnedIncome(testInput, [0, 1])).toBe(900);
    expect(elig.totalUnearnedIncome(testInput, null)).toBe(900);
  });

  test('Returns NaN for invalid input', () => {
    testInput.income.valid = false;
    expect(elig.totalUnearnedIncome(testInput)).toBe(NaN);
  });
});

describe('grossIncome', () => {
  const testInput = {};
  beforeEach(() => {
    testInput.income = {
      valid: true,
      wages: [[100], []],
      selfEmployed: [[100], []],
      disability: [[100, 50], [50]],
      unemployment: [[100], []],
      veterans: [[100], []],
      workersComp: [[100], []],
      childSupport: [[100], []],
      guaranteed: [[100], []],
      retirement: [[100], []],
      other: [[100], []],
    };
  });

  test('Returns 0 for empty income array', () => {
    expect(elig.grossIncome(emptyInput)).toBe(0);
  });

  test('Sums all income', () => {
    expect(elig.grossIncome(testInput)).toBe(1100);
  });

  test('Sums only income from specified group indices', () => {
    expect(elig.grossIncome(testInput, 1)).toBe(50);
    expect(elig.grossIncome(testInput, [0, 1])).toBe(1100);
    expect(elig.grossIncome(testInput, null)).toBe(1100);
  });

  test('Returns NaN for invalid input', () => {
    testInput.income.valid = false;
    expect(elig.grossIncome(testInput)).toBe(NaN);
  });
});

describe('totalResources', () => {
  const testInput = {};
  beforeEach(() => {
    testInput.assets = {
      valid: true,
      values: [[42, 10], [8], [100]],
    };
  });
  test('Returns 0 for an empty assets array', () => {
    expect(elig.totalResources(emptyInput)).toBe(0);
  });

  test('Sums all assets array values', () => {
    expect(elig.totalResources(testInput)).toBe(160);
  });

  test('Sums assets array values from specified group indices', () => {
    expect(elig.totalResources(testInput, 1)).toBe(8);
    expect(elig.totalResources(testInput, [0, 2])).toBe(152);
    expect(elig.totalResources(testInput, null)).toBe(160);
  });

  test('Returns NaN for invalid input', () => {
    testInput.assets.valid = false;
    expect(elig.totalResources(testInput)).toBe(NaN);
  });
});
