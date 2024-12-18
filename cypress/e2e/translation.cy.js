describe('Client-side Translation', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('defaults to English', () => {
    cy.findByText('Our Mission').should('exist');
  });

  it('translates to Spanish', () => {
    cy.findByRole('link', {name: 'Español'}).click();
    cy.findByText('Nuestra misión').should('exist');
  });

  it('translates to Vietnamese', () => {
    cy.findByRole('link', {name: 'Tiếng Việt'}).click();
    cy.findByText('Sứ mệnh của chúng tôi').should('exist');
  });

  it('translates to Chinese', () => {
    cy.findByRole('link', {name: '简体中文'}).click();
    cy.findByText('我们的使命').should('exist');
  });

  it('translates to Russian', () => {
    cy.findByRole('link', {name: 'Русский'}).click();
    cy.findByText('Наша миссия').should('exist');
  });
});
