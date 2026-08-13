import { test } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { createCaseDefs } from '../../definitionFiles/caseTestDef/caseTestDef';

// TC-CASE-001
test(`TC-CASE-001: Create New Case - ${appConfig.envName}`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);

  await test.step('Login as valid user', async () => {
    await loginDef.openLoginPage();
    await loginDef.requestOtpForConfiguredUser();
    await loginDef.submitOtpAndVerify();
    await loginDef.verifyRedirectToApplicationUi();
  });

  await test.step('Navigate to Cases section', async () => {
    await caseDef.navigateToCasesSection();
  });

  await test.step('Open Create Case form', async () => {
    await caseDef.openCreateCaseForm();
  });

  await test.step('Enter case name', async () => {
    await caseDef.enterCaseName();
  });

  await test.step('Select case type', async () => {
    await caseDef.selectCaseTypeIfAvailable();
  });

  await test.step('Enter case description', async () => {
    await caseDef.enterCaseDescription();
  });

  await test.step('Select organisation unit', async () => {
    await caseDef.selectOrganisationUnit();
  });

  await test.step('Click Save/Create', async () => {
    await caseDef.saveCase();
  });

  await test.step('Verify case created successfully', async () => {
    await caseDef.verifyCaseCreatedSuccessfully();
  });
});

// TC-CASE-002
test(`TC-CASE-002: Verify Recently Created Case In Search - ${appConfig.envName}`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = 'test case 1';

  await test.step('Login as valid user', async () => {
    await loginDef.openLoginPage();
    await loginDef.requestOtpForConfiguredUser();
    await loginDef.submitOtpAndVerify();
    await loginDef.verifyRedirectToApplicationUi();
  });

  await test.step('Step 2: Click Search from left nav', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
  });

  await test.step('Step 3: Click Search textbox, fill test case 1, click Search button', async () => {
    await caseDef.searchCaseOnSearchPage(targetCaseName);
  });

  await test.step('Step 4: Verify cases list is visible in search results', async () => {
    await caseDef.verifyCasesListVisibleOnSearchPage();
  });

});

// TC-CASE-003
test(`TC-CASE-003: View Case Details - ${appConfig.envName}`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = process.env.CASE_NAME?.trim() || 'test case 1';

  await test.step('Login as valid user', async () => {
    await loginDef.openLoginPage();
    await loginDef.requestOtpForConfiguredUser();
    await loginDef.submitOtpAndVerify();
    await loginDef.verifyRedirectToApplicationUi();
  });

  await test.step('Navigate to Search', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
  });

  await test.step('Select Case search type', async () => {
    await caseDef.selectCaseSearchType();
  });

  await test.step('Search for Test case 1', async () => {
    await caseDef.searchCaseOnSearchPage(targetCaseName);
    await caseDef.verifyCaseSearchResult(targetCaseName);
  });

  await test.step('Open Case Details page', async () => {
    await caseDef.openCaseDetailsFromSearch(targetCaseName);
    await caseDef.verifyCaseDetailsPage(targetCaseName);
  });

  await test.step('Verify Case Overview', async () => {
    await caseDef.toggleCaseOverviewOn();
    await caseDef.verifyCaseOverviewDisplayed();
  });

  await test.step('Verify Connected Subjects', async () => {
    await caseDef.openConnectedSubjects();
    await caseDef.verifyConnectedSubjectsDetails();
  });
});

