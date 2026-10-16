# Bug Fix Log

Record resolved errors, bugs, and problems here. Add a new dated entry whenever a project issue is fixed, including its cause and the change made.

## 2026-10-16 — Garden advisor chat API errors

- **Problem:** Chat failures showed a generic connection message, hiding useful setup or model errors.
- **Cause:** The frontend ignored the API's error message; the backend did not distinguish a missing Gemini API key or an empty model response.
- **Fix:** Added Gemini key and response validation, validated chat request input, returned a helpful configuration message for a missing key, and displayed safe API error messages in the chat UI.
- **Verification:** Confirmed the live `/api/chat` endpoint returned a Gemini reply, missing-key handling returned a configuration message, and the frontend production build passed.

## 2026-10-16 — AI garden plan generator

- **Feature:** Added an AI garden planner to the garden builder using the existing Gemini integration.
- **Inputs:** Terrace area, sunlight, growing zone/climate, and INR budget.
- **Review and apply:** Users review the generated layout summary and supported plant recommendations before adding plants to the existing canvas. Generated recommendations are limited to the plant types already supported by the builder.
- **Validation:** Added server-side input and structured model-output validation; plan-generation errors appear in the planner instead of silently failing.
- **Verification:** Production build passed; a live Gemini-backed `POST /api/chat/plan` returned supported recommendations, invalid area returned HTTP 400, and a browser interaction verified review and one-click canvas addition.
