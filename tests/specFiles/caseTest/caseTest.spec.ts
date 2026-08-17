import { test } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { createCaseDefs } from '../../definitionFiles/caseTestDef/caseTestDef';
import { LoginDef } from '../../definitionFiles/loginTestDef/loginTestDef';
import { readLastCaseName, saveLastCaseName } from '../../utils/lastCaseName';

// ✅ Add this after imports
test.afterEach(async ({ page }) => {
  const loginDef = new LoginDef(page);
  await loginDef.saveFinalTokens();
});

function getSharedCaseName(): string {
  return process.env.CASE_NAME?.trim() || readLastCaseName() || 'test case 1';
}

// TC-CASE-001
test(`Create New Case - ${appConfig.envName} @case_TC0001`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
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
  await test.step('Save created case name for dependent tests', async () => {
    const createdName = caseDef.getCreatedCaseName();
    saveLastCaseName(createdName);
  });
});

// TC-CASE-002
test(`Verify Recently Created Case In Search - ${appConfig.envName} @case_TC0002`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = getSharedCaseName(); // ✅ reads from TC-CASE-001
  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Step 2: Click Search from left nav', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
  });
  await test.step(`Step 3: Search for "${targetCaseName}"`, async () => {
    await caseDef.waitForCaseSearchResult(targetCaseName);
  });
  await test.step('Step 4: Verify cases list is visible in search results', async () => {
    await caseDef.verifyCasesListVisibleOnSearchPage();
  });
});

// TC-CASE-003
test(`View Case Details - ${appConfig.envName} @case_TC0003`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = getSharedCaseName();
  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Search', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
  });
  await test.step('Select Case search type', async () => {
    await caseDef.selectCaseSearchType();
  });
  await test.step('Search for Test case 1', async () => {
    await caseDef.waitForCaseSearchResult(targetCaseName);
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

// TC-CASE-004
test(`Remove Subject from Case - ${appConfig.envName} @case_TC0004`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = getSharedCaseName();
  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Open case details from Search', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
    await caseDef.selectCaseSearchType();
    await caseDef.waitForCaseSearchResult(targetCaseName);
    await caseDef.openCaseDetailsFromSearch(targetCaseName);
    await caseDef.verifyCaseDetailsPage(targetCaseName);
  });
  await test.step('Open Connected Subjects and remove a subject', async () => {
    await caseDef.openConnectedSubjects();
    await caseDef.verifyConnectedSubjectsDetails();
    const removedSubject = await caseDef.removeFirstSubjectFromCase();
    if (!removedSubject) return;
    await caseDef.confirmSubjectRemoval();
    await caseDef.verifySubjectRemoved(removedSubject);
  });
});

// TC-CASE-005
test(`Close Case - ${appConfig.envName} @case_TC0005`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = getSharedCaseName();
  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Open case details from Search', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
    await caseDef.selectCaseSearchType();
    await caseDef.waitForCaseSearchResult(targetCaseName);
    await caseDef.openCaseDetailsFromSearch(targetCaseName);
    await caseDef.verifyCaseDetailsPage(targetCaseName);
  });
  await test.step('Close case with closure notes', async () => {
    await caseDef.clickCloseCase();
    await caseDef.enterClosureNotes();
    await caseDef.confirmCloseCase();
  });
  await test.step('Verify case status is Closed', async () => {
    await caseDef.verifyCaseClosed();
  });
});