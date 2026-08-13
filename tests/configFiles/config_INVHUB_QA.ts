export type AppConfig = {
  envName: string;
  loginUrl: string;
  postLoginPath: string;
  userEmail: string;
  investigatorEmail?: string;
  sessionTimeoutMs?: number;
  selectors: {
    emailInput: string;
    sendCodeButton: string;
    otpInput: string;
    verifyButton: string;
    adminSection: string;
    usersManagement: string;
    usersTable: string;
    usersTableRows: string;
    rolesManagement: string;
    rolesListContainer: string;
    rolesListRows: string;
    rolePermissionsContainer: string;
    rolePermissionControls: string;
    configurationManagement: string;
    configurationPageContainer: string;
    tagsManagement: string;
    createTagButton: string;
    tagFormContainer: string;
    tagNameInput: string;
    tagCategoryControl: string;
    tagDropdownOption: string;
    saveTagButton: string;
    tagsListContainer: string;
    tagSuccessToast: string;
    configSectionContainer: string;
    teamsManagement: string;
    createTeamButton: string;
    teamFormContainer: string;
    teamNameInput: string;
    addMembersControl: string;
    memberOption: string;
    teamRoleControl: string;
    teamQueueControl: string;
    teamDropdownOption: string;
    saveTeamButton: string;
    teamsListContainer: string;
    workflowsManagement: string;
    workflowFirstItem: string;
    workflowEditorContainer: string;
    queuesManagement: string;
    createQueueButton: string;
    editQueueButton: string;
    queueFirstRowLink: string;
    queueNameInput: string;
    assignmentRuleControl: string;
    assignmentRuleOption: string;
    saveQueueButton: string;
    queueFormContainer: string;
    queueSuccessToast: string;
    passwordInput: string;
    errorMessage: string;
    invalidCredentialsMessage: string;
    dashboardButton: string;
    investigationsMenu: string;
    casesMenu: string;
    createCaseButton: string;
    caseFormContainer: string;
    caseNameInput: string;
    caseDescriptionInput: string;
    saveCaseButton: string;
    caseSuccessToast: string;
    adminMenu: string;
    userProfileIcon: string;
    userMenu: string;
    logoutButton: string;
  };
};

export const configINVHUBQA: AppConfig = {
  envName: 'INVHUB_QA',
  loginUrl: process.env.LOGIN_URL?.trim() || 'https://qa.invhub.fseng.net/login',
  postLoginPath: '/investigation/open-investigations',
  userEmail: process.env.TEST_USER_EMAIL?.trim() || '',
  investigatorEmail: process.env.INVESTIGATOR_EMAIL?.trim() || process.env.TEST_USER_EMAIL?.trim() || '',
  sessionTimeoutMs: Number.parseInt(process.env.SESSION_TIMEOUT_MS?.trim() || '900000', 10),
  selectors: {
    emailInput: 'input[placeholder="Email"]',
    passwordInput: 'input[placeholder="Password"], input[type="password"], input[name*="password" i]',
    sendCodeButton: 'button:has-text("Send verification code")',
    otpInput:
      'input[placeholder*="verification" i], input[placeholder="000000"], input[placeholder*="otp" i], input[name*="otp" i], input[id*="otp" i]',
    verifyButton: 'button:has-text("Verify")',
    errorMessage: '[role="alert"], .alert, .error, [data-testid*="error" i], .text-red-500, .text-danger',
    invalidCredentialsMessage: '[role="alert"], [data-testid*="error" i], .alert, .error, [class*="error" i]',
    adminSection: 'a[href*="/admin"], button:has-text("Admin")',
    dashboardButton: 'button:has-text("Investigation Queue"), button:has-text("Dashboard"), button:has-text("Home"), a[href*="/investigation"]',
    investigationsMenu: 'a[href*="/investigation"], button:has-text("Investigations"), button:has-text("Investigation Queue"), [role="menuitem"]:has-text("Investigations")',
    casesMenu: 'a[href*="/investigation"], button:has-text("Investigation Queue"), button:has-text("Cases"), [role="menuitem"]:has-text("Investigation Queue"), [role="menuitem"]:has-text("Cases")',
    createCaseButton: 'button:has-text("New Case"), button:has-text("Create Case"), button:has-text("Create")',
    caseFormContainer: 'form, [role="dialog"], [data-testid*="case" i]',
    caseNameInput:
      'input[name*="case" i], input[id*="case" i], input[placeholder*="case name" i], input[placeholder*="name" i]',
    caseDescriptionInput:
      'textarea[name*="description" i], textarea[placeholder*="description" i], [aria-label*="description" i], textarea',
    saveCaseButton: 'button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")',
    caseSuccessToast:
      'text=/case (created|updated|saved|success)/i, [role="status"], [role="alert"]',
    adminMenu: 'a[href*="/admin"], button:has-text("Admin"), [role="menuitem"]:has-text("Admin")',
    userProfileIcon: 'header button:last-of-type, nav button:last-of-type, [role="navigation"] button:last-of-type, button[class*="user"], button[class*="profile"], [class*="header"] button:not([class*="menu"])',
    userMenu: '[role="menu"], [role="menuitem"], [class*="dropdown"], [class*="menu"]',
    logoutButton: 'button:has-text("Logout"), button:has-text("Log out"), button:has-text("logout"), a:has-text("Logout"), a:has-text("Log out"), div:has-text("Logout"), [class*="logout"]',
    usersManagement: 'a[href*="/admin/users"], button:has-text("Users")',
    usersTable: 'table, [role="table"]',
    usersTableRows: 'table tbody tr, [role="rowgroup"] [role="row"]',
    rolesManagement:
      'a[href*="/admin/role"], a[href*="/admin/roles"], button:has-text("Roles"), [role="menuitem"]:has-text("Roles")',
    rolesListContainer: 'table, [role="table"], [data-testid*="role" i], [role="list"], [role="grid"]',
    rolesListRows: 'table tbody tr, [role="row"], [role="listitem"], [data-testid*="role" i]',
    rolePermissionsContainer:
      '[data-testid*="permission" i], [data-testid*="role-details" i], [role="dialog"], [role="region"], main',
    rolePermissionControls:
      'input[type="checkbox"], [role="checkbox"], [role="switch"], button[role="switch"], [aria-checked]',
    configurationManagement:
      'a[href*="/admin/config"], button:has-text("Configuration"), [role="menuitem"]:has-text("System Configuration")',
    configurationPageContainer: 'main, [role="main"], [data-testid*="config" i], [role="region"]',
    tagsManagement:
      'a[href*="/admin/tag"], a[href*="/admin/tags"], button:has-text("Tags"), [role="menuitem"]:has-text("Tags Management")',
    createTagButton: 'button:has-text("Create Tag"), button:has-text("New Tag"), button:has-text("Create")',
    tagFormContainer: 'form, [role="dialog"], [data-testid*="tag" i]',
    tagNameInput:
      'input[name*="tag" i], input[id*="tag" i], input[placeholder*="Tag" i], input[placeholder*="Name" i], input[name*="name" i]',
    tagCategoryControl:
      '[role="combobox"][aria-label*="category" i], [aria-label*="Category" i], label:has-text("Category") + * [role="combobox"], label:has-text("Category") + * input',
    tagDropdownOption: '[role="option"], li[role="option"]',
    saveTagButton: 'button:has-text("Save"), button:has-text("Create"), button:has-text("Update")',
    tagsListContainer: 'table, [role="table"], [data-testid*="tag" i]',
    tagSuccessToast:
      'text=/tag (created|updated|saved) successfully/i, [role="status"], [role="alert"]',
    configSectionContainer: '[role="tablist"], [role="tabpanel"], [data-testid*="config" i], section',
    teamsManagement:
      'a[href*="/admin/team"], a[href*="/admin/teams"], button:has-text("Teams"), [role="menuitem"]:has-text("Teams Management")',
    createTeamButton: 'button:has-text("Create Team"), button:has-text("New Team"), button:has-text("Create")',
    teamFormContainer: 'form, [role="dialog"], [data-testid*="team" i]',
    teamNameInput:
      'input[name*="team" i], input[id*="team" i], input[placeholder*="Team" i], input[placeholder*="Name" i], input[name*="name" i]',
    addMembersControl:
      '[role="combobox"][aria-label*="member" i], input[placeholder*="member" i], input[name*="member" i], [aria-label*="Add member" i]',
    memberOption: '[role="option"], li[role="option"], .p-multiselect-item',
    teamRoleControl:
      '[role="combobox"][aria-label*="role" i], [aria-label*="Role" i], label:has-text("Role") + * [role="combobox"], label:has-text("Role") + * input',
    teamQueueControl:
      '[role="combobox"][aria-label*="queue" i], [aria-label*="Queue" i], label:has-text("Queue") + * [role="combobox"], label:has-text("Queue") + * input',
    teamDropdownOption: '[role="option"], li[role="option"]',
    saveTeamButton: 'button:has-text("Save"), button:has-text("Create"), button:has-text("Update")',
    teamsListContainer: 'table, [role="table"], [data-testid*="team" i]',
    workflowsManagement:
      'a[href*="/admin/workflow"], a[href*="/admin/workflows"], button:has-text("Workflows"), [role="menuitem"]:has-text("Workflow Management")',
    workflowFirstItem: 'table tbody tr a, [role="row"] a, [data-testid*="workflow" i] a',
    workflowEditorContainer: 'main, [role="main"], [data-testid*="workflow" i], [role="region"]',
    queuesManagement: 'a[href*="/admin/queues"], button:has-text("Queues")',
    createQueueButton: 'button:has-text("Create Queue"), button:has-text("New Queue")',
    editQueueButton: 'button:has-text("Edit"), [aria-label*="Edit queue" i]',
    queueFirstRowLink: 'table tbody tr td a, [role="row"] a[href*="/admin/queues-management/"]',
    queueNameInput:
      'input[name*="queue" i], input[placeholder*="Queue" i], input[id*="queue" i], input[placeholder*="Name" i], input[name*="name" i]',
    assignmentRuleControl:
      'select[name*="assignment" i], [role="combobox"][aria-label*="assignment" i], input[placeholder*="Assignment" i]',
    assignmentRuleOption:
      '[role="option"]:has-text("Round Robin"), option:has-text("Round Robin"), [role="option"]',
    saveQueueButton: 'button:has-text("Save"), button:has-text("Update"), button:has-text("Create")',
    queueFormContainer: 'form, [role="dialog"], [data-testid*="queue" i]',
    queueSuccessToast:
      'text=/queue (created|updated|saved) successfully/i, [role="status"], [role="alert"]',
  },
};
