
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

    cy.get('#page-income').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-ss-taxes').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-income-assets').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-existing-benefits').should('be.visible');
    cy.get('#submit-button').click();

    cy.get('#page-results').should('be.visible');
  });
});
