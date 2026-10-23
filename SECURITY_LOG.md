# Security Log

This file records security findings and remediation performed for the project.

## 2026-10-23 — Chat Markdown XSS risk

- **Finding:** AI-generated Markdown was converted to HTML and inserted into the chat with React's `dangerouslySetInnerHTML` without sanitization. A malicious or manipulated model response could therefore inject unsafe HTML into a user's browser.
- **Location:** `frontend/src/pages/ChatPage.jsx`
- **Severity:** High
- **Status:** Fixed. The rendered Markdown is now sanitized with DOMPurify before insertion.
- **Verification:** The production frontend build passed. A browser test supplied an HTML payload containing a script and an image event handler; neither executed.
- **Exploitation observed:** No evidence of actual exploitation was found during this review.

## 2026-10-23 — Dependency audit snapshot

- **Check:** `npm audit --omit=dev`
- **Result:** npm reported 10 dependency advisories: 2 critical, 5 high, 2 moderate, and 1 low.
- **Status:** Not remediated as part of the XSS fix. This is an audit snapshot; review the current audit output before making dependency changes, since advisories and dependency versions can change.

## 2026-10-23 — Shared garden API access

- **Finding:** The garden API exposed shared designs to unauthenticated readers and allowed unauthenticated clients to replace the shared design collection.
- **Severity:** Medium
- **Status:** Fixed by moving saved designs to browser-local storage and removing the `/api/gardens` route from the running backend. Designs are now isolated to the visitor's browser profile and are not available for cross-device sync.
- **Verification:** Playwright checks that a saved design survives a page reload in the same browser and that the garden builder makes no requests to `/api/gardens`.
- **Exploitation observed:** No evidence of actual exploitation was found during the review.

## 2026-10-23 — Repository security and reliability review

- **Finding:** The public chat endpoint had no request rate limit and accepted unbounded message/history content within the server's JSON body limit.
- **Status:** Fixed with per-IP rate limiting, message/history validation, a 64 KB JSON body limit, and matching frontend limits. The rate limiter uses in-memory storage; configure a shared store if deploying multiple backend instances.
- **Finding:** Garden design names could use `__proto__`, which is a special property on ordinary JavaScript objects and could prevent the design from being stored as expected.
- **Status:** Fixed by rejecting that reserved design name when saving or renaming.
- **Finding:** Dependency audit reported 10 advisories, including critical and high severity packages.
- **Status:** Updated compatible dependencies, removed unused CORS and Nodemon packages, moved build/development tooling to `devDependencies`, and replaced Nodemon with Node's built-in watch mode. A subsequent `npm audit` reported zero vulnerabilities.
- **Finding:** The chat page was included in the initial frontend bundle even on pages that do not use it.
- **Status:** Fixed by lazy-loading the chat page.
- **Verification:** Production build passed; Playwright passed 5/5, including chat rate limiting, oversized-message rejection, and reserved design-name rejection.
- **Exploitation observed:** No evidence of actual exploitation was found during this review.
