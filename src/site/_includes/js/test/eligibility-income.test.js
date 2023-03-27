const elig = require('../eligibility');

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
	// TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
  	const input = {
  		income: {
  			valid: true,
  			wages: [[]],
  			selfEmployed: [[]],
  			disability: [[]],
  			unemployment: [[]],
  			veterans: [[]],
  			workersComp: [[]],
  			childSupport: [[]],
  			retirement: [[]],
  			other: [[]],
  		}
  	};
  	expect(elig.totalEarnedIncome(input)).toBe(0);
  });

  test('Sums all earned income only', () => {
    const input = {
  		income: {
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
  		}
  	};
  	expect(elig.totalEarnedIncome(input)).toBe(900);
  });

  test('Sums only earned income from specified group indices', () => {
  	const input = {
  		income: {
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
  		}
  	};
  	expect(elig.totalEarnedIncome(input, 1)).toBe(400);
  	expect(elig.totalEarnedIncome(input, [0, 1])).toBe(900);
  	expect(elig.totalEarnedIncome(input, null)).toBe(900);
  });
});

describe('totalUnearnedIncome', () => {
  // TODO: how to protect against forgetting a newly-added income type?
  test('Returns 0 for empty income array', () => {
  	const input = {
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
  	expect(elig.totalUnearnedIncome(input)).toBe(0);
  });

  test('Sums all unearned income only', () => {
    const input = {
  		income: {
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
  		}
  	};
  	expect(elig.totalUnearnedIncome(input)).toBe(800);
  });

  test('Sums only unearned income from specified group indices', () => {
  	const input = {
  		income: {
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
  		}
  	};
  	expect(elig.totalUnearnedIncome(input, 1)).toBe(50);
  	expect(elig.totalUnearnedIncome(input, [0, 1])).toBe(800);
  	expect(elig.totalUnearnedIncome(input, null)).toBe(800);
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