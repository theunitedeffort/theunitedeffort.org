require('./commands');

// https://dev.to/tylerben/catching-console-error-statements-in-cypress-1b4g
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callsFake((msg) => {
    // Log to the terminal
    cy.now('task', 'error', msg);
    // Log to Command Log and fail the test
    throw new Error(msg);
  });

  cy.stub(win.console, 'warn').callsFake((msg) => {
    // Log to the terminal
    cy.now('task', 'warn', msg);
  });
});


