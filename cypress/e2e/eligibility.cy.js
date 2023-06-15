function inputMoneyFor(alias) {
  const firstBtnRegex = /enter ((income)|(an asset))/i;
  const btnRegex = /add another ((entry)|(asset))/i;
  const inputRegex = /income|value/i;
  cy.get(alias).contains(firstBtnRegex).click();
  cy.get(alias).contains(btnRegex).click();
  cy.get(alias).contains(btnRegex).click();
  cy.get(alias).findAllByLabelText(inputRegex).eq(0).type('1000');
  cy.get(alias).findAllByLabelText(inputRegex).eq(1).type('450');
  cy.get(alias).findAllByLabelText(inputRegex).eq(2).type('50');
}

function inputMoney() {
  cy.get('@page').contains('fieldset', 'Myself').as('myself');
  cy.get('@page').contains('fieldset', 'Alan').as('member2');
  inputMoneyFor('@myself');
  cy.get('@page').should('include.text', '$1,500');
  cy.get('@myself').findAllByText(/remove/i).eq(1).click();
  cy.get('@page').should('include.text', '$1,050');
  inputMoneyFor('@member2');
  cy.get('@page').should('include.text', '$2,550');
  cy.get('@member2').findAllByText(/remove/i).eq(1).click();
  cy.get('@page').should('include.text', '$2,100');
}

function yourselfChecks() {
  cy.get('@yourself').should('be.enabled');
  cy.get('@household').should('be.disabled');
  cy.get('@income').should('be.disabled');
  cy.get('@existing').should('be.disabled');
  cy.get('@results').should('be.disabled');
}

function householdChecks() {
  cy.get('@yourself').should('be.enabled');
  cy.get('@household').should('be.enabled');
  cy.get('@income').should('be.disabled');
  cy.get('@existing').should('be.disabled');
  cy.get('@results').should('be.disabled');
}

function incomeChecks() {
  cy.get('@yourself').should('be.enabled');
  cy.get('@household').should('be.enabled');
  cy.get('@income').should('be.enabled');
  cy.get('@existing').should('be.disabled');
  cy.get('@results').should('be.disabled');
}

function nextShouldBe(selector, nextAlias='@next') {
  cy.get(nextAlias).click();
  cy.get(selector).should('be.visible');
  cy.get('@back').click();
  cy.get('@page').should('be.visible');
  cy.get(nextAlias).click();
  cy.get(selector).as('page').should('be.visible');
}


describe('Eligibility Assessment Tool', () => {
  beforeEach(() => {
    cy.visit('/public-assistance/eligibility/');
  });

  // This is a bit of a smoke test, just verifying overall functionality.
  it('gets to final results page with data entry', () => {
    cy.get('#page-intro').should('be.visible');
    cy.contains('button', 'Yourself').as('yourself').should('be.disabled');
    cy.contains('button', 'Household').as('household').should('be.disabled');
    cy.contains('button', 'Income & Assets').as('income').should('be.disabled');
    cy.contains('button', 'Existing Benefits').as('existing')
      .should('be.disabled');
    cy.contains('button', 'Results').as('results').should('be.disabled');
    cy.contains('button', 'Next').as('next').click();
    cy.contains('button', 'Back').as('back');
    cy.contains('button', 'Finish').as('finish');

    cy.get('#page-yourself-start').as('page').should('be.visible');
    yourselfChecks();
    cy.get('@page').findByLabelText(/How old are you/i).type('15');

    const yourselfDetails = [
      /i am not a u.s. citizen/i,
      /i am disabled/i,
      /i am a u.s. veteran/i,
      /i am pregnant/i,
    ];
    cy.wrap(yourselfDetails).each((yourselfDetail) => {
      cy.get('@page').findByLabelText(yourselfDetail).click();
    });
    cy.get('@page').findByLabelText(/none of these describe me/i).click();
    cy.wrap(yourselfDetails).each((yourselfDetail) => {
      cy.get('@page').findByLabelText(yourselfDetail).should('be.disabled');
      cy.get('@page').findByLabelText(yourselfDetail).should('not.be.selected');
    });
    cy.get('@page').findByLabelText(/none of these describe me/i).click();
    cy.wrap(yourselfDetails).each((yourselfDetail) => {
      cy.get('@page').findByLabelText(yourselfDetail).click();
    });

    nextShouldBe('#page-head-of-household');
    yourselfChecks();
    cy.get('@page').contains('div', 'head of your household')
      .findByLabelText(/yes/i).click();

    nextShouldBe('#page-disability-details');
    yourselfChecks();
    cy.get('@page').contains('div', 'use a guide, signal or service dog')
      .findByLabelText(/yes/i).click();
    cy.get('@page').contains('div', 'related to your military service')
      .findByLabelText(/yes/i).click();

    nextShouldBe('#page-veteran-details');
    yourselfChecks();
    cy.get('@page').findByLabelText(/your discharge status/i).as('select')
      .select('Honorable');
    cy.get('@page').contains('button', 'Add another').click();
    cy.get('@page').contains('li', /duty period 1/i).as('period1');
    cy.get('@period1').findByLabelText(/duty type/i).select('Active duty');
    cy.get('@period1').findByLabelText(/served from/i).type('2020-01-01');
    cy.get('@period1').findByLabelText(/until/i).type('2020-01-02');
    cy.get('@page').contains('li', /duty period 2/i).as('period2');
    cy.get('@period2').findByLabelText(/duty type/i).select('Reserve duty');
    cy.get('@period2').findByLabelText(/served from/i).type('1960-01-01');
    cy.get('@period2').findByLabelText(/until/i).type('1970-01-01');

    nextShouldBe('#page-veteran-duty-period');
    yourselfChecks();
    cy.get('@page').contains('fieldset', 'from 1/1/2020 until 1/2/2020')
      .findByLabelText(/yes/i).click();

    nextShouldBe('#page-immigration-status');
    yourselfChecks();
    cy.get('@page').findByLabelText(/temporarily/i).click();

    nextShouldBe('#page-household-members');
    householdChecks();
    cy.get('@page').contains('button', 'Add a new').as('add').click();
    cy.get('@add').click();
    cy.get('@page').contains('li', /myself/i).as('myself');
    cy.get('@page').contains('li', /member 2/i).as('member2');
    cy.get('@page').contains('li', /member 3/i).as('member3');
    cy.get('@myself').findByLabelText(/age/i).as('myAge').clear();
    cy.get('@myAge').type('16');
    cy.get('@member2').findByLabelText(/name/i).as('member2Name').type('Ruth');
    cy.get('@member2Name').blur();
    cy.get('@page').contains('li', 'Ruth').as('member2');
    cy.get('@member2').findByLabelText(/age/i).type('19');
    cy.get('@member2').findByLabelText(/spouse/i).as('member2Spouse').click();
    cy.get('@member3').findByLabelText(/name/i).as('member3Name').type('Alan');
    cy.get('@member3Name').blur();
    cy.get('@page').contains('li', 'Alan').as('member3');
    cy.get('@member3').findByLabelText(/age/i).type('22');
    cy.get('@member3').findByLabelText(/spouse/i).click();
    cy.get('@member2Spouse').should('not.be.selected');
    cy.get('@member2').contains('remove').click();
    cy.get('@page').should('not.include.text', 'Ruth');

    nextShouldBe('#page-household-unborn-members');
    householdChecks();
    cy.get('@page').findByLabelText(/unborn children/i).type('2');

    nextShouldBe('#page-household-situation');
    householdChecks();
    cy.findByLabelText(/apartment/i).click();

    nextShouldBe('#page-household-housed');
    householdChecks();
    cy.get('@page').contains('div', 'pay a gas or electric bill')
      .findByLabelText(/yes/i).click();
    cy.get('@page').contains('div', 'have cooking facilities')
      .findByLabelText(/no/i).click();
    cy.get('@page').contains('div', 'at risk of losing your home')
      .findByLabelText(/no/i).click();

    nextShouldBe('#page-income');
    incomeChecks();
    const incomeTypes = [
      /wages/i,
      /self-employment/i,
      /disability/i,
      /unemployment benefits/i,
      /retirement benefits/i,
      /veteran.s benefits/i,
      /worker.s compensation/i,
      /child support/i,
      /other source/i,
    ];
    cy.wrap(incomeTypes).each((incomeType) => {
      cy.get('@page').findByLabelText(incomeType).click();
    });
    cy.get('@page').findByLabelText(/no income/i).click();
    cy.wrap(incomeTypes).each((incomeType) => {
      cy.get('@page').findByLabelText(incomeType).should('be.disabled');
      cy.get('@page').findByLabelText(incomeType).should('not.be.selected');
    });
    cy.get('@page').findByLabelText(/no income/i).click();
    cy.wrap(incomeTypes).each((incomeType) => {
      cy.get('@page').findByLabelText(incomeType).click();
    });

    nextShouldBe('#page-income-details-wages');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-self-employed');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-disability');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-unemployment');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-retirement');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-veterans');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-workers-comp');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-child-support');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-income-details-other');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-ss-taxes');
    incomeChecks();
    cy.get('@page').contains('div', 'paid Social Security taxes')
      .findByLabelText(/yes/i).click();

    nextShouldBe('#page-income-assets');
    incomeChecks();
    inputMoney();

    nextShouldBe('#page-existing-benefits');
    cy.get('@yourself').should('be.enabled');
    cy.get('@household').should('be.enabled');
    cy.get('@income').should('be.enabled');
    cy.get('@existing').should('be.enabled');
    cy.get('@results').should('be.disabled');
    cy.get('@page')
      .findByRole('checkbox', {name: /general assistance .* me/i}).click();
    cy.get('@page')
      .findByRole('checkbox', {name: /lifeline .* household/i}).click();

    nextShouldBe('#page-results', '@finish');
    cy.get('@yourself').should('be.enabled');
    cy.get('@household').should('be.enabled');
    cy.get('@income').should('be.enabled');
    cy.get('@existing').should('be.enabled');
    cy.get('@results').should('be.enabled');

    cy.get('@yourself').click();
    cy.get('#page-yourself-start').should('be.visible');
    cy.get('@household').click();
    cy.get('#page-household-members').should('be.visible');
    cy.get('@income').click();
    cy.get('#page-income').should('be.visible');
    cy.get('@existing').click();
    cy.get('#page-existing-benefits').should('be.visible');
    cy.get('@results').click();
    cy.get('#page-results').should('be.visible');
  });
});
