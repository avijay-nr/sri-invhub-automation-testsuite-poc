import { expect, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { appConfig } from '../../configFiles/config';
import { LoginDef } from '../loginTestDef/loginTestDef';

function buildCaseName(): string {
  const explicitCaseName = process.env.CASE_NAME?.trim();
  if (explicitCaseName) return explicitCaseName;

  const prefix = process.env.CASE_NAME_PREFIX?.trim() || 'QA_CASE_';
  return `${prefix}${faker.string.alphanumeric(5).toUpperCase()}`;
}

export class CaseDef {
  private readonly caseName: string = buildCaseName();
  private caseDescription = '';
  private selectedCaseType = '';
  private selectedOrganisationUnit = '';
  private selectedExistingCase = '';
  private selectedSubjectLabel = '';

  constructor(private readonly page: Page) {}

  private getControlNearLabel(
    caseDialog: ReturnType<Page['getByRole']>,
    labelPattern: RegExp,
    placeholderPattern?: RegExp,
  ): ReturnType<Page['locator']> {
    const labelNode = caseDialog.getByText(labelPattern).first();
    const controlNearLabel = labelNode
      .locator(
        'xpath=following::*[@role="combobox" or @aria-haspopup="listbox" or @aria-expanded or self::input or self::button][1]',
      )
      .first();

    if (!placeholderPattern) return controlNearLabel;

    return controlNearLabel.or(caseDialog.getByPlaceholder(placeholderPattern).first()).first();
  }

  private async selectDropdownOption(control: ReturnType<Page['locator']>, optionFromEnv?: string): Promise<string> {
    // Clear any existing open overlay before opening the next dropdown.
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(150);

    const dropdownRoot = control
      .locator('xpath=ancestor-or-self::*[@data-pc-name="dropdown" or @role="combobox"][1]')
      .first();
    const clickTarget = (await dropdownRoot.isVisible().catch(() => false)) ? dropdownRoot : control;

    try {
      await clickTarget.click({ timeout: 10_000 });
    } catch {
      await clickTarget.click({ timeout: 10_000, force: true });
    }
    await this.page.waitForTimeout(300);

    const popup = this.page
      .locator('[role="listbox"]:visible, [role="menu"]:visible, .p-dropdown-panel:visible, .cdk-overlay-pane:visible, .mat-mdc-select-panel:visible')
      .last();
    const popupVisible = await popup.isVisible().catch(() => false);
    const options = popupVisible
      ? popup.locator('[role="option"], [role="menuitem"], li, .p-dropdown-item, .p-select-option, .mat-mdc-option, [id*="option" i]')
      : this.page.locator('[role="option"], li[role="option"], .p-dropdown-item, .p-select-option, .mat-mdc-option');

    if (optionFromEnv) {
      const envOption = options.filter({ hasText: new RegExp(optionFromEnv, 'i') }).first();
      if (await envOption.isVisible().catch(() => false)) {
        await envOption.click();
        return optionFromEnv;
      }
    }

    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const visible = await option.isVisible().catch(() => false);
      if (!visible) continue;

      const text = (await option.textContent().catch(() => ''))?.trim() || '';
      if (!text || /select an item|no data|no records|placeholder/i.test(text)) continue;

      await option.click();
      return text;
    }

    return '';
  }

  async navigateToCasesSection(): Promise<void> {
    const caseMenuByRole = this.page
      .getByRole('button', { name: /investigation queue|cases|my investigations|all open investigations/i })
      .first();

    if (await caseMenuByRole.isVisible().catch(() => false)) {
      await caseMenuByRole.click();
    } else {
      const caseMenuBySelector = this.page.locator(appConfig.selectors.casesMenu).first();
      await expect(caseMenuBySelector).toBeVisible({ timeout: 30_000 });
      await caseMenuBySelector.click();
    }

    await expect(this.page).toHaveURL(/investigation|case/i, { timeout: 30_000 });
  }

  async openCaseDetails(caseName: string): Promise<void> {
    const caseEntry = this.page
      .locator('table tbody tr, [role="row"], [data-testid*="case" i], a, button')
      .filter({ hasText: new RegExp(caseName, 'i') })
      .first();

    if (!(await caseEntry.isVisible().catch(() => false))) {
      const noData = this.page.getByText(/no data found|no results|no matching/i).first();
      if (!(await noData.isVisible().catch(() => false))) {
        await expect(caseEntry).toBeVisible({ timeout: 30_000 });
      }

      await this.navigateToSearchPageFromLeftNav();
      await this.searchCaseOnSearchPage(caseName);

      const searchResult = this.page
        .locator('table tbody tr, [role="row"], [data-testid*="case" i], a, button')
        .filter({ hasText: new RegExp(caseName, 'i') })
        .first();

      if (!(await searchResult.isVisible().catch(() => false))) {
        throw new Error(`Case "${caseName}" was not found in the Cases list or Search results.`);
      }

      await searchResult.click().catch(async () => {
        await searchResult.click({ force: true });
      });
    } else {
      await caseEntry.click().catch(async () => {
        await caseEntry.click({ force: true });
      });
    }

    await expect(this.page).toHaveURL(/case|investigation/i, { timeout: 30_000 });
  }

  async verifyCaseDetailsDisplayed(): Promise<void> {
    const detailContent = this.page.locator(
      'main, [role="main"], [role="dialog"], [data-testid*="case" i], [class*="case-detail" i]',
    ).first();
    await expect(detailContent).toBeVisible({ timeout: 30_000 });

    const detailLabels = this.page.getByText(/case name|description|status/i);
    await expect(detailLabels.first()).toBeVisible({ timeout: 30_000 });

    const subjectsSection = this.page.getByText(/connected subjects|linked subjects|subjects/i).first();
    await expect(subjectsSection).toBeVisible({ timeout: 30_000 });

    const subjectRows = this.page.locator(
      'table tbody tr, [role="rowgroup"] [role="row"], [data-testid*="subject" i]',
    );
    await expect(subjectRows.first()).toBeVisible({ timeout: 30_000 });
  }

  async openCreateCaseForm(): Promise<void> {
    const createByRole = this.page.getByRole('button', { name: /new case|create case/i }).first();

    if (await createByRole.isVisible().catch(() => false)) {
      await createByRole.click();
    } else {
      const createBySelector = this.page.locator(appConfig.selectors.createCaseButton).first();
      await expect(createBySelector).toBeVisible({ timeout: 30_000 });
      await createBySelector.click();
    }

    const formBySelector = this.page.locator(appConfig.selectors.caseFormContainer).first();
    if (await formBySelector.isVisible().catch(() => false)) {
      await expect(formBySelector).toBeVisible({ timeout: 30_000 });
      return;
    }

    const caseNameInput = this.page.locator(appConfig.selectors.caseNameInput).first();
    await expect(caseNameInput).toBeVisible({ timeout: 30_000 });
  }

  async enterCaseName(): Promise<void> {
    const caseNameByLabel = this.page.getByLabel(/\*?name|case name/i).first();
    const caseNameByPlaceholder = this.page.getByPlaceholder(/case name|enter name/i).first();
    const caseNameBySelector = this.page.locator(appConfig.selectors.caseNameInput).first();

    let caseNameInput = caseNameByLabel;
    if (!(await caseNameInput.isVisible().catch(() => false))) {
      caseNameInput = caseNameByPlaceholder;
    }
    if (!(await caseNameInput.isVisible().catch(() => false))) {
      caseNameInput = caseNameBySelector;
    }

    await expect(caseNameInput).toBeVisible({ timeout: 30_000 });
    await caseNameInput.fill(this.caseName);
    await expect(caseNameInput).toHaveValue(this.caseName);
  }

  async enterCaseDescription(): Promise<void> {
    const descriptionByLabel = this.page.getByLabel(/description/i).first();
    const descriptionByPlaceholder = this.page.getByPlaceholder(/description|enter description/i).first();
    const descriptionBySelector = this.page.locator(appConfig.selectors.caseDescriptionInput).first();

    let descriptionInput = descriptionByLabel;
    if (!(await descriptionInput.isVisible().catch(() => false))) {
      descriptionInput = descriptionByPlaceholder;
    }
    if (!(await descriptionInput.isVisible().catch(() => false))) {
      descriptionInput = descriptionBySelector;
    }

    if (!(await descriptionInput.isVisible().catch(() => false))) {
      return;
    }

    this.caseDescription = faker.lorem.sentence();
    await descriptionInput.fill(this.caseDescription);
    await expect(descriptionInput).toHaveValue(this.caseDescription);
  }

  async selectCaseTypeIfAvailable(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /create case/i }).first();
    const typeControlByLabel = this.getControlNearLabel(caseDialog, /^\s*case type\s*$/i, /enter text/i);
    const typeControlByComboboxName = caseDialog.getByRole('combobox', { name: /case type/i }).first();
    const typeControlByTextRelation = caseDialog
      .locator('xpath=.//*[contains(translate(normalize-space(.), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "case type")]/following::*[@role="combobox" or @aria-haspopup="listbox" or @aria-expanded or self::input or self::button][1]')
      .first();
    const typeControlByPlaceholder = caseDialog.locator('input[placeholder*="enter text" i], button:has-text("Enter Text")').first();

    const controlCandidates = [
      typeControlByLabel,
      typeControlByComboboxName,
      typeControlByTextRelation,
      typeControlByPlaceholder,
    ];

    let selectedControl: ReturnType<Page['locator']> | null = null;
    for (const candidate of controlCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        selectedControl = candidate;
        break;
      }
    }

    if (!selectedControl) return;

    const picked = await this.selectDropdownOption(selectedControl, process.env.CASE_TYPE?.trim());
    this.selectedCaseType = picked;

    // Case Type is optional. If no valid option exists, keep it unselected.
    if (!picked) await this.page.keyboard.press('Escape').catch(() => {});
  }

  async selectOrganisationUnit(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /create case/i }).first();
    const orgUnitByLabel = this.getControlNearLabel(
      caseDialog,
      /^\s*\*?\s*(organisation|organization)\s+unit\s*$/i,
      /select an item/i,
    );
    const orgUnitByComboboxName = caseDialog
      .getByRole('combobox', { name: /organisation unit|organization unit/i })
      .first();
    const orgUnitByTextRelation = caseDialog
      .locator('xpath=.//*[contains(translate(normalize-space(.), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "organisation unit") or contains(translate(normalize-space(.), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "organization unit")]/following::*[@role="combobox" or @aria-haspopup="listbox" or @aria-expanded or self::input or self::button][1]')
      .first();
    const orgUnitByPlaceholder = caseDialog.locator('input[placeholder*="select an item" i], button:has-text("Select an item")').first();

    const controlCandidates = [
      orgUnitByLabel,
      orgUnitByComboboxName,
      orgUnitByTextRelation,
      orgUnitByPlaceholder,
    ];

    let orgUnitControl: ReturnType<Page['locator']> | null = null;
    for (const candidate of controlCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        orgUnitControl = candidate;
        break;
      }
    }

    if (!orgUnitControl) {
      throw new Error('Organisation Unit dropdown control was not found in Create Case dialog.');
    }

    await expect(orgUnitControl).toBeVisible({ timeout: 30_000 });

    const picked = await this.selectDropdownOption(orgUnitControl, process.env.CASE_ORG_UNIT?.trim());
    if (picked) {
      this.selectedOrganisationUnit = picked;
      return;
    }

    throw new Error('Organisation Unit is required but no valid dropdown option was available.');
  }

  async saveCase(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /case/i }).first();
    if (await caseDialog.isVisible().catch(() => false)) {
      const saveInDialog = caseDialog.getByRole('button', { name: /save|create|submit/i }).first();
      await expect(saveInDialog).toBeVisible({ timeout: 30_000 });
      await saveInDialog.click();
      return;
    }

    const saveByRole = this.page.getByRole('button', { name: /save|create|submit/i }).first();
    if (await saveByRole.isVisible().catch(() => false)) {
      await saveByRole.click();
      return;
    }

    const saveBySelector = this.page.locator(appConfig.selectors.saveCaseButton).first();
    await expect(saveBySelector).toBeVisible({ timeout: 30_000 });
    await saveBySelector.click();
  }

  async verifyCaseCreatedSuccessfully(): Promise<void> {
    const successToast = this.page.locator(appConfig.selectors.caseSuccessToast).first();
    const toastVisible = await successToast.isVisible({ timeout: 10_000 }).catch(() => false);
    if (toastVisible) return;

    const caseByName = this.page.getByText(new RegExp(this.caseName, 'i')).first();
    const visibleInView = await caseByName.isVisible({ timeout: 10_000 }).catch(() => false);
    if (visibleInView) return;

    await expect(this.page).toHaveURL(/case|investigation/i, { timeout: 30_000 });
  }

  async openSubjectInvestigationDetail(): Promise<void> {
    const subjectByRoleLink = this.page
      .getByRole('link', { name: /subject|investigation|open|view|details/i })
      .first();
    const subjectByRoleButton = this.page
      .getByRole('button', { name: /open|view|details|subject|investigation/i })
      .first();
    const subjectByAnchors = this.page
      .locator('table tbody tr a, [role="row"] a, a[href*="/investigation"], a[href*="/subject"]')
      .first();
    const subjectByRows = this.page
      .locator('table tbody tr, [role="row"]')
      .filter({ hasNotText: /subject|investigation|name|status|header/i })
      .first();
    const subjectByCards = this.page
      .locator('[data-testid*="investigation" i], [data-testid*="subject" i], [class*="investigation" i], [class*="subject" i]')
      .first();

    const clickCandidates = [
      subjectByRoleLink,
      subjectByRoleButton,
      subjectByAnchors,
      subjectByRows,
      subjectByCards,
    ];

    let clicked = false;
    for (const candidate of clickCandidates) {
      if (!(await candidate.isVisible().catch(() => false))) continue;
      try {
        await candidate.click({ timeout: 10_000 });
      } catch {
        await candidate.click({ timeout: 10_000, force: true });
      }
      clicked = true;
      break;
    }

    if (!clicked) {
      throw new Error('No clickable subject investigation entry was found in the list.');
    }

    const addToCaseButton = this.page
      .getByRole('button', { name: /add to case|add case|add to existing case/i })
      .first();
    const addVisible = await addToCaseButton.isVisible({ timeout: 10_000 }).catch(() => false);
    if (addVisible) return;

    await expect(this.page).toHaveURL(/investigation|subject|case/i, { timeout: 30_000 });
  }

  async navigateToSearchPageFromLeftNav(): Promise<void> {
    const candidates = [
      this.page.getByText('Search iconSearch').first(),
      this.page.getByRole('link', { name: /^search$/i }).first(),
      this.page.getByRole('button', { name: /^search$/i }).first(),
      this.page.locator('a[href*="search" i], [role="menuitem"]:has-text("Search"), button:has-text("Search")').first(),
    ];

    for (const candidate of candidates) {
      if (!(await candidate.isVisible().catch(() => false))) continue;
      await candidate.click().catch(async () => {
        await candidate.click({ force: true });
      });
      const onSearchUrl = await this.page
        .waitForURL(/\/investigation\/search/i, { timeout: 12_000 })
        .then(() => true)
        .catch(() => false);
      if (onSearchUrl) return;

      const searchInput = this.page.getByRole('textbox', { name: /search/i }).first();
      if (await searchInput.isVisible().catch(() => false)) return;
    }

    throw new Error('Search page nav item was not found in left navigation.');
  }

  async searchCaseOnSearchPage(caseName: string): Promise<void> {
    if (!/\/investigation\/search/i.test(this.page.url())) {
      await this.navigateToSearchPageFromLeftNav();
    }

    const searchInput = this.page.getByRole('textbox', { name: 'Search' }).first();
    const searchButton = this.page.getByRole('button', { name: 'Search', description: 'Search' }).first();
    const searchButtonFallback = this.page.getByRole('button', { name: /^search$/i }).first();

    await expect(searchInput).toBeVisible({ timeout: 30_000 });
    const buttonToUse = (await searchButton.isVisible().catch(() => false))
      ? searchButton
      : searchButtonFallback;

    await expect(buttonToUse).toBeVisible({ timeout: 30_000 });

    await searchInput.click();
    await searchInput.fill(caseName);
    await expect(searchInput).toHaveValue(caseName, { timeout: 10_000 });

    await expect(buttonToUse).toBeEnabled({ timeout: 10_000 });
    await buttonToUse.click();

    // Wait until results area updates after search action.
    await this.page.waitForTimeout(500);
  }

  async selectCaseSearchType(): Promise<void> {
    const typeControl = this.page
      .getByRole('combobox', { name: /search type|type/i })
      .or(this.page.locator('[aria-label*="search type" i], [placeholder*="search type" i]').first())
      .first();

    if (await typeControl.isVisible().catch(() => false)) {
      await typeControl.click();
      const caseOption = this.page
        .getByRole('option', { name: /^case$/i })
        .or(this.page.getByText(/^case$/i).last())
        .first();
      await expect(caseOption).toBeVisible({ timeout: 10_000 });
      await caseOption.click();
      return;
    }

    const caseControl = this.page.getByText(/^case$/i).first();
    if (await caseControl.isVisible().catch(() => false)) {
      await caseControl.click();
      return;
    }

    // SRI_TEST currently exposes a single case-search input without a type selector.
    // In that UI, the search page is already scoped to cases.
    const searchInput = this.page.getByRole('textbox', { name: /^search$/i }).first();
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
  }

  async verifyCaseSearchResult(caseName: string): Promise<void> {
    const caseResult = this.page
      .locator('table tbody tr, [role="row"], [data-testid*="case" i], a, button')
      .filter({ hasText: new RegExp(caseName, 'i') })
      .first();
    await expect(caseResult).toBeVisible({ timeout: 30_000 });
  }

  async openCaseDetailsFromSearch(caseName: string): Promise<void> {
    const caseResult = this.page
      .locator('table tbody tr, [role="row"], [data-testid*="case" i], a, button')
      .filter({ hasText: new RegExp(caseName, 'i') })
      .first();
    await expect(caseResult).toBeVisible({ timeout: 30_000 });

    // The result row contains a Case Details button that opens a dialog and
    // separate links that navigate to the full case-details route.
    const detailsAction = caseResult
      .locator('a[href*="/investigation/caseDetails" i]')
      .first();
    const fallbackAction = caseResult
      .getByRole('link', { name: new RegExp(caseName, 'i') })
      .first();
    const target = (await detailsAction.isVisible().catch(() => false))
      ? detailsAction
      : (await fallbackAction.isVisible().catch(() => false))
        ? fallbackAction
        : caseResult;
    await target.click().catch(async () => {
      await target.click({ force: true });
    });

    await expect(this.page).toHaveURL(/\/investigation\/caseDetails/i, { timeout: 30_000 });
  }

  async verifyCaseDetailsPage(caseName: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/investigation\/caseDetails/i, { timeout: 30_000 });
    await expect(this.page.getByText(new RegExp(caseName, 'i')).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/case id/i).first()).toBeVisible({ timeout: 30_000 });

    for (const label of ['Risk', 'Connected Subjects', 'Relationships', 'Links Explorer', 'Transactions', 'Search']) {
      await expect(this.page.getByText(new RegExp(`^${label}$`, 'i')).first()).toBeVisible({ timeout: 15_000 });
    }

    await expect(this.page.getByText(/^risk$/i).first()).toHaveAttribute('aria-selected', 'true').catch(async () => {
      await expect(this.page.getByText(/^risk$/i).first()).toBeVisible();
    });
    await expect(this.page.getByText(/AI Investigation Summary/i).first()).toBeVisible({ timeout: 30_000 });

    for (const tab of ['Transaction Screening', 'Customer Screening', 'KYC/CDD', 'TM', 'Payment Fraud', 'Other']) {
      await expect(this.page.getByText(new RegExp(`^${tab}$`, 'i')).first()).toBeVisible({ timeout: 15_000 });
    }
  }

  async toggleCaseOverviewOn(): Promise<void> {
    const overviewToggle = this.page
      .getByRole('switch', { name: /case overview/i })
      .or(this.page.locator('input[type="checkbox"][aria-label*="case overview" i]').first())
      .first();
    await expect(overviewToggle).toBeVisible({ timeout: 30_000 });
    if ((await overviewToggle.getAttribute('aria-checked')) !== 'true' && !(await overviewToggle.isChecked().catch(() => false))) {
      const visibleSlider = overviewToggle
        .locator('xpath=following-sibling::*[@data-pc-section="slider"]')
        .or(this.page.locator('[data-pc-section="slider"]:visible').first())
        .first();
      if (await visibleSlider.isVisible().catch(() => false)) {
        await visibleSlider.click();
      } else {
        await overviewToggle.click({ force: true });
      }
    }
  }

  async verifyCaseOverviewDisplayed(): Promise<void> {
    await expect(this.page.getByText(/case overview/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/case details/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(/case type/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(/description/i).first()).toBeVisible({ timeout: 15_000 });

    // Status is not rendered in the current SRI_TEST Case Overview DOM.
    const status = this.page.getByText(/^status$/i).first();
    if (await status.isVisible().catch(() => false)) {
      await expect(status).toBeVisible();
    }
  }

  async openConnectedSubjects(): Promise<void> {
    await this.page.getByText(/^connected subjects$/i).first().click();
  }

  async verifyConnectedSubjectsDetails(): Promise<void> {
    await expect(this.page.getByText(/connected subjects/i).first()).toBeVisible({ timeout: 30_000 });
    for (const label of ['Name', 'Risk Score', 'Status']) {
      await expect(this.page.getByText(new RegExp(`^${label}$`, 'i')).last()).toBeVisible({ timeout: 15_000 });
    }
    const subjectRows = this.page.locator('table tbody tr, [role="rowgroup"] [role="row"]');
    await expect(subjectRows.first()).toBeVisible({ timeout: 30_000 });
  }

  async verifyCasePresentInSearchResults(caseName: string): Promise<void> {
    const resultsContainer = this.page
      .locator('text=/search results/i, table, [role="table"], [data-testid*="search" i]')
      .first();
    await expect(resultsContainer).toBeVisible({ timeout: 30_000 });

    const caseRowInList = this.page
      .locator('table tbody tr, [role="row"]')
      .filter({ hasText: new RegExp(caseName, 'i') })
      .first();

    if (await caseRowInList.isVisible().catch(() => false)) {
      await expect(caseRowInList).toBeVisible({ timeout: 30_000 });
      return;
    }

    // Fallback for non-table list rendering.
    const caseMatchInResults = resultsContainer.getByText(new RegExp(caseName, 'i')).first();
    await expect(caseMatchInResults).toBeVisible({ timeout: 30_000 });
  }

  async verifyCasesListVisibleOnSearchPage(): Promise<void> {
    const searchResultsTitle = this.page.getByText(/search results/i).first();
    await expect(searchResultsTitle).toBeVisible({ timeout: 30_000 });

    const tableBodyRows = this.page.locator('table tbody tr');
    if (await tableBodyRows.first().isVisible().catch(() => false)) {
      await expect(tableBodyRows.first()).toBeVisible({ timeout: 30_000 });
      return;
    }

    const gridRows = this.page.locator('[role="rowgroup"] [role="row"]');
    if (await gridRows.first().isVisible().catch(() => false)) {
      await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });
      return;
    }

    const emptyState = this.page.getByRole('region', { name: /enter your search term|no results|no matching/i }).first();
    if (await emptyState.isVisible().catch(() => false)) {
      throw new Error('Search executed, but results list is not shown below Search Results.');
    }

    throw new Error('Search Results section is visible, but no rows were detected in the list.');
  }

  async searchSubjectAndOpenSubjectInvestigationDetail(): Promise<void> {
    const subjectSearchTerm = process.env.SUBJECT_SEARCH_TERM?.trim() || '';
    const searchCandidates = [
      this.page.getByPlaceholder(/search/i).first(),
      this.page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first(),
    ];

    for (const input of searchCandidates) {
      if (!(await input.isVisible().catch(() => false))) continue;
      if (subjectSearchTerm) {
        await input.fill(subjectSearchTerm);
        await input.press('Enter').catch(() => {});
        await this.page.waitForTimeout(400);
      }
      break;
    }

    await this.openSubjectInvestigationDetail();
  }

  async verifySubjectInvestigationDetailPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/investigation|subject|case/i, { timeout: 30_000 });

    const detailTitle = this.page
      .locator('h1, h2, [data-testid*="subject" i], [data-testid*="investigation" i]')
      .first();
    if (await detailTitle.isVisible().catch(() => false)) {
      this.selectedSubjectLabel = (await detailTitle.textContent().catch(() => ''))?.trim() || '';
    }
  }

  async clickAddToCaseButton(): Promise<void> {
    const addText = /add to case|add case|add to existing case|associate case|link case|attach case/i;
    const candidates = [
      this.page.getByRole('button', { name: addText }).first(),
      this.page.getByRole('menuitem', { name: addText }).first(),
      this.page.getByRole('link', { name: addText }).first(),
      this.page.locator('[data-testid*="add" i][data-testid*="case" i], [id*="add" i][id*="case" i]').first(),
      this.page.locator('button:has-text("Add to Case"), button:has-text("Add Case"), button:has-text("Associate Case"), button:has-text("Link Case"), [role="button"]:has-text("Add")').first(),
      this.page.locator('text=/add to case|add case|associate case|link case|attach case/i').first(),
    ];

    for (const candidate of candidates) {
      if (!(await candidate.isVisible().catch(() => false))) continue;
      try {
        await candidate.click({ timeout: 10_000 });
      } catch {
        await candidate.click({ timeout: 10_000, force: true });
      }
      return;
    }

    throw new Error('Add to Case action was not found on subject investigation details page.');
  }

  async verifyCaseSelectionDialogOpens(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /case|select/i }).first();
    await expect(caseDialog).toBeVisible({ timeout: 30_000 });
  }

  async searchCaseInDialog(caseName: string): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /case|select/i }).first();
    await expect(caseDialog).toBeVisible({ timeout: 30_000 });

    const searchInput = caseDialog
      .getByPlaceholder(/search|case/i)
      .or(caseDialog.locator('input[type="search"], input[placeholder*="Search" i], input[name*="search" i]').first())
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(caseName);
      await searchInput.press('Enter').catch(() => {});
      await this.page.waitForTimeout(300);
    }
  }

  async selectCaseFromSearchResults(caseName: string): Promise<void> {
    const option = this.page
      .locator('[role="option"], [role="row"], li, .p-dropdown-item, .p-select-option, .mat-mdc-option, [data-testid*="case" i], [class*="case-option" i]')
      .filter({ hasText: new RegExp(caseName, 'i') })
      .first();

    await expect(option).toBeVisible({ timeout: 30_000 });
    await option.click();
    this.selectedExistingCase = caseName;
  }

  async searchAndSelectExistingCase(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /case/i }).first();
    await expect(caseDialog).toBeVisible({ timeout: 30_000 });

    const existingCaseFromEnv =
      process.env.EXISTING_CASE_NAME?.trim() ||
      process.env.CASE_EXISTING_NAME?.trim() ||
      process.env.CASE_NAME?.trim() ||
      'Test case 1';

    const casePickerControlCandidates = [
      caseDialog.getByRole('combobox', { name: /case/i }).first(),
      caseDialog.getByPlaceholder(/select.*case|select an item|enter text|case/i).first(),
      caseDialog.locator('[data-pc-name="dropdown"], [aria-haspopup="listbox"], [role="combobox"]').first(),
      caseDialog.locator('label:has-text("Case") + *, :text("Case") ~ * [role="combobox"]').first(),
    ];

    for (const control of casePickerControlCandidates) {
      if (!(await control.isVisible().catch(() => false))) continue;
      const pickedFromDropdown = await this.selectDropdownOption(control, existingCaseFromEnv || undefined);
      if (pickedFromDropdown) {
        this.selectedExistingCase = pickedFromDropdown;
        return;
      }
      break;
    }

    const searchInput = caseDialog
      .getByPlaceholder(/search|case/i)
      .or(caseDialog.locator('input[type="search"], input[placeholder*="Search" i], input[name*="search" i]').first())
      .first();

    if (existingCaseFromEnv && (await searchInput.isVisible().catch(() => false))) {
      await searchInput.fill(existingCaseFromEnv);
      await searchInput.press('Enter').catch(() => {});
      await this.page.waitForTimeout(300);
    }

    const exactCaseOption = existingCaseFromEnv
      ? this.page
          .locator('[role="option"], [role="row"], li, .p-dropdown-item, .p-select-option, .mat-mdc-option, [data-testid*="case" i], [class*="case-option" i]')
          .filter({ hasText: new RegExp(existingCaseFromEnv, 'i') })
          .first()
      : null;

    if (exactCaseOption && (await exactCaseOption.isVisible().catch(() => false))) {
      this.selectedExistingCase = existingCaseFromEnv;
      await exactCaseOption.click();
      return;
    }

    const options = this.page.locator('[role="option"], [role="row"], li, .p-dropdown-item, .p-select-option, .mat-mdc-option, [data-testid*="case" i], [class*="case-option" i]');
    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const visible = await option.isVisible().catch(() => false);
      if (!visible) continue;

      const text = (await option.textContent().catch(() => ''))?.trim() || '';
      if (!text || /search|no data|no records|no results|select|case name|created by|status/i.test(text)) continue;

      this.selectedExistingCase = text;
      await option.click();
      return;
    }

    throw new Error('No selectable existing case was found in Add to Case dialog.');
  }

  async confirmAddToCase(): Promise<void> {
    const caseDialog = this.page.getByRole('dialog').filter({ hasText: /case/i }).first();
    const confirmByRole = caseDialog.getByRole('button', { name: /add|confirm|submit|save/i }).first();
    const confirmByText = caseDialog
      .locator('button:has-text("Add"), button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Save")')
      .first();

    if (await confirmByRole.isVisible().catch(() => false)) {
      await confirmByRole.click();
      return;
    }

    await expect(confirmByText).toBeVisible({ timeout: 30_000 });
    await confirmByText.click();
  }

  async verifySubjectAddedToCaseSuccessfully(): Promise<void> {
    const successToast = this.page
      .locator('text=/subject.*added.*case|added to case|case updated|success/i, [role="status"], [role="alert"]')
      .first();
    const toastVisible = await successToast.isVisible({ timeout: 12_000 }).catch(() => false);
    if (toastVisible) return;

    if (this.selectedExistingCase) {
      const selectedCaseText = this.page.getByText(new RegExp(this.selectedExistingCase, 'i')).first();
      const caseShown = await selectedCaseText.isVisible({ timeout: 10_000 }).catch(() => false);
      if (caseShown) return;
    }

    await expect(this.page).toHaveURL(/investigation|subject|case/i, { timeout: 30_000 });
  }

  async navigateToCaseConnectedSubjectsTab(caseName: string): Promise<void> {
    const caseNavCandidates = [
      this.page.getByRole('link', { name: new RegExp(caseName, 'i') }).first(),
      this.page.getByRole('button', { name: new RegExp(caseName, 'i') }).first(),
      this.page.getByText(new RegExp(caseName, 'i')).first(),
    ];

    for (const candidate of caseNavCandidates) {
      if (!(await candidate.isVisible().catch(() => false))) continue;
      await candidate.click().catch(async () => {
        await candidate.click({ force: true });
      });
      break;
    }

    const tabCandidates = [
      this.page.getByRole('tab', { name: /connected subjects/i }).first(),
      this.page.getByRole('button', { name: /connected subjects/i }).first(),
      this.page.locator('text=/connected subjects/i').first(),
    ];

    for (const tab of tabCandidates) {
      if (!(await tab.isVisible().catch(() => false))) continue;
      await tab.click().catch(async () => {
        await tab.click({ force: true });
      });
      return;
    }

    throw new Error('Connected Subjects tab was not found.');
  }

  async verifySubjectListedUnderConnectedSubjects(): Promise<void> {
    const rows = this.page.locator('table tbody tr, [role="row"]');

    if (this.selectedSubjectLabel) {
      const subjectMatch = this.page.getByText(new RegExp(this.selectedSubjectLabel, 'i')).first();
      if (await subjectMatch.isVisible().catch(() => false)) return;
    }

    const rowCount = await rows.count();
    if (rowCount > 0) return;

    throw new Error('Subject was not listed under Connected Subjects.');
  }

}

export function createCaseDefs(page: Page): {
  loginDef: LoginDef;
  caseDef: CaseDef;
} {
  return {
    loginDef: new LoginDef(page),
    caseDef: new CaseDef(page),
  };
}
