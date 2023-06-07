
describe('Eligibility Assessment Tool', () => {
  beforeEach(() => {
    cy.visit('/public-assistance/eligibility/')
  });

  it('gets to final results page with data entry', () => {
    cy.get('#page-intro').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-yourself-start').should('be.visible');
    cy.get('#age').type('42');
    cy.get('#not-citizen').click();
    cy.get('#next-button').click();

    cy.get('#page-immigration-status').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-household-members').should('be.visible');
    cy.get('#next-button').click();

    cy.get('#page-household-situation').should('be.visible');
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
