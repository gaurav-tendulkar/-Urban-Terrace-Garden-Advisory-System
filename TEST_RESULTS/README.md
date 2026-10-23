# Test Results

Keep a separate Markdown report in this folder for each test or validation run.

## Playwright browser tests

- Run the browser tests with `npm run test:e2e`.
- On a new machine, install the Chromium browser once with `npx playwright install chromium`.
- Playwright writes a timestamped Markdown summary for every run to this folder.
- Failure traces and other generated artifacts are stored under `.artifacts/`.
- Garden design persistence tests use browser-local storage; designs do not sync across browsers or devices.

For every run, record:

- Date
- Command or validation method
- Scope
- Result
- Relevant failures, warnings, or notes

Use a descriptive, date-prefixed filename, for example `YYYY-MM-DD-chat-security.md`.
Do not describe a build or manual browser check as an automated test suite.
