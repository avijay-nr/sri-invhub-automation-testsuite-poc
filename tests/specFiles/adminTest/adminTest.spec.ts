import { test } from '@playwright/test';
import { appConfig } from '../../configFiles/config';
import {
  createAdminConfigDefs,
  createAdminQueuesDefs,
  createAdminRolesDefs,
  createAdminTagsDefs,
  createAdminTeamsDefs,
  createAdminUsersDefs,
  createAdminWorkflowsDefs,
} from '../../definitionFiles/adminTestDef/adminTestDef';
import { LoginDef } from '../../definitionFiles/loginTestDef/loginTestDef';
import { AdminTagsDef } from '../../definitionFiles/adminTestDef/adminTestDef';
import { AdminTeamsDef } from '../../definitionFiles/adminTestDef/adminTestDef';
import { AdminUsersDef } from '../../definitionFiles/adminTestDef/adminTestDef';
import { AdminWorkflowsDef } from '../../definitionFiles/adminTestDef/adminTestDef';

// ✅ After every test — save final rotated tokens to session.json
// App JS rotates tokens during test execution; this captures the very last state
// so the next test run always starts with valid tokens (no OTP needed!)
test.afterEach(async ({ page }) => {
  const loginDef = new LoginDef(page);
  await loginDef.saveFinalTokens();
});

// TC-ADMIN-001: View Users List
test(`View Users List (Admin) - ${appConfig.envName} @admin_TC0001`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  await test.step('Login to application', async () => {
    await loginDef.loginIfNeeded();
  });
  const adminUsersDef = new AdminUsersDef(page);
  await test.step('Navigate to Admin section', async () => {
    await adminUsersDef.navigateToAdminSection();
  });
  await test.step('Click Users management', async () => {
    await adminUsersDef.clickUsersManagement();
  });
  await test.step('Verify users list displayed', async () => {
    await adminUsersDef.verifyUsersListDisplayed();
  });
  await test.step('Verify table has data rows', async () => {
    await adminUsersDef.verifyTableHasRows();
  });
  await test.step('Verify table columns are visible', async () => {
    await adminUsersDef.verifyTableColumnsVisible();
  });
});

// TC-ADMIN-002: Create Team
test(`Create Team (Admin) - ${appConfig.envName} @admin_TC0002`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  const adminTeamsDef = new AdminTeamsDef(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Teams', async () => {
    await adminTeamsDef.navigateToAdminSection();
    await adminTeamsDef.openTeamsManagement();
  });
  await test.step('Open create team form', async () => {
    await adminTeamsDef.openCreateTeamForm();
  });
  await test.step('Enter team name', async () => {
    await adminTeamsDef.enterTeamName();
  });
  await test.step('Select multiple roles', async () => {
    await adminTeamsDef.selectMultipleRoles();
  });
  await test.step('Select queue', async () => {
    await adminTeamsDef.selectQueue();
  });
  await test.step('Select access policies', async () => {
    await adminTeamsDef.selectAccessPolicies();
  });
  await test.step('Fill description', async () => {
    await adminTeamsDef.fillDescription();
  });
  await test.step('Save team', async () => {
    await adminTeamsDef.saveTeam();
  });
  await test.step('Verify team created and visible', async () => {
    await adminTeamsDef.verifyTeamCreatedAndVisible();
  });
});

// TC-ADMIN-003: Configure Queue
test(`Configure Queue (Admin) - ${appConfig.envName} @admin_TC0003`, async ({ page }) => {
  const { loginDef, adminQueuesDef } = createAdminQueuesDefs(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Queues', async () => {
    await adminQueuesDef.navigateToAdminSection();
    await adminQueuesDef.openQueuesManagement();
  });
  await test.step('Open queue form', async () => {
    await adminQueuesDef.openCreateQueueForm();
  });
  await test.step('Enter queue name', async () => {
    await adminQueuesDef.enterQueueName();
  });
  await test.step('Fill queue description', async () => {
    await adminQueuesDef.fillQueueDescription();
  });
  await test.step('Set assignment rules', async () => {
    await adminQueuesDef.setAssignmentRules();
  });
  await test.step('Save queue', async () => {
    await adminQueuesDef.saveQueue();
  });
  await test.step('Verify queue created/updated successfully', async () => {
    await adminQueuesDef.verifyQueueCreatedOrUpdatedSuccessfully();
  });
});

// TC-ADMIN-004: View Workflow Configuration
test(`View Workflow Configuration (Admin) - ${appConfig.envName} @admin_TC0004`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  const adminWorkflowsDef = new AdminWorkflowsDef(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Workflows', async () => {
    await adminWorkflowsDef.navigateToAdminSection();
    await adminWorkflowsDef.openWorkflowsManagement();
  });
  await test.step('Click on a workflow', async () => {
    await adminWorkflowsDef.openWorkflow();
  });
  await test.step('Verify workflow detail/editor opens', async () => {
    await adminWorkflowsDef.verifyWorkflowDetailEditorOpens();
  });
  await test.step('Verify workflow stages are visible', async () => {
    await adminWorkflowsDef.verifyWorkflowStagesVisible();
  });
});

// TC-ADMIN-005: Create Tag
test(`Create Tag (Admin) - ${appConfig.envName} @admin_TC0005`, async ({ page }) => {
  const loginDef = new LoginDef(page);
  const adminTagsDef = new AdminTagsDef(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Tags', async () => {
    await adminTagsDef.navigateToAdminSection();
    await adminTagsDef.openTagsManagement();
  });
  await test.step('Open create tag form', async () => {
    await adminTagsDef.openCreateTagForm();
  });
  await test.step('Enter tag name', async () => {
    await adminTagsDef.enterTagName();
  });
  await test.step('Select tag category', async () => {
    await adminTagsDef.selectTagCategory();
  });
  await test.step('Enter tag description', async () => {
    await adminTagsDef.enterTagDescription();
  });
  await test.step('Save tag', async () => {
    await adminTagsDef.saveTag();
  });
  await test.step('Verify tag created and visible in list', async () => {
    await adminTagsDef.verifyTagCreatedAndVisible();
  });
});

// TC-ADMIN-006: System Configuration View
test(`System Configuration View (Admin) - ${appConfig.envName} @admin_TC0006`, async ({ page }) => {
  const { loginDef, adminConfigDef } = createAdminConfigDefs(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Configuration', async () => {
    await adminConfigDef.navigateToAdminSection();
    await adminConfigDef.openConfigurationPage();
  });
  await test.step('Verify configuration sections are visible', async () => {
    await adminConfigDef.verifyConfigurationSectionsVisible();
  });
  await test.step('Verify configuration controls are visible', async () => {
    await adminConfigDef.verifyConfigurationControlsVisible();
  });
});

// TC-ADMIN-007: View and Edit Roles
test(`View and Edit Roles (Admin) - ${appConfig.envName} @admin_TC0007`, async ({ page }) => {
  const { loginDef, adminRolesDef } = createAdminRolesDefs(page);
  await test.step('Login as admin user', async () => {
    await loginDef.loginIfNeeded();
  });
  await test.step('Navigate to Admin > Roles', async () => {
    await adminRolesDef.navigateToAdminSection();
    await adminRolesDef.openRolesManagement();
  });
  await test.step('Verify roles listed', async () => {
    await adminRolesDef.verifyRolesListed();
  });
  await test.step('Open a role to view permissions', async () => {
    await adminRolesDef.openRoleToViewPermissions();
  });
  await test.step('Verify permission controls are visible', async () => {
    await adminRolesDef.verifyPermissionsVisible();
  });
});  