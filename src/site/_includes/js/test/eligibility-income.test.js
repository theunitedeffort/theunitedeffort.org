const elig = require('../eligibility');

const empty_input = {
  income: {
    valid: true,
    wages: [[], []],
    selfEmployed: [[], []],
    disability: [[], []],
    unemployment: [[], []],
    veterans: [[], []],
    workersComp: [[], []],
    childSupport: [[], []],
    retirement: [[], []],
    other: [[], []],
  }
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
});

describe('totalEarnedIncome', () => {
  const test_input = {};
  beforeEach(() => {
    test_input.income = {
      valid: true,
      wages: [[100], [400]],
      selfEmployed: [[200, 200], []],
      disability: [[99], [99]],
      unemployment: [[99], [99]],
      veterans: [[99], [99]],
      workersComp: [[99], [99]],
      childSupport: [[99], [99]],
      retirement: [[99], [99]],
      other: [[99], [99]],
    };
  });

  // TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
    expect(elig.totalEarnedIncome(empty_input)).toBe(0);
  });

  test('Sums all earned income only', () => {
    expect(elig.totalEarnedIncome(test_input)).toBe(900);
  });

  test('Sums only earned income from specified group indices', () => {
    expect(elig.totalEarnedIncome(test_input, 1)).toBe(400);
    expect(elig.totalEarnedIncome(test_input, [0, 1])).toBe(900);
    expect(elig.totalEarnedIncome(test_input, null)).toBe(900);
  });

  test('Returns NaN for invalid input', () => {
    test_input.income.valid = false;
    expect(elig.totalEarnedIncome(test_input)).toBe(NaN);
  });
});

describe('totalUnearnedIncome', () => {
  const test_input = {};
  beforeEach(() => {
    test_input.income = {
      valid: true,
      wages: [[99], [99]],
      selfEmployed: [[99], [99]],
      disability: [[100, 50], [50]],
      unemployment: [[100], []],
      veterans: [[100], []],
      workersComp: [[100], []],
      childSupport: [[100], []],
      retirement: [[100], []],
      other: [[100], []],
    };
  });

  // TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
    expect(elig.totalUnearnedIncome(empty_input)).toBe(0);
  });

  test('Sums all unearned income only', () => {
    expect(elig.totalUnearnedIncome(test_input)).toBe(800);
  });

  test('Sums only unearned income from specified group indices', () => {
    expect(elig.totalUnearnedIncome(test_input, 1)).toBe(50);
    expect(elig.totalUnearnedIncome(test_input, [0, 1])).toBe(800);
    expect(elig.totalUnearnedIncome(test_input, null)).toBe(800);
  });

  test('Returns NaN for invalid input', () => {
    test_input.income.valid = false;
    expect(elig.totalUnearnedIncome(test_input)).toBe(NaN);
  });
});

describe('grossIncome', () => {
  const test_input = {};
  beforeEach(() => {
    test_input.income = {
      valid: true,
      wages: [[100], []],
      selfEmployed: [[100], []],
      disability: [[100, 50], [50]],
      unemployment: [[100], []],
      veterans: [[100], []],
      workersComp: [[100], []],
      childSupport: [[100], []],
      retirement: [[100], []],
      other: [[100], []],
    };
  });

  test('Returns 0 for empty income array', () => {
    expect(elig.grossIncome(empty_input)).toBe(0);
  });

  test('Sums all income', () => {
    expect(elig.grossIncome(test_input)).toBe(1000);
  });

  test('Sums only income from specified group indices', () => {
    expect(elig.grossIncome(test_input, 1)).toBe(50);
    expect(elig.grossIncome(test_input, [0, 1])).toBe(1000);
    expect(elig.grossIncome(test_input, null)).toBe(1000);
  });

  test('Returns NaN for invalid input', () => {
    test_input.income.valid = false;
    expect(elig.grossIncome(test_input)).toBe(NaN);
  });
});

describe('totalResources', () => {
  test('Returns 0 for an empty assets array', () => {
    const input = {
      assets: [[], []]
    };
    expect(elig.totalResources(input)).toBe(0);
  });

  test('Sums all assets array values', () => {
    const input = {
      assets: [[42, 10], [8], [100]]
    };
    expect(elig.totalResources(input)).toBe(160);
  });

  test('Sums assets array values from specified group indices', () => {
    const input = {
      assets: [[42, 10], [8], [100]]
    };
    expect(elig.totalResources(input, 1)).toBe(8);
    expect(elig.totalResources(input, [0, 2])).toBe(152);
    expect(elig.totalResources(input, null)).toBe(160);
  });
});