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

describe('Eligibility Assessment Tool', () => {
  beforeEach(() => {
    cy.visit('/public-assistance/eligibility/');
  });

  // This is a bit of a smoke test, just verifying overall functionality.
  it('gets to final results page with data entry', () => {
    cy.get('#page-intro').should('be.visible');
    cy.contains('button', 'Next').as('next').click();

    cy.get('#page-yourself-start').as('page').should('be.visible');
    cy.get('@page').findByLabelText(/How old are you/i).type('15');
    cy.get('@page').findByLabelText(/I am not a U.S. citizen/i).click();
    cy.get('@page').findByLabelText(/I am disabled/i).click();
    cy.get('@page').findByLabelText(/I am a U.S. veteran/i).click();
    cy.get('@page').findByLabelText(/I am pregnant/i).click();
    cy.get('@next').click();

    cy.get('#page-head-of-household').as('page').should('be.visible');
    cy.get('@page').contains('div', 'head of your household')
      .findByLabelText(/yes/i).click();
    cy.get('@next').click();

    cy.get('#page-disability-details').as('page').should('be.visible');
    cy.get('@page').contains('div', 'use a guide, signal or service dog')
      .findByLabelText(/yes/i).click();
    cy.get('@page').contains('div', 'related to your military service')
      .findByLabelText(/yes/i).click();
    cy.get('@next').click();

    cy.get('#page-veteran-details').as('page').should('be.visible');
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
    cy.get('#next-button').click();

    cy.get('#page-veteran-duty-period').as('page').should('be.visible');
    cy.get('@page').contains('fieldset', 'from 1/1/2020 until 1/2/2020')
      .findByLabelText(/yes/i).click();
    cy.get('#next-button').click();

    cy.get('#page-immigration-status').as('page').should('be.visible');
    cy.get('@page').findByLabelText(/temporarily/i).click();
    cy.get('#next-button').click();

    cy.get('#page-household-members').as('page').should('be.visible');
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
    cy.get('#next-button').click();

    cy.get('#page-household-unborn-members').as('page').should('be.visible');
    cy.get('@page').findByLabelText(/unborn children/i).type('2');
    cy.get('#next-button').click();

    cy.get('#page-household-situation').as('page').should('be.visible');
    cy.findByLabelText(/apartment/i).click();
    cy.get('#next-button').click();

    cy.get('#page-household-housed').as('page').should('be.visible');
    cy.get('@page').contains('div', 'pay a gas or electric bill')
      .findByLabelText(/yes/i).click();
    cy.get('@page').contains('div', 'have cooking facilities')
      .findByLabelText(/no/i).click();
    cy.get('@page').contains('div', 'at risk of losing your home')
      .findByLabelText(/no/i).click();
    cy.get('#next-button').click();

    cy.get('#page-income').as('page').should('be.visible');
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
    cy.get('#next-button').click();

    cy.get('#page-income-details-wages').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-self-employed').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-disability').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-unemployment').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-retirement').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-veterans').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-workers-comp').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-child-support').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-income-details-other').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-ss-taxes').as('page').should('be.visible');
    cy.get('@page').contains('div', 'paid Social Security taxes')
      .findByLabelText(/yes/i).click();
    cy.get('#next-button').click();

    cy.get('#page-income-assets').as('page').should('be.visible');
    inputMoney();
    cy.get('#next-button').click();

    cy.get('#page-existing-benefits').as('page').should('be.visible');
    cy.get('#submit-button').click();

    cy.get('#page-results').as('page').should('be.visible');
  });
});
