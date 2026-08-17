import * as fs from 'fs';
import * as path from 'path';
import { test } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import { createCaseDefs } from '../../definitionFiles/caseTestDef/caseTestDef';
import { LoginDef } from '../../definitionFiles/loginTestDef/loginTestDef';

// ✅ Add this after imports
test.afterEach(async ({ page }) => {
  const loginDef = new LoginDef(page);
  await loginDef.saveFinalTokens();
});

// Shared file to pass created case name between tests (safe — 1 worker, sequential)
const SHARED_CASE_FILE = path.join(__dirname, '../../.test-state/created-case-name.txt');

function getSharedCaseName(): string {
  if (fs.existsSync(SHARED_CASE_FILE)) {
    const name = fs.readFileSync(SHARED_CASE_FILE, 'utf-8').trim();
    if (name) return name;
  }
  return process.env.CASE_NAME?.trim() || 'test case 1';
}

// TC-CASE-001
test(`TC-CASE-001: Create New Case - ${appConfig.envName} @case_TC0001`, async ({ page }) => {
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
    // ✅ Save name so TC-CASE-002 and TC-CASE-003 can find the same case
    const createdName = caseDef.getCreatedCaseName();
    fs.mkdirSync(path.dirname(SHARED_CASE_FILE), { recursive: true });
    fs.writeFileSync(SHARED_CASE_FILE, createdName, 'utf-8');
    console.log(`✅ Saved created case name: "${createdName}"`);
  });
});

// TC-CASE-002
test(`TC-CASE-002: Verify Recently Created Case In Search - ${appConfig.envName} @case_TC0002`, async ({ page }) => {
  const { loginDef, caseDef } = createCaseDefs(page);
  const targetCaseName = getSharedCaseName(); // ✅ reads from TC-CASE-001

  await test.step('Login as valid user', async () => {
    await loginDef.loginIfNeeded();
  });

  await test.step('Step 2: Click Search from left nav', async () => {
    await caseDef.navigateToSearchPageFromLeftNav();
  });

  await test.step(`Step 3: Search for "${targetCaseName}"`, async () => {
    await caseDef.searchCaseOnSearchPage(targetCaseName);
  });

  await test.step('Step 4: Verify cases list is visible in search results', async () => {
    await caseDef.verifyCasesListVisibleOnSearchPage();
  });
});

// TC-CASE-003
test(`TC-CASE-003: View Case Details - ${appConfig.envName} @case_TC0003`, async ({ page }) => {
  test.setTimeout(180_000);
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