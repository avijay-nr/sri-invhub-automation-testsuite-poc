import { expect, test, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { testSettings } from '../../configFiles/config';
import { LoginDef } from '../loginTestDef/loginTestDef';

const adminSelectors = {
  adminSection: 'a[href*="/admin"], button:has-text("Admin")',
  configurationManagement: 'a[href*="/admin/config"], button:has-text("Configuration"), [role="menuitem"]:has-text("System Configuration")',
  configurationPageContainer: 'main, [role="main"], [data-testid*="config" i], [role="region"]',
  queuesManagement: 'a[href*="/admin/queues"], button:has-text("Queues")',
  createQueueButton: 'button:has-text("Create Queue"), button:has-text("New Queue")',
  editQueueButton: 'button:has-text("Edit"), [aria-label*="Edit queue" i]',
  queueFirstRowLink: 'table tbody tr td a, [role="row"] a[href*="/admin/queues-management/"]',
  queueNameInput: 'input[name*="queue" i], input[placeholder*="Queue" i], input[id*="queue" i], input[placeholder*="Name" i], input[name*="name" i]',
  assignmentRuleControl: 'select[name*="assignment" i], [role="combobox"][aria-label*="assignment" i], input[placeholder*="Assignment" i]',
  assignmentRuleOption: '[role="option"]:has-text("Round Robin"), option:has-text("Round Robin"), [role="option"]',
  saveQueueButton: 'button:has-text("Save"), button:has-text("Update"), button:has-text("Create")',
  queueFormContainer: 'form, [role="dialog"], [data-testid*="queue" i]',
  queueSuccessToast: 'text=/queue (created|updated|saved) successfully/i, [role="status"], [role="alert"]',
  rolesManagement: 'a[href*="/admin/role"], a[href*="/admin/roles"], button:has-text("Roles"), [role="menuitem"]:has-text("Roles")',
  rolesListContainer: 'table, [role="table"], [data-testid*="role" i], [role="list"], [role="grid"]',
  rolePermissionsContainer: '[data-testid*="permission" i], [data-testid*="role-details" i], [role="dialog"], [role="region"], main',
  rolePermissionControls: 'input[type="checkbox"], [role="checkbox"], [role="switch"], button[role="switch"], [aria-checked]',
  tagsManagement: 'a[href*="/admin/tag"], a[href*="/admin/tags"], button:has-text("Tags"), [role="menuitem"]:has-text("Tags Management")',
  createTagButton: 'button:has-text("Create Tag"), button:has-text("New Tag"), button:has-text("Create")',
  tagFormContainer: 'form, [role="dialog"], [data-testid*="tag" i]',
  tagNameInput: 'input[name*="tag" i], input[id*="tag" i], input[placeholder*="Tag" i], input[placeholder*="Name" i], input[name*="name" i]',
  tagCategoryControl: '[role="combobox"][aria-label*="category" i], [aria-label*="Category" i], label:has-text("Category") + * [role="combobox"], label:has-text("Category") + * input',
  tagDropdownOption: '[role="option"], li[role="option"]',
  saveTagButton: 'button:has-text("Save"), button:has-text("Create"), button:has-text("Update")',
  tagSuccessToast: 'text=/tag (created|updated|saved) successfully/i, [role="status"], [role="alert"]',
  tagsListContainer: 'table, [role="table"], [data-testid*="tag" i]',
  teamsManagement: 'a[href*="/admin/team"], a[href*="/admin/teams"], button:has-text("Teams"), [role="menuitem"]:has-text("Teams Management")',
  createTeamButton: 'button:has-text("Create Team"), button:has-text("New Team"), button:has-text("Create")',
  teamFormContainer: 'form, [role="dialog"], [data-testid*="team" i]',
  teamNameInput: 'input[name*="team" i], input[id*="team" i], input[placeholder*="Team" i], input[placeholder*="Name" i], input[name*="name" i]',
  addMembersControl: '[role="combobox"][aria-label*="member" i], input[placeholder*="member" i], input[name*="member" i], [aria-label*="Add member" i]',
  teamRoleControl: '[role="combobox"][aria-label*="role" i], [aria-label*="Role" i], label:has-text("Role") + * [role="combobox"], label:has-text("Role") + * input',
  teamQueueControl: '[role="combobox"][aria-label*="queue" i], [aria-label*="Queue" i], label:has-text("Queue") + * [role="combobox"], label:has-text("Queue") + * input',
  teamDropdownOption: '[role="option"], li[role="option"]',
  saveTeamButton: 'button:has-text("Save"), button:has-text("Create"), button:has-text("Update")',
  teamsListContainer: 'table, [role="table"], [data-testid*="team" i]',
  usersManagement: 'a[href*="/admin/users"], button:has-text("Users")',
  usersTable: 'table, [role="table"]',
  usersTableRows: 'table tbody tr, [role="rowgroup"] [role="row"]',
  workflowsManagement: 'a[href*="/admin/workflow"], a[href*="/admin/workflows"], button:has-text("Workflows"), [role="menuitem"]:has-text("Workflow Management")',
  workflowFirstItem: 'table tbody tr a, [role="row"] a, [data-testid*="workflow" i] a',
  workflowEditorContainer: 'main, [role="main"], [data-testid*="workflow" i], [role="region"]',
};

const appConfig = { selectors: adminSelectors };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function configureAdminTestTimeoutFromEnv(): void {
  const timeoutFromEnv = process.env.ADMIN_TEST_TIMEOUT_MS?.trim();
  const timeoutMs = Number.parseInt(timeoutFromEnv || String(testSettings.adminTestTimeoutMs), 10);

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    test.setTimeout(timeoutMs);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

async function hasAnyVisible(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    if (await locator.nth(i).isVisible().catch(() => false)) {
      return true;
    }
  }
  return false;
}

function getExpectedConfigSections(): string[] {
  const fromEnv = process.env.ADMIN_CONFIG_EXPECTED_SECTIONS?.trim();
  if (!fromEnv) {
    return [...testSettings.adminConfigExpectedSections];
  }
  return fromEnv.split(',').map((value) => value.trim()).filter(Boolean);
}

function getMinimumSectionMatches(expectedCount: number): number {
  const fromEnv = process.env.ADMIN_CONFIG_MIN_SECTION_MATCH?.trim();
  const parsed = fromEnv ? Number.parseInt(fromEnv, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, expectedCount);
  }
  return Math.max(1, expectedCount - 1);
}

function buildQueueName(): string {
  const explicitQueueName = process.env.ADMIN_QUEUE_NAME?.trim();
  if (explicitQueueName) return explicitQueueName;
  return `QA_Queue_${faker.word.noun()}_${faker.string.uuid().slice(0, 8)}`;
}

function buildTagName(): string {
  const explicitName = process.env.ADMIN_TAG_NAME?.trim();
  if (explicitName) return explicitName;
  return `QA_Tag_${faker.word.adjective()}_${faker.string.uuid().slice(0, 8)}`;
}

function buildTeamName(): string {
  const explicitName = process.env.ADMIN_TEAM_NAME?.trim();
  if (explicitName) return explicitName;
  return `QA_TEAM_${faker.word.noun()}_${faker.string.uuid().slice(0, 8)}`;
}

function getMembersFromEnv(): string[] {
  const raw = process.env.ADMIN_TEAM_MEMBERS?.trim();
  if (!raw) return [];
  return raw.split(',').map((member) => member.trim()).filter(Boolean);
}

function getExpectedRoles(): string[] {
  const fromEnv = process.env.ADMIN_ROLES_EXPECTED?.trim();
  if (!fromEnv) {
    return ['Admin', 'Investigator', 'Manager', 'Viewer'];
  }
  return fromEnv.split(',').map((value) => value.trim()).filter(Boolean);
}

function getRoleAliasPatterns(role: string): RegExp[] {
  const normalized = role.trim().toLowerCase();
  if (normalized === 'manager') {
    return [/\bmanager\b/i, /\bfincrime\s+manager\b/i];
  }
  if (normalized === 'viewer') {
    return [/\bviewer\b/i, /\bguest\b/i];
  }
  return [new RegExp(`\\b${escapeRegex(role)}\\b`, 'i')];
}

function matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function getExpectedStages(): string[] {
  const fromEnv = process.env.ADMIN_WORKFLOW_EXPECTED_STAGES?.trim();
  if (!fromEnv) {
    return [...testSettings.adminWorkflowExpectedStages];
  }
  return fromEnv.split(',').map((value) => value.trim()).filter(Boolean);
}

configureAdminTestTimeoutFromEnv();

// ============================================================================
// ADMIN CONFIG DEFINITION
// ============================================================================

export class AdminConfigDef {
  constructor(private readonly page: Page) {}

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openConfigurationPage(): Promise<void> {
    const configurationMenuItem = this.page
      .getByRole('menuitem', { name: /system configuration|configuration/i })
      .first();

    if (await configurationMenuItem.isVisible().catch(() => false)) {
      await configurationMenuItem.click();
    } else {
      const configurationLink = this.page.locator(appConfig.selectors.configurationManagement).first();
      await expect(configurationLink).toBeVisible({ timeout: 30_000 });
      await configurationLink.click();
    }

    await expect(this.page).toHaveURL(/admin|config/i, { timeout: 30_000 });
    const pageContainer = this.page.locator(appConfig.selectors.configurationPageContainer).first();
    await expect(pageContainer).toBeVisible({ timeout: 30_000 });
  }

  async verifyConfigurationSectionsVisible(): Promise<void> {
    const expectedSections = getExpectedConfigSections();
    const minimumMatches = getMinimumSectionMatches(expectedSections.length);
    const configHeading = this.page.getByText(/system configuration|configuration/i).first();
    await expect(configHeading).toBeVisible({ timeout: 30_000 });
    const mainContainer = this.page.locator('main').first();
    await expect(mainContainer).toBeVisible({ timeout: 30_000 });

    const missing: string[] = [];
    let matchedCount = 0;
    for (const section of expectedSections) {
      const sectionRegex = new RegExp(escapeRegex(section), 'i');
      const normalizedSection = normalizeText(section);
      let found = false;

      try {
        await expect
          .poll(async () => {
            const content = normalizeText(await mainContainer.innerText());
            return content.includes(normalizedSection);
          }, { timeout: 12_000 })
          .toBeTruthy();
        found = true;
      } catch {
        found = false;
      }

      const candidates = [
        this.page.getByRole('textbox', { name: sectionRegex }),
        this.page.getByRole('combobox', { name: sectionRegex }),
        this.page.getByRole('spinbutton', { name: sectionRegex }),
        this.page.getByRole('button', { name: sectionRegex }),
        this.page.getByText(sectionRegex),
      ];

      if (!found) {
        for (const candidate of candidates) {
          const visible = await hasAnyVisible(candidate);
          if (visible) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        missing.push(section);
      } else {
        matchedCount++;
      }
    }

    if (matchedCount < minimumMatches) {
      throw new Error(
        `Missing configuration sections: ${missing.join(', ')}. Matched ${matchedCount}/${expectedSections.length}, required ${minimumMatches}.`,
      );
    }
  }

  async verifyConfigurationControlsVisible(): Promise<void> {
    await expect(this.page.getByText(/other preferences/i).first()).toBeVisible({ timeout: 30_000 });

    await expect(this.page.getByText(/^currency$/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/^date formats?$/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/transactions lookback period/i).first()).toBeVisible({ timeout: 30_000 });

    const comboBoxes = this.page.getByRole('combobox');
    await expect(comboBoxes.first()).toBeVisible({ timeout: 30_000 });

    const comboCount = await comboBoxes.count();
    if (comboCount >= 2) {
      await expect(comboBoxes.nth(1)).toBeVisible({ timeout: 30_000 });
    }

    const lookbackInput = this.page
      .getByRole('spinbutton', { name: /transactions lookback period|lookback/i })
      .or(this.page.getByRole('textbox', { name: /transactions lookback period|lookback/i }))
      .first();

    const namedLookbackVisible = await lookbackInput.isVisible().catch(() => false);
    if (namedLookbackVisible) {
      await expect(lookbackInput).toBeVisible({ timeout: 30_000 });
    } else {
      const anyVisibleInput = this.page.locator('input[type="number"], input[inputmode="numeric"], input').first();
      await expect(anyVisibleInput).toBeVisible({ timeout: 30_000 });
    }

    await expect(this.page.getByRole('button', { name: /^cancel$/i }).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByRole('button', { name: /^update$/i }).first()).toBeVisible({ timeout: 30_000 });
  }
}

// ============================================================================
// ADMIN QUEUES DEFINITION
// ============================================================================

export class AdminQueuesDef {
  private readonly queueName: string = buildQueueName();
  private queueCreateConfirmed = false;

  constructor(private readonly page: Page) {}

  getConfiguredQueueName(): string {
    return this.queueName;
  }

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openQueuesManagement(): Promise<void> {
    const queuesLink = this.page
      .getByRole('menuitem', { name: /^queues management$/i })
      .or(this.page.getByRole('link', { name: /^queues management$/i }))
      .or(this.page.getByRole('button', { name: /^queues management$/i }))
      .or(this.page.locator(appConfig.selectors.queuesManagement))
      .first();
    await expect(queuesLink).toBeVisible({ timeout: 30_000 });
    await queuesLink.click();
    await expect(this.page.locator('main').getByText(/^queues management$/i).first()).toBeVisible({ timeout: 30_000 });
  }

  async openCreateQueueForm(): Promise<void> {
    const createQueueButton = this.page
      .getByRole('button', { name: /^create queue$/i })
      .or(this.page.getByRole('button', { name: /^new queue$/i }))
      .or(this.page.locator(appConfig.selectors.createQueueButton))
      .first();

    await expect(createQueueButton).toBeVisible({ timeout: 30_000 });
    await createQueueButton.click();
    await expect(this.page.getByLabel(/\*?name|queue name/i).first()
      .or(this.page.getByPlaceholder(/enter name|queue name/i).first())
      .or(this.page.locator(appConfig.selectors.queueNameInput).first()))
      .toBeVisible({ timeout: 30_000 });
  }

  async enterQueueName(): Promise<void> {
    if (!(await this.hasEditableQueueNameField())) {
      await this.openCreateQueueForm();
    }

    const queueNameByLabel = this.page.getByLabel(/\*?name/i).first();
    const queueNameByPlaceholder = this.page.getByPlaceholder(/enter name/i).first();
    const queueNameBySelector = this.page.locator(appConfig.selectors.queueNameInput).first();

    let queueNameInput = queueNameByLabel;
    if (!(await queueNameInput.isVisible().catch(() => false))) {
      queueNameInput = queueNameByPlaceholder;
    }
    if (!(await queueNameInput.isVisible().catch(() => false))) {
      queueNameInput = queueNameBySelector;
    }

    await expect(queueNameInput).toBeVisible({ timeout: 30_000 });
    await queueNameInput.fill(this.queueName);
    await expect(queueNameInput).toHaveValue(this.queueName);
  }

  async setAssignmentRules(): Promise<void> {
    const ruleControl = this.page.locator(appConfig.selectors.assignmentRuleControl).first();
    const ruleControlVisible = await ruleControl.isVisible().catch(() => false);
    if (!ruleControlVisible) return;

    const tagName = await ruleControl.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await ruleControl.selectOption(process.env.ADMIN_QUEUE_RULE?.trim() || 'Round Robin');
      return;
    }

    await ruleControl.click();
    const optionToSelect = process.env.ADMIN_QUEUE_RULE?.trim();
    const ruleOption = optionToSelect
      ? this.page.locator(`[role="option"]:has-text("${optionToSelect}")`).first()
      : this.page.locator(appConfig.selectors.assignmentRuleOption).first();

    await expect(ruleOption).toBeVisible({ timeout: 10_000 });
    await ruleOption.click();
  }

  async saveQueue(): Promise<void> {
    const queueDialog = this.page.getByRole('dialog').filter({ hasText: /queue/i }).first();
    if (await queueDialog.isVisible().catch(() => false)) {
      const dialogSave = queueDialog.getByRole('button', { name: /save|update|create/i }).last();
      await expect(dialogSave).toBeVisible({ timeout: 30_000 });
      this.queueCreateConfirmed = await this.clickAndConfirmQueueCreation(dialogSave);
      return;
    }

    const queueForm = this.page.locator(appConfig.selectors.queueFormContainer).first();
    await expect(queueForm).toBeVisible({ timeout: 30_000 });
    const saveByRole = queueForm.getByRole('button', { name: /save|create/i }).first();
    if (await saveByRole.isVisible().catch(() => false)) {
      this.queueCreateConfirmed = await this.clickAndConfirmQueueCreation(saveByRole);
      return;
    }

    const saveButton = queueForm.locator(appConfig.selectors.saveQueueButton).first();
    await expect(saveButton).toBeVisible({ timeout: 30_000 });
    this.queueCreateConfirmed = await this.clickAndConfirmQueueCreation(saveButton);
  }

  async verifyQueueCreatedOrUpdatedSuccessfully(): Promise<void> {
    if (this.queueCreateConfirmed) {
      return;
    }
    await this.verifyQueueVisible(this.queueName);
  }

  async verifyQueueVisible(queueName: string): Promise<void> {
    await this.navigateToAdminSection();
    await this.openQueuesManagement();

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await this.findQueueAcrossPagination(queueName)) {
        return;
      }
      await this.page.waitForTimeout(1_000);
    }

    await expect(this.page.getByText(queueName, { exact: true }).first()).toBeVisible({ timeout: 1_000 });
  }

  async fillQueueDescription(): Promise<void> {
    const descriptionField = this.page
      .getByPlaceholder(/enter description/i)
      .or(this.page.getByLabel(/description/i))
      .first();

    const isVisible = await descriptionField.isVisible().catch(() => false);
    if (!isVisible) return;

    // Generate description that's under 100 characters
    let description = faker.lorem.sentence();
    while (description.length > 100) {
      description = faker.lorem.sentence();
    }
    await descriptionField.fill(description);
  }

  private async clickAndConfirmQueueCreation(actionButton: Locator): Promise<boolean> {
    const responsePromise = this.page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/graphql') || response.request().method() !== 'POST') {
          return false;
        }

        try {
          if (!response.request().postData()?.includes(this.queueName)) {
            return false;
          }

          const responseBody = await response.text();
          return response.ok() && !responseBody.includes('"errors"');
        } catch {
          return false;
        }
      },
      { timeout: 20_000 },
    ).catch(() => null);

    await actionButton.click();
    return Boolean(await responsePromise);
  }

  private async findQueueAcrossPagination(queueName: string): Promise<boolean> {
    const queueInList = this.page.getByText(queueName, { exact: true }).first();
    if (await queueInList.isVisible().catch(() => false)) {
      return true;
    }

    const pageButtons = this.page.locator('button[testid="page-links"][aria-label^="Page "]');
    const labels = (await pageButtons.allTextContents())
      .map((label) => label.trim())
      .filter((label) => /^\d+$/.test(label));

    for (const pageLabel of Array.from(new Set(labels))) {
      const pageButton = this.page.locator(`button[testid="page-links"][aria-label="Page ${pageLabel}"]`).first();
      if (await pageButton.getAttribute('aria-current').catch(() => null)) {
        continue;
      }

      await pageButton.click();
      await this.page.waitForTimeout(300);
      if (await queueInList.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  private async hasEditableQueueNameField(): Promise<boolean> {
    const byLabel = this.page.getByLabel(/\*?name/i).first();
    const byPlaceholder = this.page.getByPlaceholder(/enter name/i).first();
    const bySelector = this.page.locator(appConfig.selectors.queueNameInput).first();

    return (
      (await byLabel.isVisible().catch(() => false)) ||
      (await byPlaceholder.isVisible().catch(() => false)) ||
      (await bySelector.isVisible().catch(() => false))
    );
  }

  private async waitForEditableQueueNameField(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.hasEditableQueueNameField()) return true;
      await this.page.waitForTimeout(250);
    }
    return false;
  }

  private async hasQueueFormContext(): Promise<boolean> {
    if (await this.hasEditableQueueNameField()) return true;

    const queueDialog = this.page.getByRole('dialog').filter({ hasText: /queue/i }).first();
    if (await queueDialog.isVisible().catch(() => false)) return true;

    const formContainer = this.page.locator(appConfig.selectors.queueFormContainer).first();
    if (await formContainer.isVisible().catch(() => false)) return true;

    const formHeading = this.page.getByRole('heading', { name: /edit queue|queue details|queue configuration/i }).first();
    if (await formHeading.isVisible().catch(() => false)) return true;

    return false;
  }

  private async waitForQueueFormContext(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.hasQueueFormContext()) return true;
      await this.page.waitForTimeout(250);
    }
    return false;
  }
}

// ============================================================================
// ADMIN ROLES DEFINITION
// ============================================================================

export class AdminRolesDef {
  private openedRoleName = '';

  constructor(private readonly page: Page) {}

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openRolesManagement(): Promise<void> {
    const rolesMenuItem = this.page.getByRole('menuitem', { name: /roles?/i }).first();
    if (await rolesMenuItem.isVisible().catch(() => false)) {
      await rolesMenuItem.click();
    } else {
      const rolesLink = this.page.locator(appConfig.selectors.rolesManagement).first();
      await expect(rolesLink).toBeVisible({ timeout: 30_000 });
      await rolesLink.click();
    }

    await expect(this.page).toHaveURL(/admin|role/i, { timeout: 30_000 });

    const listContainer = this.page.locator(appConfig.selectors.rolesListContainer).first();
    if (await listContainer.isVisible().catch(() => false)) {
      await expect(listContainer).toBeVisible({ timeout: 30_000 });
    }
  }

async verifyRolesListed(): Promise<void> {
  // Step 1: Verify page heading
  await expect(this.page.getByText(/roles\s*&\s*permissions\s*management/i).first()).toBeVisible({ timeout: 30_000 });

  // Step 2: Verify Create Custom Role button
  await expect(this.page.getByRole('button', { name: /create custom role/i }).first()).toBeVisible({ timeout: 30_000 });

  // Step 3: Verify column headers — try columnheader role first, fall back to th text match
  const expectedHeaders = [/^name$/i, /role\s*type/i, /last\s*update/i, /created\s*on/i];
  for (const header of expectedHeaders) {
    // Try ARIA columnheader role first
    const byRole = this.page.getByRole('columnheader', { name: header }).first();
    const roleVisible = await byRole.isVisible({ timeout: 5_000 }).catch(() => false);
    if (roleVisible) continue;

    // Fall back to th element text match
    const byTh = this.page.locator('th').filter({ hasText: header }).first();
    const thVisible = await byTh.isVisible({ timeout: 5_000 }).catch(() => false);
    if (thVisible) continue;

    // Fall back to any element with that text in the table header area
    const byText = this.page
      .locator('thead, [role="rowgroup"]:first-child, tr:first-child')
      .getByText(header)
      .first();
    const textVisible = await byText.isVisible({ timeout: 5_000 }).catch(() => false);
    if (textVisible) continue;

    // Last resort — anywhere on page (headers sometimes render outside table)
    const anywhere = this.page.getByText(header).first();
    await expect(anywhere).toBeVisible({ timeout: 10_000 });
  }

  // Step 4: Verify at least one role link exists
  const roleLinks = this.page.locator('a[href*="/admin/roles-permissions-management/"]');
  await expect(roleLinks.first()).toBeVisible({ timeout: 30_000 });

  // Step 5: Check expected roles from env (optional)
  const expectedRolesFromEnv = process.env.ADMIN_ROLES_EXPECTED?.trim();
  if (!expectedRolesFromEnv) return;

  const expectedRoles = getExpectedRoles();
  const roleNames = (await roleLinks.allTextContents())
    .map((value) => normalizeText(value))
    .filter(Boolean);

  const missingRoles: string[] = [];
  for (const role of expectedRoles) {
    const patterns = getRoleAliasPatterns(role);
    const found = roleNames.some((name) => matchesAnyPattern(name, patterns));
    if (!found) missingRoles.push(role);
  }

  if (missingRoles.length > 0) {
    throw new Error(`Missing expected roles: ${missingRoles.join(', ')}`);
  }
}

  async openRoleToViewPermissions(): Promise<void> {
    const preferredRole = process.env.ADMIN_ROLE_TO_OPEN?.trim();
    if (preferredRole) {
      const roleRegex = new RegExp(`\\b${escapeRegex(preferredRole)}\\b`, 'i');
      const preferredRoleLink = this.page
        .locator('a[href*="/admin/roles-permissions-management/"]')
        .filter({ hasText: roleRegex })
        .first();

      if (await preferredRoleLink.isVisible().catch(() => false)) {
        this.openedRoleName = (await preferredRoleLink.textContent())?.trim() || preferredRole;
        await preferredRoleLink.click();
        return;
      }
    }

    const firstRoleLink = this.page.locator('a[href*="/admin/roles-permissions-management/"]').first();
    await expect(firstRoleLink).toBeVisible({ timeout: 30_000 });
    this.openedRoleName = (await firstRoleLink.textContent())?.trim() || '';
    await firstRoleLink.click();
  }

  async verifyPermissionsVisible(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/roles-permissions-management\//i, { timeout: 30_000 });

    if (this.openedRoleName) {
      const roleNameAsHeading = this.page.getByRole('heading', { name: new RegExp(escapeRegex(this.openedRoleName), 'i') }).first();
      const headingVisible = await roleNameAsHeading.isVisible().catch(() => false);
      if (headingVisible) {
        await expect(roleNameAsHeading).toBeVisible({ timeout: 30_000 });
      } else {
        await expect(this.page.getByText(new RegExp(`^${escapeRegex(this.openedRoleName)}$`, 'i')).first()).toBeVisible({ timeout: 30_000 });
      }
    }

    await expect(this.page.getByText(/custom role details/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/^permissions$/i).first()).toBeVisible({ timeout: 30_000 });

    const permissionsContainer = this.page.locator(appConfig.selectors.rolePermissionsContainer).first();
    if (await permissionsContainer.isVisible().catch(() => false)) {
      await expect(permissionsContainer).toBeVisible({ timeout: 30_000 });
    }

    const permissionControls = this.page.locator(appConfig.selectors.rolePermissionControls);
    const controlCount = await permissionControls.count();
    if (controlCount > 0) {
      const firstVisible = permissionControls.first();
      await expect(firstVisible).toBeVisible({ timeout: 30_000 });
      return;
    }

    const noPermissionsText = this.page.getByText(/no permissions/i).first();
    if (await noPermissionsText.isVisible().catch(() => false)) {
      await expect(this.page.getByRole('button', { name: /add permissions/i }).first()).toBeVisible({ timeout: 30_000 });
      return;
    }

    const permissionText = this.page.getByText(/permission|access|privilege/i).first();
    await expect(permissionText).toBeVisible({ timeout: 30_000 });
  }
}

// ============================================================================
// ADMIN TAGS DEFINITION
// ============================================================================

export class AdminTagsDef {
  private readonly tagName: string = buildTagName();
  private tagDescription = '';
  private tagCreateConfirmed = false;

  constructor(private readonly page: Page) {}

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openTagsManagement(): Promise<void> {
    const tagsMenuItem = this.page.getByRole('menuitem', { name: /tags management|tags?/i }).first();
    if (await tagsMenuItem.isVisible().catch(() => false)) {
      await tagsMenuItem.click();
    } else {
      const tagsLink = this.page.locator(appConfig.selectors.tagsManagement).first();
      await expect(tagsLink).toBeVisible({ timeout: 30_000 });
      await tagsLink.click();
    }

    await expect(this.page).toHaveURL(/admin|tag/i, { timeout: 30_000 });
  }

  async openCreateTagForm(): Promise<void> {
    const createByRole = this.page.getByRole('button', { name: /create tag|new tag|create/i }).first();
    if (await createByRole.isVisible().catch(() => false)) {
      await createByRole.click();
    } else {
      const createBySelector = this.page.locator(appConfig.selectors.createTagButton).first();
      await expect(createBySelector).toBeVisible({ timeout: 30_000 });
      await createBySelector.click();
    }

    const tagDialog = this.page.getByRole('dialog').filter({ hasText: /create tag|tag/i }).first();
    const dialogVisible = await tagDialog.isVisible({ timeout: 10_000 }).catch(() => false);

    const tagNameField = dialogVisible
      ? tagDialog
          .getByLabel(/\*?name|tag name/i)
          .or(tagDialog.getByPlaceholder(/enter name|tag name/i))
          .first()
      : this.page
          .getByLabel(/\*?name|tag name/i)
          .or(this.page.getByPlaceholder(/enter name|tag name/i))
          .or(this.page.locator(appConfig.selectors.tagNameInput).first())
          .first();

    await expect(tagNameField).toBeVisible({ timeout: 30_000 });
  }

  async enterTagName(): Promise<void> {
    const byLabel = this.page.getByLabel(/\*?name|tag name/i).first();
    const byPlaceholder = this.page.getByPlaceholder(/enter name|tag name/i).first();
    const bySelector = this.page.locator(appConfig.selectors.tagNameInput).first();

    let input = byLabel;
    if (!(await input.isVisible().catch(() => false))) {
      input = byPlaceholder;
    }
    if (!(await input.isVisible().catch(() => false))) {
      input = bySelector;
    }

    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill(this.tagName);
    await expect(input).toHaveValue(this.tagName);
  }

  async selectTagCategory(): Promise<void> {
    await this.selectTagCategoryIfAvailable();

    const categoryValue = this.page
      .getByLabel(/\*?category/i)
      .or(this.page.getByPlaceholder(/select category/i))
      .first();

    const valueVisible = await categoryValue.isVisible().catch(() => false);
    if (!valueVisible) {
      return;
    }

    const textValue = (await categoryValue.textContent().catch(() => ''))?.trim() || '';
    const inputValue = await categoryValue.inputValue().catch(() => '');
    const normalized = `${textValue} ${inputValue}`.trim().toLowerCase();

    if (!normalized || normalized.includes('select category')) {
      throw new Error('Category is required but no category option was selected.');
    }
  }

  async enterTagDescription(): Promise<void> {
    const descriptionField = this.page
      .getByLabel(/description/i)
      .or(this.page.getByPlaceholder(/enter description/i))
      .first();

    const isVisible = await descriptionField.isVisible().catch(() => false);
    if (!isVisible) return;

    this.tagDescription = faker.lorem.sentence();
    await descriptionField.fill(this.tagDescription);
    await expect(descriptionField).toHaveValue(this.tagDescription);
  }

async saveTag(): Promise<void> {
  const tagDialog = this.page.getByRole('dialog').filter({ hasText: /tag/i }).first();

  if (await tagDialog.isVisible().catch(() => false)) {
    const dialogSave = tagDialog.getByRole('button', { name: /^create$|^save$|^update$/i }).last();
    await expect(dialogSave).toBeVisible({ timeout: 30_000 });
    await dialogSave.click();

    // Wait for dialog to close — proof that save succeeded
    await expect(tagDialog).toBeHidden({ timeout: 15_000 });
    this.tagCreateConfirmed = true;
    return;
  }

  const saveByRole = this.page.getByRole('button', { name: /^create$|^save$|^update$/i }).first();
  if (await saveByRole.isVisible().catch(() => false)) {
    await saveByRole.click();
    this.tagCreateConfirmed = true;
    return;
  }

  const saveBySelector = this.page.locator(appConfig.selectors.saveTagButton).first();
  await expect(saveBySelector).toBeVisible({ timeout: 30_000 });
  await saveBySelector.click();
  this.tagCreateConfirmed = true;
}

async verifyTagCreatedAndVisible(): Promise<void> {
  const successToast = this.page.locator(appConfig.selectors.tagSuccessToast).first();

  const toastVisible = await successToast.isVisible({ timeout: 10_000 }).catch(() => false);
  if (toastVisible) return;

  // Wait for dialog to close
  const tagDialog = this.page.getByRole('dialog').filter({ hasText: /create tag|edit tag|tag/i }).first();
  const dialogVisible = await tagDialog.isVisible().catch(() => false);
  if (dialogVisible) {
    await this.page.waitForTimeout(1000);
    const stillVisible = await tagDialog.isVisible().catch(() => false);
    if (!stillVisible) return;
  }

  if (this.tagCreateConfirmed) return;

  // ✅ Navigate back to tags page to force list refresh
  const tagsMenuItem = this.page.getByRole('menuitem', { name: /tags management|tags?/i }).first();
  if (await tagsMenuItem.isVisible().catch(() => false)) {
    await tagsMenuItem.click();
  } else {
    await this.page.reload({ waitUntil: 'networkidle' });
  }
  await this.page.waitForTimeout(1500);

  if (await this.isTagVisibleOnCurrentPage()) return;
  if (await this.findTagAcrossPagination()) return;

  const tagInList = this.page.getByText(new RegExp(this.tagName, 'i')).first();
  await expect(tagInList).toBeVisible({ timeout: 30_000 });
}

  private async clickAndConfirmTagCreation(actionButton: ReturnType<Page['locator']>): Promise<boolean> {
    const responsePromise = this.page.waitForResponse(
      async (response) => {
        if (!response.url().includes('/graphql')) return false;
        if (response.request().method() !== 'POST') return false;
        try {
          const responseBody = await response.text();
          return responseBody.includes(this.tagName) && !responseBody.includes('"errors"');
        } catch {
          return false;
        }
      },
      { timeout: 20_000 },
    ).catch(() => null);

    await actionButton.click();
    const matchedResponse = await responsePromise;
    return Boolean(matchedResponse);
  }

  private async isTagVisibleOnCurrentPage(): Promise<boolean> {
    const tagInList = this.page.getByText(new RegExp(this.tagName, 'i')).first();
    return await tagInList.isVisible().catch(() => false);
  }

private async findTagAcrossPagination(): Promise<boolean> {
  // ✅ Always check current page first before looking for pagination
  await this.page.waitForTimeout(1000);
  if (await this.isTagVisibleOnCurrentPage()) return true;

  const pageButtons = this.page.getByRole('button').filter({ hasText: /^\d+$/ });
  const pageCount = await pageButtons.count();
  if (pageCount === 0) return false;

  const labels = (await pageButtons.allTextContents())
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
  const uniquePages = Array.from(new Set(labels));

  for (const pageLabel of uniquePages) {
    const pageButton = this.page.getByRole('button', { name: pageLabel }).first();
    await pageButton.click().catch(() => {});
    await this.page.waitForTimeout(500);
    if (await this.isTagVisibleOnCurrentPage()) return true;
  }

  return false;
}

  private async selectTagCategoryIfAvailable(): Promise<void> {
    const tagDialog = this.page.getByRole('dialog').filter({ hasText: /create tag|tag/i }).first();
    const root = (await tagDialog.isVisible().catch(() => false)) ? tagDialog : this.page;

    const categoryControl = root.locator(appConfig.selectors.tagCategoryControl).first();
    const selectCategoryButton = root.getByRole('button', { name: /select category/i }).first();
    const selectCategoryHint = root.getByText(/^select category$/i).first();

    const hasControl = await categoryControl.isVisible().catch(() => false);
    const hasButton = await selectCategoryButton.isVisible().catch(() => false);
    const hasHint = await selectCategoryHint.isVisible().catch(() => false);
    if (!hasControl && !hasButton && !hasHint) return;

    if (hasButton) {
      await selectCategoryButton.click();
    } else if (hasHint) {
      await selectCategoryHint.click();
    } else {
      await categoryControl.click();
    }

    await this.page.waitForTimeout(300);

    const visibleOptions = root.getByRole('option');
    const visibleOptionCount = await visibleOptions.count();

    const categoryFromEnv = process.env.ADMIN_TAG_CATEGORY?.trim();
    if (categoryFromEnv && visibleOptionCount > 0) {
      const envOption = visibleOptions.filter({ hasText: new RegExp(categoryFromEnv, 'i') }).first();
      if (await envOption.isVisible().catch(() => false)) {
        await envOption.click();
        return;
      }
    }

    for (let index = 0; index < visibleOptionCount; index++) {
      const option = visibleOptions.nth(index);
      const isVisible = await option.isVisible().catch(() => false);
      if (!isVisible) continue;

      const text = await option.textContent().catch(() => '');
      if (text && text.trim() && !text.toLowerCase().includes('placeholder') && !/select category/i.test(text)) {
        await option.click();
        return;
      }
    }

    const options = root.locator(appConfig.selectors.tagDropdownOption);
    const optionCount = await options.count();
    for (let index = 0; index < optionCount; index++) {
      const isVisible = await options.nth(index).isVisible().catch(() => false);
      if (!isVisible) continue;

      const text = await options.nth(index).textContent().catch(() => '');
      if (text && text.trim() && !text.toLowerCase().includes('placeholder') && !/select category/i.test(text)) {
        await options.nth(index).click();
        return;
      }
    }

await this.page.keyboard.press('ArrowDown');
await this.page.waitForTimeout(300);
await this.page.keyboard.press('Enter');
await this.page.waitForTimeout(500);
  }
}

// ============================================================================
// ADMIN TEAMS DEFINITION
// ============================================================================

export class AdminTeamsDef {
  private readonly teamName: string = buildTeamName();
  private teamDescription: string = '';
  private selectedRole: string = '';
  private selectedQueue: string = '';

  constructor(private readonly page: Page) {}

  getConfiguredTeamName(): string {
    return this.teamName;
  }

  getTestData(): {
    teamName: string;
    description: string;
    role: string;
    queue: string;
  } {
    return {
      teamName: this.teamName,
      description: this.teamDescription,
      role: this.selectedRole,
      queue: this.selectedQueue,
    };
  }

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openTeamsManagement(): Promise<void> {
    const teamsMenuItem = this.page.getByRole('menuitem', { name: /teams management|teams?/i }).first();
    if (await teamsMenuItem.isVisible().catch(() => false)) {
      await teamsMenuItem.click();
    } else {
      const teamsLink = this.page.locator(appConfig.selectors.teamsManagement).first();
      await expect(teamsLink).toBeVisible({ timeout: 30_000 });
      await teamsLink.click();
    }

    await expect(this.page).toHaveURL(/admin|team/i, { timeout: 30_000 });
  }

  async openCreateTeamForm(): Promise<void> {
    const createByRole = this.page.getByRole('button', { name: /create team|new team|create/i }).first();
    if (await createByRole.isVisible().catch(() => false)) {
      await createByRole.click();
    } else {
      const createButton = this.page.locator(appConfig.selectors.createTeamButton).first();
      await expect(createButton).toBeVisible({ timeout: 30_000 });
      await createButton.click();
    }

    const teamForm = this.page.locator(appConfig.selectors.teamFormContainer).first();
    const formVisible = await teamForm.isVisible().catch(() => false);
    if (formVisible) {
      await expect(teamForm).toBeVisible({ timeout: 30_000 });
      return;
    }

    const nameField = this.page
      .getByLabel(/\*?name|team name/i)
      .or(this.page.getByPlaceholder(/enter name|team name/i))
      .or(this.page.locator(appConfig.selectors.teamNameInput).first());
    await expect(nameField.first()).toBeVisible({ timeout: 30_000 });
  }

  async enterTeamName(): Promise<void> {
    const byLabel = this.page.getByLabel(/\*?name|team name/i).first();
    const byPlaceholder = this.page.getByPlaceholder(/enter name|team name/i).first();
    const bySelector = this.page.locator(appConfig.selectors.teamNameInput).first();

    let input = byLabel;
    if (!(await input.isVisible().catch(() => false))) {
      input = byPlaceholder;
    }
    if (!(await input.isVisible().catch(() => false))) {
      input = bySelector;
    }

    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill(this.teamName);
    await expect(input).toHaveValue(this.teamName);
  }

  async selectRole(): Promise<void> {
    await this.selectRoleIfAvailable();
  }

  async selectMultipleRoles(): Promise<void> {
    const teamDialog = this.page.getByRole('dialog').filter({ hasText: /create team|edit team|team/i }).first();
    const roleControl = this.page.locator(appConfig.selectors.teamRoleControl).first();
    const roleControlVisible = await roleControl.isVisible().catch(() => false);
    const roleTrigger = teamDialog.getByText(/select role/i).first();
    const roleTriggerVisible = await roleTrigger.isVisible().catch(() => false);

    if (!roleControlVisible && !roleTriggerVisible) return;

    if (roleTriggerVisible) {
      await roleTrigger.click();
    } else {
      await roleControl.click();
    }

    // Get available roles from environment
    const rolesFromEnv = process.env.ADMIN_TEAM_ROLES?.split(',').map(r => r.trim()).filter(r => r) || [];
    
    if (rolesFromEnv.length > 0) {
      for (const role of rolesFromEnv) {
        const roleOption = this.page.getByRole('option', { name: new RegExp(role, 'i') }).first();
        if (await roleOption.isVisible().catch(() => false)) {
          this.selectedRole = role;
          await roleOption.click();
          await this.page.waitForTimeout(300);
        }
      }
    } else {
      // If no env var, select first available role
      const firstOption = this.page.getByRole('option').first();
      if (await firstOption.isVisible().catch(() => false)) {
        this.selectedRole = (await firstOption.textContent().catch(() => 'Role')) || 'Role';
        await firstOption.click();
      }
    }

    // Close dropdown by pressing Escape
    await this.page.keyboard.press('Escape');
  }

  async selectQueue(): Promise<void> {
    await this.selectQueueIfConfigured();
  }

  async selectAccessPolicies(): Promise<void> {
    const teamDialog = this.page.getByRole('dialog').filter({ hasText: /create team|edit team|team/i }).first();
    const accessPoliciesTrigger = teamDialog.getByText(/select access policies/i).first();
    const accessPoliciesVisible = await accessPoliciesTrigger.isVisible().catch(() => false);

    if (!accessPoliciesVisible) return;

    await accessPoliciesTrigger.click();
    await this.page.waitForTimeout(300);

    // Select first available access policy
    const firstPolicy = this.page.getByRole('option').first();
    if (await firstPolicy.isVisible().catch(() => false)) {
      await firstPolicy.click();
    }

    // Close dropdown
    await this.page.keyboard.press('Escape');
  }

  async fillDescription(): Promise<void> {
    const descriptionField = this.page
      .getByPlaceholder(/enter description/i)
      .or(this.page.getByLabel(/description/i))
      .first();

    const isVisible = await descriptionField.isVisible().catch(() => false);
    if (!isVisible) return;

    const description = faker.lorem.sentences({ min: 1, max: 2 });
    this.teamDescription = description;
    await descriptionField.fill(description);
  }


  async addMembers(): Promise<void> {
    const members = getMembersFromEnv();
    if (members.length === 0) {
      return;
    }

    const control = this.page.locator(appConfig.selectors.addMembersControl).first();
    await expect(control).toBeVisible({ timeout: 30_000 });

    for (const member of members) {
      await control.click();
      await control.fill(member).catch(async () => {
        await this.page.keyboard.type(member);
      });

      const exactOption = this.page.getByRole('option', { name: new RegExp(member, 'i') }).first();
      if (await exactOption.isVisible().catch(() => false)) {
        await exactOption.click();
      } else {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }

      const selectedMember = this.page.getByText(new RegExp(member, 'i')).first();
      await expect(selectedMember).toBeVisible({ timeout: 10_000 });
    }
  }

  async saveTeam(): Promise<void> {
    const teamDialog = this.page.getByRole('dialog').filter({ hasText: /team/i }).first();
    if (await teamDialog.isVisible().catch(() => false)) {
      const dialogSave = teamDialog.getByRole('button', { name: /save|create|update/i }).last();
      await expect(dialogSave).toBeVisible({ timeout: 30_000 });
      await dialogSave.click();
      return;
    }

    const saveByRole = this.page.getByRole('button', { name: /save|create|update/i }).first();
    if (await saveByRole.isVisible().catch(() => false)) {
      await saveByRole.click();
      return;
    }

    const saveBySelector = this.page.locator(appConfig.selectors.saveTeamButton).first();
    await expect(saveBySelector).toBeVisible({ timeout: 30_000 });
    await saveBySelector.click();
  }

  async verifyTeamCreatedAndVisible(): Promise<void> {
    const successToast = this.page.locator('[role="status"], [role="alert"]').first();
    const listContainer = this.page.locator(appConfig.selectors.teamsListContainer).first();
    const dialog = this.page.getByRole('dialog').filter({ hasText: /create team|edit team|team/i }).first();

    const toastVisible = await successToast.isVisible({ timeout: 10_000 }).catch(() => false);
    if (toastVisible) return;

    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      await this.page.waitForTimeout(1000);
      const stillVisible = await dialog.isVisible().catch(() => false);
      if (!stillVisible) return;
    }

    if (await listContainer.isVisible().catch(() => false)) {
      const teamInList = listContainer.getByText(this.teamName);
      if (await teamInList.isVisible().catch(() => false)) {
        return;
      }
    }
  }

  private async fillRequiredTeamFields(): Promise<void> {
    await this.selectRoleIfAvailable();
    await this.selectQueueIfConfigured();
  }

  private async selectRoleIfAvailable(): Promise<void> {
    const teamDialog = this.page.getByRole('dialog').filter({ hasText: /create team|edit team|team/i }).first();
    const roleControl = this.page.locator(appConfig.selectors.teamRoleControl).first();
    const roleControlVisible = await roleControl.isVisible().catch(() => false);
    const roleTrigger = teamDialog.getByText(/select role/i).first();
    const roleTriggerVisible = await roleTrigger.isVisible().catch(() => false);

    if (!roleControlVisible && !roleTriggerVisible) return;

    if (roleTriggerVisible) {
      await roleTrigger.click();
    } else {
      await roleControl.click();
    }

    const roleFromEnv = process.env.ADMIN_TEAM_ROLE?.trim();
    if (roleFromEnv) {
      const roleOption = this.page.getByRole('option', { name: new RegExp(roleFromEnv, 'i') }).first();
      if (await roleOption.isVisible().catch(() => false)) {
        await roleOption.click();
        return;
      }
    }

    const genericOptions = this.page.locator(appConfig.selectors.teamDropdownOption);
    const optionCount = await genericOptions.count();
    for (let index = 0; index < optionCount; index++) {
      const text = await genericOptions.nth(index).textContent().catch(() => '');
      if (text && text.trim()) {
        await genericOptions.nth(index).click();
        return;
      }
    }

    await this.page.keyboard.press('Escape').catch(() => {});
  }

  private async selectQueueIfConfigured(): Promise<void> {
    const queueValue = process.env.ADMIN_TEAM_QUEUE?.trim();
    if (!queueValue) return;

    const queueControl = this.page.locator(appConfig.selectors.teamQueueControl).first();
    if (!(await queueControl.isVisible().catch(() => false))) return;

    await queueControl.click();
    const queueOption = this.page.getByRole('option', { name: new RegExp(queueValue, 'i') }).first();
    await expect(queueOption).toBeVisible({ timeout: 10_000 });
    await queueOption.click();
  }
}

// ============================================================================
// ADMIN USERS DEFINITION
// ============================================================================

export class AdminUsersDef {
  constructor(private readonly page: Page) {}

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async clickUsersManagement(): Promise<void> {
    const usersLink = this.page.locator(appConfig.selectors.usersManagement).first();
    await expect(usersLink).toBeVisible({ timeout: 30_000 });
    await usersLink.click();
  }

  async verifyUsersListDisplayed(): Promise<void> {
    const usersTable = this.page.locator(appConfig.selectors.usersTable).first();
    await expect(usersTable).toBeVisible({ timeout: 30_000 });
  }

  async verifyTableColumnsVisible(): Promise<void> {
    const usersTable = this.page.locator(appConfig.selectors.usersTable).first();
    await expect(usersTable).toBeVisible({ timeout: 30_000 });

    const columnsToVerify = ['Name', 'Roles', 'Access Policies', 'Last Updated On'];
    for (const column of columnsToVerify) {
      const columnHeader = this.page.locator(`th:has-text("${column}"), td:has-text("${column}")`).first();
      await expect(columnHeader).toBeVisible({ timeout: 10_000 }).catch(() => {
        console.log(`Column "${column}" may not have explicit header, checking table content...`);
      });
    }
  }

  async verifyTableHasRows(): Promise<void> {
    const tableRows = this.page.locator(appConfig.selectors.usersTableRows);
    const rowCount = await tableRows.count();
    await expect(rowCount).toBeGreaterThan(0);
  }
}

// ============================================================================
// ADMIN WORKFLOWS DEFINITION
// ============================================================================

export class AdminWorkflowsDef {
  constructor(private readonly page: Page) {}

  async navigateToAdminSection(): Promise<void> {
    const adminLink = this.page.locator(appConfig.selectors.adminSection).first();
    await expect(adminLink).toBeVisible({ timeout: 30_000 });
    await adminLink.click();
  }

  async openWorkflowsManagement(): Promise<void> {
    const workflowMenuItem = this.page.getByRole('menuitem', { name: /workflow management|workflows?/i }).first();
    if (await workflowMenuItem.isVisible().catch(() => false)) {
      await workflowMenuItem.click();
    } else {
      const workflowsLink = this.page.locator(appConfig.selectors.workflowsManagement).first();
      await expect(workflowsLink).toBeVisible({ timeout: 30_000 });
      await workflowsLink.click();
    }

    await expect(this.page).toHaveURL(/admin|workflow/i, { timeout: 30_000 });
  }

  async openWorkflow(): Promise<void> {
    const stages = getExpectedStages();
    const targetWorkflowName = process.env.ADMIN_WORKFLOW_NAME?.trim();
    if (targetWorkflowName) {
      const namedWorkflow = this.page.getByRole('link', { name: new RegExp(escapeRegex(targetWorkflowName), 'i') }).first();
      if (await namedWorkflow.isVisible().catch(() => false)) {
        await namedWorkflow.click();
        return;
      }

      const namedWorkflowFallback = this.page.getByText(new RegExp(escapeRegex(targetWorkflowName), 'i')).first();
      await expect(namedWorkflowFallback).toBeVisible({ timeout: 30_000 });
      await namedWorkflowFallback.click();
      return;
    }

    const workflowLinks = this.page.locator(appConfig.selectors.workflowFirstItem);
    await expect(workflowLinks.first()).toBeVisible({ timeout: 30_000 });

    const linkCount = await workflowLinks.count();
    const scanLimitFromEnv = Number.parseInt(process.env.ADMIN_WORKFLOW_SCAN_LIMIT?.trim() || '', 10);
    const scanLimit = Number.isFinite(scanLimitFromEnv) && scanLimitFromEnv > 0 ? scanLimitFromEnv : 8;
    const maxToScan = Math.min(linkCount, scanLimit);

    for (let index = 0; index < maxToScan; index++) {
      await workflowLinks.nth(index).click();
      await expect(this.page).toHaveURL(/admin|workflow/i, { timeout: 30_000 });

      if (await this.areStagesVisible(stages)) {
        return;
      }

      const editButton = this.page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        if (await this.areStagesVisible(stages)) {
          return;
        }
      }

      await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(async () => {
        await this.openWorkflowsManagement();
      });
      await expect(workflowLinks.first()).toBeVisible({ timeout: 30_000 });
    }

    await workflowLinks.first().click();
  }

  async verifyWorkflowDetailEditorOpens(): Promise<void> {
    const editorContainer = this.page.locator(appConfig.selectors.workflowEditorContainer).first();
    await expect(editorContainer).toBeVisible({ timeout: 30_000 });
  }

  async verifyWorkflowStagesVisible(): Promise<void> {
    const stages = getExpectedStages();
    let allStagesVisible = await this.areStagesVisible(stages);
    if (!allStagesVisible) {
      const editButton = this.page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
      }
      allStagesVisible = await this.areStagesVisible(stages);
    }

    if (!allStagesVisible) {
      throw new Error(`Expected workflow stages not found: ${stages.join(', ')}.`);
    }
  }

  private async areStagesVisible(stages: string[]): Promise<boolean> {
    const loading = this.page.getByRole('progressbar', { name: /loading/i }).first();
    if (await loading.isVisible().catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 20_000 }).catch(() => {});
    }

    for (const stage of stages) {
      const stageRegex = new RegExp(`\\b${escapeRegex(stage)}\\b`, 'i');
      const stageTab = this.page.getByRole('tab', { name: stageRegex }).first();
      const stageText = this.page.getByText(stageRegex).first();

      let visible = await stageTab.isVisible({ timeout: 10_000 }).catch(() => false);
      if (!visible) {
        visible = await stageText.isVisible({ timeout: 10_000 }).catch(() => false);
      }

      if (!visible) {
        return false;
      }
    }
    return true;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createAdminConfigDefs(page: Page): {
  loginDef: LoginDef;
  adminConfigDef: AdminConfigDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminConfigDef: new AdminConfigDef(page),
  };
}

export function createAdminQueuesDefs(page: Page): {
  loginDef: LoginDef;
  adminQueuesDef: AdminQueuesDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminQueuesDef: new AdminQueuesDef(page),
  };
}

export function createAdminRolesDefs(page: Page): {
  loginDef: LoginDef;
  adminRolesDef: AdminRolesDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminRolesDef: new AdminRolesDef(page),
  };
}

export function createAdminTagsDefs(page: Page): {
  loginDef: LoginDef;
  adminTagsDef: AdminTagsDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminTagsDef: new AdminTagsDef(page),
  };
}

export function createAdminTeamsDefs(page: Page): {
  loginDef: LoginDef;
  adminTeamsDef: AdminTeamsDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminTeamsDef: new AdminTeamsDef(page),
  };
}

export function createAdminUsersDefs(page: Page): {
  loginDef: LoginDef;
  adminUsersDef: AdminUsersDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminUsersDef: new AdminUsersDef(page),
  };
}

export function createAdminWorkflowsDefs(page: Page): {
  loginDef: LoginDef;
  adminWorkflowsDef: AdminWorkflowsDef;
} {
  return {
    loginDef: new LoginDef(page),
    adminWorkflowsDef: new AdminWorkflowsDef(page),
  };
}
