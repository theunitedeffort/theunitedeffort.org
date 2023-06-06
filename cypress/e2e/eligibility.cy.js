
describe('Eligibility Assessment Tool', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/public-assistance/eligibility/')
  });

  it('gets to final results page with no data entry', () => {
    cy.get('#page-intro').should('be.visible');
    cy.get('#next-button').click();
    cy.get('#page-yourself-start').should('be.visible');
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
