# SRI Investigation Hub Automation Testsuite

## Introduction
This project uses a Playwright + TypeScript UI automation framework for SRI Investigation Hub login and redirect validation.

Key capabilities:

- Environment-driven URLs and test data via `configFiles`
- Page Object-like reusable interaction methods via `definitionFiles`
- High-level scenario orchestration via `specFiles`
- Automated OTP fetch support from mailbox/script command

## Framework Design and Page Object Model
The framework follows a Page Object-like separation:

- `specFiles`: Test scenarios and high-level test flow
- `definitionFiles`: Reusable page interaction methods (locators + actions + assertions)
- `configFiles`: Environment-specific test data and URL settings

Flow for login:

1. `login.spec.ts` defines test steps.
2. It calls methods from `loginDef.ts`.
3. `loginDef.ts` reads values from `config.ts`.
4. `config.ts` selects the active environment config.

## Project Structure
```text
.
|-- .env
|-- playwright.config.ts
|-- package.json
|-- tsconfig.json
|-- tools
|   `-- get-otp.ps1
|-- tests
|   |-- configFiles
|   |   |-- config.ts
|   |   `-- config_INVHUB_QA.ts
|   |-- definitionFiles
|   |   `-- loginDef.ts
|   |-- specFiles
|   |   `-- login.spec.ts
|   `-- utils
|       `-- otp.ts
`-- README.md
```

## Configuration
Common non-secret defaults are maintained in `tests/configFiles/config.ts` and can be changed there for the team. Local environment variables can override those defaults for a run:

```env
TEST_CONFIG=INVHUB_QA
TEST_USER_EMAIL=investigator-user@example.com
LOGIN_URL=https://qa.invhub.fseng.net/login
TEST_OTP=
OTP_FETCH_CMD=powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\get-otp.ps1
OTP_REGEX=(\d{6})
OTP_FETCH_TIMEOUT_SEC=90
OTP_FETCH_POLL_SEC=3
OTP_EMAIL_SUBJECT_HINT=
```

Keep local-only values and secrets such as `TEST_OTP`, API keys, and mailbox credentials out of source control.

## Test Flow
1. Open login page.
2. Enter configured user email.
3. Click `Send verification code`.
4. Auto-fetch OTP and submit.
5. Verify redirect to `/investigation/open-investigations`.
6. Wait 5 seconds after successful redirect.

## Setup and Run
1. Install dependencies:
```bash
npm install
```

2. Install browser binaries:
```bash
npx playwright install
```

3. Run login smoke:
```bash
npm test -- tests/specFiles/login.spec.ts
```

4. Run headed mode:
```bash
npm run test:headed -- tests/specFiles/login.spec.ts
```

## Notes
- Keep `.env` out of source control.
- `TEST_OTP` can be used for one-off runs; if set, it overrides mailbox fetch.
- `OTP_NOT_BEFORE_ISO` is set by the test automatically to avoid stale OTP reuse.
