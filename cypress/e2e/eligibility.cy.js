const langText = {'en': 'English', 'es': 'Español'};
const strs = {
  'navYourself': {
    'en': 'Yourself',
    'es': 'Tú mismo',
  },
  'navHousehold': {
    'en': 'Household',
    'es': 'Familiar',
  },
  'navIncomeAssets': {
    'en': 'Income & Assets',
    'es': 'Ingresos y activos',
  },
  'navExistingBenefits': {
    'en': 'Existing Benefits',
    'es': 'Beneficios existentes',
  },
  'navResults': {
    'en': 'Results',
    'es': 'Resultados',
  },
  'buttonNext': {
    'en': 'Next',
    'es': 'Próximo',
  },
  'buttonBack': {
    'en': 'Back',
    'es': 'Atrás',
  },
  'buttonFinish': {
    'en': 'Finish',
    'es': 'Finalizar',
  },
  'buttonAddAnother': {
    'en': 'Add another',
    'es': /((agregar)|(añadir)) otro/i,
  },
  'buttonAddNew': {
    'en': 'Add a new',
    'es': /((agregar)|(añadir)) un nuevo/i,
  },
  'fieldYes': {
    'en': /yes/i,
    'es': /sí/i,
  },
  'fieldHowOld': {
    'en': /How old are you/i,
    'es': /Cuántos años tiene/i,
  },
  'fieldNoncitizen': {
    'en': /i am not a u.s. citizen/i,
    'es': /no soy ciudadano estadounidense/i,
  },
  'fieldDisabled': {
    'en': /i am disabled/i,
    'es': /soy discapacitado/i,
  },
  'fieldVeteran': {
    'en': /i am a u.s. veteran/i,
    'es': /soy un veterano de los estados unidos/i,
  },
  'fieldPregnant': {
    'en': /i am pregnant/i,
    'es': /estoy embarazada/i,
  },
  'fieldNoneDescribeMe': {
    'en': /none of these describe me/i,
    'es': /ningun(o|a) de est(o|a)s me describe/i,
  },
  'fieldHeadHousehold': {
    'en': 'head of your household',
    'es': /el ((cabeza de familia)|(jefe de su hogar))/i,
  },
  'fieldGuideDog': {
    'en': 'use a guide, signal or service dog',
    'es': 'Utiliza un perro guía, de señales o de servicio',
  },
  'fieldMilitaryDisability': {
    'en': 'related to your military service',
    'es': 'relacionada con su servicio militar',
  },
  'fieldDischargeStatus': {
    'en': /your discharge status/i,
    'es': /su estado de alta/i,
  },
  'dutyPeriod': {
    'en': 'duty period',
    'es': 'per(í|i)odo de servicio',
  },
  'dutyType': {
    'en': /duty type/i,
    'es': /tipo de ((servicio)|(deber))/i,
  },
  'startDate': {
    'en': /start date/i,
    'es': /fecha de inicio/i,
  },
  'endDate': {
    'en': /end date/i,
    'es': /fecha de finalización/i,
  },
  'month': {
    'en': /month/i,
    'es': /mes/i,
  },
  'day': {
    'en': /day/i,
    'es': /día/i,
  },
  'year': {
    'en': /year/i,
    'es': /año/i,
  },
  'honorable': {
    'en': 'Honorable',
    'es': 'Honorable',
  },
  'activeDuty': {
    'en': 'Active duty',
    'es': 'Servicio activo',
  },
  'reserveDuty': {
    'en': 'Reserve duty',
    'es': 'Servicio de reserva',
  },
  'dutyPeriodDates': {
    'en': /from 1\/1\/2020 until 1\/2\/2020/i,
    'es': /desde 1\/1\/2020 hasta 1\/2\/2020/i,
  },
  'temporarily': {
    'en': /temporarily/i,
    'es': /temporalmente/i,
  },
  'myself': {
    'en': /myself/i,
    'es': /mí mismo/i,
  },
  'member': {
    'en': 'member',
    'es': 'miembro del hogar',
  },
  'age': {
    'en': /age/i,
    'es': /edad/i,
  },
  'name': {
    'en': /name/i,
    'es': /nombre/i,
  },
  'spouse': {
    'en': /spouse/i,
    'es': /cónyuge/i,
  },
  'remove': {
    'en': /remove/i,
    'es': /eliminar/i,
  },
  'unbornChildren': {
    'en': /unborn children/i,
    'es': /niños ((por nacer)|(no nacidos))/i,
  },
  'apartment': {
    'en': /apartment/i,
    'es': /apartamento/i,
  },
  'payGasBill': {
    'en': 'pay a gas or electric bill',
    'es': 'paga una factura de gas o electricidad',
  },
  'cookingFacilities': {
    'en': /have cooking facilities/i,
    'es': /tiene (usted)? instalaciones para cocinar/i,
  },
  'wages': {
    'en': /wages/i,
    'es': /salarios/i,
  },
  'selfEmployment': {
    'en': /self-employment/i,
    'es': /ingresos por cuenta propia/i,
  },
  'disability': {
    'en': /disability/i,
    'es': /discapacidad/i,
  },
  'unemployment': {
    'en': /unemployment benefits/i,
    'es': /beneficios de desemple(ad)?o/i,
  },
  'retirement': {
    'en': /retirement benefits/i,
    'es': /beneficios de jubilación/i,
  },
  'veterans': {
    'en': /veteran.s benefits/i,
    'es': /beneficios para veteranos/i,
  },
  'workersComp': {
    'en': /worker.s compensation/i,
    'es': /compensación ((laboral)|(del trabajador))/i,
  },
  'childSupport': {
    'en': /child support/i,
    'es': /manutención ((infantil)|(de los hijos))/i,
  },
  'guaranteed': {
    'en': /guaranteed income/i,
    // TODO: Translate to Spanish
  },
  'otherSource': {
    'en': /other source/i,
    'es': /otra fuente/i,
  },
  'noIncome': {
    'en': /no income/i,
    'es': /no tiene ingresos/i,
  },
  'firstMoneyAdd': {
    'en': /enter ((income)|(an asset))/i,
    'es': /(ingrese los ingresos)|(introduzca un activo)/i,
  },
  'nextMoneyAdd': {
    'en': /add another ((entry)|(asset))/i,
    'es': /((agregar)|(añadir)) otr(a|o) ((entrada)|(activo))/i,
  },
  'moneyLabel': {
    'en': /income|value/i,
    'es': /ingresos|valor/i,
  },
  'ssTaxes': {
    'en': 'paid Social Security taxes',
    'es': 'pagado impuestos del Seguro Social',
  },
  'noAssets': {
    'en': /no assets/i,
    'es': /no tiene bienes/i,
  },
  'enterAsset': {
    'en': /enter an asset/i,
    'es': /introduzca un activo/i,
  },
  'gaExistingMe': {
    'en': /general assistance .* me/i,
    'es': /asistencia general .* mí/i,
  },
  'lifelineExistingHouse': {
    'en': /lifeline .* household/i,
    'es': /línea de vida .* mi casa/i,
  },
  'lifelineTitle': {
    'en': 'California LifeLine',
    'es': 'Línea de vida de California',
  },
};


function inputMoneyFor(alias, lang) {
  const firstBtnRegex = strs.firstMoneyAdd[lang];
  const btnRegex = strs.nextMoneyAdd[lang];
  const inputRegex = strs.moneyLabel[lang];
  cy.get(alias).contains(firstBtnRegex).click();
  cy.get(alias).contains(btnRegex).click();
  cy.get(alias).contains(btnRegex).click();
  cy.get(alias).findAllByLabelText(inputRegex).eq(0).type('1000');
  cy.get(alias).findAllByLabelText(inputRegex).eq(1).type('450');
  cy.get(alias).findAllByLabelText(inputRegex).eq(2).type('50');
}

function inputMoney(lang) {
  cy.get('@page').contains('fieldset', strs.myself[lang]).as('myself');
  cy.get('@page').contains('fieldset', 'Alan').as('member2');
  inputMoneyFor('@myself', lang);
  cy.get('@page').contains('$1,500');
  cy.get('@myself').findAllByText(strs.remove[lang]).eq(1).click();
  cy.get('@page').contains('$1,050');
  inputMoneyFor('@member2', lang);
  cy.get('@page').contains('$2,550');
  cy.get('@member2').findAllByText(strs.remove[lang]).eq(1).click();
  cy.get('@page').contains('$2,100');
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

function e2eTest(lang) {
  // Only click on a language if one is explicitly given.
  if (lang) {
    cy.findByRole('link', {name: langText[lang]}).click();
  } else {
    // If no language is clicked, the page should be in English
    lang = 'en';
  }
  cy.get('#page-intro').should('be.visible');
  cy.contains('button', strs.navYourself[lang]).as('yourself')
    .should('be.disabled');
  cy.contains('button', strs.navHousehold[lang]).as('household')
    .should('be.disabled');
  cy.contains('button', strs.navIncomeAssets[lang]).as('income')
    .should('be.disabled');
  cy.contains('button', strs.navExistingBenefits[lang]).as('existing')
    .should('be.disabled');
  cy.contains('button', strs.navResults[lang]).as('results')
    .should('be.disabled');
  cy.contains('button', strs.buttonNext[lang]).as('next').click();
  cy.contains('button', strs.buttonBack[lang]).as('back');
  cy.contains('button', strs.buttonFinish[lang]).as('finish');

  cy.get('#page-yourself-start').as('page').should('be.visible');
  yourselfChecks();
  cy.get('@page').findByLabelText(strs.fieldHowOld[lang]).type('15');

  const yourselfDetails = [
    strs.fieldNoncitizen[lang],
    strs.fieldDisabled[lang],
    strs.fieldVeteran[lang],
    strs.fieldPregnant[lang],
  ];
  cy.wrap(yourselfDetails).each((yourselfDetail) => {
    cy.get('@page').findByLabelText(yourselfDetail).click();
  });
  cy.get('@page').findByLabelText(strs.fieldNoneDescribeMe[lang]).click();
  cy.wrap(yourselfDetails).each((yourselfDetail) => {
    cy.get('@page').findByLabelText(yourselfDetail).should('be.disabled');
    cy.get('@page').findByLabelText(yourselfDetail).should('not.be.selected');
  });
  cy.get('@page').findByLabelText(strs.fieldNoneDescribeMe[lang]).click();
  cy.wrap(yourselfDetails).each((yourselfDetail) => {
    cy.get('@page').findByLabelText(yourselfDetail).click();
  });

  nextShouldBe('#page-head-of-household');
  yourselfChecks();
  cy.get('@page').contains('div', strs.fieldHeadHousehold[lang])
    .findByLabelText(strs.fieldYes[lang]).click();

  nextShouldBe('#page-disability-details');
  yourselfChecks();
  cy.get('@page').contains('div', strs.fieldGuideDog[lang])
    .findByLabelText(strs.fieldYes[lang]).click();
  cy.get('@page').contains('div', strs.fieldMilitaryDisability[lang])
    .findByLabelText(strs.fieldYes[lang]).click();

  nextShouldBe('#page-veteran-details');
  yourselfChecks();
  cy.get('@page').findByLabelText(strs.fieldDischargeStatus[lang]).as('select')
    .select(strs.honorable[lang]);
  cy.get('@page').contains('button', strs.buttonAddAnother[lang]).click();
  cy.get('@page').contains('button', strs.buttonAddAnother[lang]);
  cy.get('@page').contains('li', new RegExp(`${strs.dutyPeriod[lang]} 1`, 'i'))
    .as('period1');
  // TODO: change to regex
  cy.get('@period1').findByLabelText(strs.dutyType[lang])
    .select('active-duty');
  cy.get('@period1').findByRole('group', {name: strs.startDate[lang]})
    .as('start1');
  cy.get('@start1').findByLabelText(strs.month[lang]).type('1');
  cy.get('@start1').findByLabelText(strs.day[lang]).type('1');
  cy.get('@start1').findByLabelText(strs.year[lang]).type('2020');
  cy.get('@period1').findByRole('group', {name: strs.endDate[lang]}).as('end1');
  cy.get('@end1').findByLabelText(strs.month[lang]).type('1');
  cy.get('@end1').findByLabelText(strs.day[lang]).type('2');
  cy.get('@end1').findByLabelText(strs.year[lang]).type('2020');

  cy.get('@page').contains('li', new RegExp(`${strs.dutyPeriod[lang]} 2`, 'i'))
    .as('period2');
  // TODO: change to regex https://stackoverflow.com/questions/52219274/cypress-how-to-select-option-containing-text
  cy.get('@period2').findByLabelText(strs.dutyType[lang])
    .select('reserve-duty');
  cy.get('@period2').findByRole('group', {name: strs.startDate[lang]})
    .as('start2');
  cy.get('@start2').findByLabelText(strs.month[lang]).type('1');
  cy.get('@start2').findByLabelText(strs.day[lang]).type('1');
  cy.get('@start2').findByLabelText(strs.year[lang]).type('1960');
  cy.get('@period2').findByRole('group', {name: strs.endDate[lang]}).as('end2');
  cy.get('@end2').findByLabelText(strs.month[lang]).type('1');
  cy.get('@end2').findByLabelText(strs.day[lang]).type('2');
  cy.get('@end2').findByLabelText(strs.year[lang]).type('1970');

  nextShouldBe('#page-veteran-duty-period');
  yourselfChecks();
  cy.get('@page').contains('fieldset', strs.dutyPeriodDates[lang])
    .findByLabelText(strs.fieldYes[lang]).click();

  nextShouldBe('#page-immigration-status');
  yourselfChecks();
  cy.get('@page').findByLabelText(strs.temporarily[lang]).click();

  nextShouldBe('#page-household-members');
  householdChecks();
  cy.get('@page').contains('button', strs.buttonAddNew[lang]).as('add').click();
  cy.get('@add').click();
  cy.get('@page').contains('li', strs.myself[lang]).as('myself');
  cy.get('@page').contains('li', new RegExp(`${strs.member[lang]} 2`, 'i'))
    .as('member2');
  cy.get('@page').contains('li', new RegExp(`${strs.member[lang]} 3`, 'i'))
    .as('member3');
  cy.get('@myself').findByLabelText(strs.age[lang]).as('myAge').clear();
  cy.get('@myAge').type('16');
  cy.get('@member2').findByLabelText(strs.name[lang]).as('member2Name')
    .type('Ruth');
  cy.get('@member2Name').blur();
  cy.get('@page').contains('li', 'Ruth').as('member2');
  cy.get('@member2').findByLabelText(strs.age[lang]).type('19');
  cy.get('@member2').findByLabelText(strs.spouse[lang]).as('member2Spouse')
    .click();
  cy.get('@member3').findByLabelText(strs.name[lang]).as('member3Name')
    .type('Alan');
  cy.get('@member3Name').blur();
  cy.get('@page').contains('li', 'Alan').as('member3');
  cy.get('@member3').findByLabelText(strs.age[lang]).type('22');
  cy.get('@member3').findByLabelText(strs.spouse[lang]).click();
  cy.get('@member2Spouse').should('not.be.selected');
  cy.get('@member2').contains(strs.remove[lang]).click();
  cy.get('@page').should('not.include.text', 'Ruth');

  nextShouldBe('#page-household-unborn-members');
  householdChecks();
  cy.get('@page').findByLabelText(strs.unbornChildren[lang]).type('2');

  nextShouldBe('#page-household-situation');
  householdChecks();
  cy.findByLabelText(strs.apartment[lang]).click();

  nextShouldBe('#page-household-housed');
  householdChecks();
  cy.get('@page').contains('div', strs.payGasBill[lang])
    .findByLabelText(strs.fieldYes[lang]).click();
  cy.get('@page').contains('div', strs.cookingFacilities[lang])
    .findByLabelText(strs.fieldYes[lang]).click();

  nextShouldBe('#page-income');
  incomeChecks();
  const incomeTypes = [
    strs.wages[lang],
    strs.selfEmployment[lang],
    strs.disability[lang],
    strs.unemployment[lang],
    strs.retirement[lang],
    strs.veterans[lang],
    strs.workersComp[lang],
    strs.childSupport[lang],
    strs.guaranteed[lang],
    strs.otherSource[lang],
  ];
  cy.wrap(incomeTypes).each((incomeType) => {
    cy.get('@page').findByLabelText(incomeType).click();
  });
  cy.get('@page').findByLabelText(strs.noIncome[lang]).click();
  cy.wrap(incomeTypes).each((incomeType) => {
    cy.get('@page').findByLabelText(incomeType).should('be.disabled');
    cy.get('@page').findByLabelText(incomeType).should('not.be.selected');
  });
  cy.get('@page').findByLabelText(strs.noIncome[lang]).click();
  cy.wrap(incomeTypes).each((incomeType) => {
    cy.get('@page').findByLabelText(incomeType).click();
  });

  nextShouldBe('#page-income-details-wages');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-self-employed');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-disability');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-unemployment');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-retirement');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-veterans');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-workers-comp');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-child-support');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-income-details-other');
  incomeChecks();
  inputMoney(lang);

  nextShouldBe('#page-ss-taxes');
  incomeChecks();
  cy.get('@page').contains('div', strs.ssTaxes[lang])
    .findByLabelText(strs.fieldYes[lang]).click();

  nextShouldBe('#page-income-assets');
  incomeChecks();
  inputMoney(lang, true);
  cy.get('@page').findByLabelText(strs.noAssets[lang]).as('noAssets').click();
  cy.get('@page').should('include.text', '$0');
  cy.get('@page')
    .findAllByRole('button', {name: strs.enterAsset[lang]}).each(($el, idx, $list) => {
      cy.wrap($el).should('have.attr', 'aria-disabled');
    });
  cy.get('@noAssets').click();
  cy.get('@page')
    .findAllByRole('button', {name: strs.enterAsset[lang]}).each(($el, idx, $list) => {
      cy.wrap($el).should('not.have.attr', 'aria-disabled');
    });

  nextShouldBe('#page-existing-benefits');
  cy.get('@yourself').should('be.enabled');
  cy.get('@household').should('be.enabled');
  cy.get('@income').should('be.enabled');
  cy.get('@existing').should('be.enabled');
  cy.get('@results').should('be.disabled');
  // Ensure all rows spend time in the viewport so that the text gets translated
  cy.scrollTo('bottom', {duration: 500});
  cy.get('@page')
    .findByRole('checkbox', {name: strs.gaExistingMe[lang]}).click();
  cy.get('@page')
    .findByRole('checkbox', {name: strs.lifelineExistingHouse[lang]}).click();

  nextShouldBe('#page-results', '@finish');
  // TODO: Verify anchor links work and scroll properly.  e.g. summary links.
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
}

describe('Eligibility Assessment Tool', () => {
  beforeEach(() => {
    cy.visit('/benefits-eligibility/');
  });

  const languages = ['en', 'es'];
  languages.forEach((lang) => {
    it(`gets to final results page with data entry and language "${lang}"`,
      () => {
        e2eTest(lang);
      });
  });

  describe('Back and forth translation', () => {
    let lang;

    beforeEach(() => {
      lang = 'es';
      cy.findByRole('link', {name: langText['en']}).as('english');
      cy.findByRole('link', {name: langText[lang]}).as('translate').click();
      cy.contains('button', strs.buttonNext[lang]).as('next').click();
      cy.contains('button', strs.buttonBack[lang]).as('back');
      cy.contains('button', strs.buttonFinish[lang]).as('finish');
    });

    it('translates all household members back and forth', () => {
      cy.get('@next').click();

      cy.get('#page-household-members').as('page').should('be.visible');
      cy.get('@page').contains('button', strs.buttonAddNew[lang]).click();
      cy.get('@page').contains('li', new RegExp(`${strs.member[lang]} 2`, 'i'))
        .as('member2');
      cy.get('@member2').findByLabelText(strs.name[lang]).as('member2Name')
        .type('House');
      cy.get('@member2Name').blur();
      cy.get('@page').contains('li', 'House').as('member2');
      cy.get('@member2Name').clear();
      cy.get('@member2Name').blur();
      cy.get('@back').click();
      cy.get('@next').click();
      cy.get('@page').contains('li', new RegExp(`${strs.member[lang]} 2`, 'i'));
      cy.get('@english').click();
      cy.get('@page').contains('li', new RegExp(`${strs.member['en']} 2`, 'i'));
      cy.get('@page').contains('li', new RegExp(`${strs.member[lang]} 2`, 'i'))
        .should('not.exist');
    });

    it('translates all member incomes back and forth', () => {
      cy.get('@next').click();

      cy.get('#page-household-members').as('page').should('be.visible');
      cy.get('@page').contains('button', strs.buttonAddNew[lang]).click();
      cy.get('@next').click();
      cy.get('@next').click();

      cy.get('#page-income').as('page').should('be.visible');
      cy.get('@page').findByLabelText(strs.wages[lang]).click();
      cy.get('@next').click();

      cy.get('#page-income-details-wages').as('page').should('be.visible');
      cy.get('@page').contains('button', strs.firstMoneyAdd[lang]);
      cy.get('@english').click();
      cy.get('@page').contains('button', strs.firstMoneyAdd['en']);
      cy.get('@page').contains('button', strs.firstMoneyAdd[lang])
        .should('not.exist');
    });

    it('translates results summary list back and forth', () => {
      cy.get('@next').click();
      cy.get('@next').click();
      cy.get('@next').click();

      cy.get('#page-income').as('page').should('be.visible');
      cy.get('@page').findByLabelText(strs.noIncome[lang]).click();
      cy.get('@next').click();
      cy.get('@next').click();
      cy.get('@next').click();
      cy.get('@finish').click();

      cy.get('#page-results').should('be.visible');
      cy.get('#elig-summary').as('summaryList');
      cy.get('@summaryList').contains(strs.lifelineTitle[lang]);
      cy.get('@english').click();
      cy.get('@summaryList').contains(strs.lifelineTitle['en']);
      cy.get('@summaryList').contains(strs.lifelineTitle[lang])
        .should('not.exist');
    });

    it('translates all duty periods back and forth', () => {
      cy.get('#page-yourself-start').as('page').should('be.visible');
      cy.get('@page').findByLabelText(strs.fieldVeteran[lang]).click();
      cy.get('@next').click();

      cy.get('#page-veteran-details').as('page').should('be.visible');
      cy.get('@page').contains('button', strs.buttonAddAnother[lang]).click();
      cy.get('@page').contains(new RegExp(strs.dutyPeriod[lang], 'i'));
      cy.get('@english').click();
      cy.get('@page').contains(new RegExp(strs.dutyPeriod['en'], 'i'));
      cy.get('@page').contains(new RegExp(strs.dutyPeriod[lang], 'i'))
        .should('not.exist');
    });

    it('translates all duty period follow-up questions back and forth', () => {
      cy.get('#page-yourself-start').as('page').should('be.visible');
      cy.get('@page').findByLabelText(strs.fieldVeteran[lang]).click();
      cy.get('@next').click();

      cy.get('#page-veteran-details').as('page').should('be.visible');
      cy.get('@page').contains('button', strs.buttonAddAnother[lang]).click();
      cy.get('@page').contains('li', new RegExp(`${strs.dutyPeriod[lang]} 1`, 'i'))
        .as('period1');
      // TODO: change to regex
      cy.get('@period1').findByLabelText(strs.dutyType[lang])
        .select('active-duty');
      cy.get('@period1').findByRole('group', {name: strs.startDate[lang]})
        .as('start1');
      cy.get('@start1').findByLabelText(strs.month[lang]).type('1');
      cy.get('@start1').findByLabelText(strs.day[lang]).type('1');
      cy.get('@start1').findByLabelText(strs.year[lang]).type('2020');
      cy.get('@period1').findByRole('group', {name: strs.endDate[lang]}).as('end1');
      cy.get('@end1').findByLabelText(strs.month[lang]).type('1');
      cy.get('@end1').findByLabelText(strs.day[lang]).type('2');
      cy.get('@end1').findByLabelText(strs.year[lang]).type('2020');
      cy.get('@page').contains('li', new RegExp(`${strs.dutyPeriod[lang]} 2`, 'i'))
        .as('period2');
      // TODO: change to regex https://stackoverflow.com/questions/52219274/cypress-how-to-select-option-containing-text
      cy.get('@period2').findByLabelText(strs.dutyType[lang])
        .select('active-duty');
      cy.get('@period2').findByRole('group', {name: strs.startDate[lang]})
        .as('start2');
      cy.get('@start2').findByLabelText(strs.month[lang]).type('1');
      cy.get('@start2').findByLabelText(strs.day[lang]).type('1');
      cy.get('@start2').findByLabelText(strs.year[lang]).type('2020');
      cy.get('@period2').findByRole('group', {name: strs.endDate[lang]}).as('end2');
      cy.get('@end2').findByLabelText(strs.month[lang]).type('1');
      cy.get('@end2').findByLabelText(strs.day[lang]).type('2');
      cy.get('@end2').findByLabelText(strs.year[lang]).type('2020');
      cy.get('@next').click();

      cy.get('#page-veteran-duty-period').as('page').should('be.visible');
      cy.get('@page').contains('fieldset', strs.dutyPeriodDates[lang]);
      cy.get('@back').click();
      cy.findByRole('link', {name: langText['en']}).click();
      cy.contains('button', strs.buttonNext['en']).click();
      cy.get('@page').contains('fieldset', strs.dutyPeriodDates['en']);
      cy.get('@page').contains('fieldset', strs.dutyPeriodDates[lang])
        .should('not.exist');
    });
  });
});
