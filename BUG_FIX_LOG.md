# Bug Fix Log

Record resolved errors, bugs, and problems here. Add a new dated entry whenever a project issue is fixed, including its cause and the change made.

## 2026-10-16 — Garden advisor chat API errors

- **Problem:** Chat failures showed a generic connection message, hiding useful setup or model errors.
- **Cause:** The frontend ignored the API's error message; the backend did not distinguish a missing Gemini API key or an empty model response.
- **Fix:** Added Gemini key and response validation, validated chat request input, returned a helpful configuration message for a missing key, and displayed safe API error messages in the chat UI.
- **Verification:** Confirmed the live `/api/chat` endpoint returned a Gemini reply, missing-key handling returned a configuration message, and the frontend production build passed.

## 2026-10-16 — Manual garden dimensions

- **Request:** Keep the AI Garden Planner out of the current release and let users set their garden's physical size manually.
- **Change:** Removed the AI planner UI and endpoint. Added width and length controls in meters, a proportional scrollable canvas, total-area display, and saved dimensions for garden designs.
- **Compatibility:** Existing saved designs without dimensions continue to load using the default 4 m × 4 m canvas; items are repositioned within the canvas when dimensions shrink.
- **Verification:** Production build passed. A browser check confirmed manual dimensions update the canvas and are included when saving a design.
- **Deferred:** The AI Garden Planner is reserved for a future version.

## 2026-10-16 — Responsive garden canvas

- **Problem:** Increasing garden dimensions could make the design canvas larger than the available page area.
- **Fix:** Scale the canvas to fit the available Design Your Space panel while preserving the garden's width-to-length ratio. Convert pointer positions back to canvas coordinates so drag-and-drop and item movement continue to work at every scale.
- **Verification:** Production build passed. Browser checks confirmed the mobile view switch keeps the canvas accessible without scrolling past the controls, large canvases fit on mobile and desktop without horizontal overflow, changing dimensions rescales the canvas, and touch users can tap palette items to add them and drag items to reposition them.

## 2026-10-16 — Zooming and navigating larger garden designs

- **Problem:** A 10 m × 10 m garden fitted the laptop canvas area by scaling down, leaving garden elements too small to work with.
- **Fix:** Added zoom-in, zoom-out, percentage, and fit controls. The canvas viewport now scrolls when zoomed past its fitted size, and item movement/drop coordinates account for the active zoom.
- **Verification:** Production build passed. On a laptop-sized viewport, browser checks confirmed the 10 m × 10 m garden fits initially, zoom controls enlarge and restore it, the enlarged canvas can scroll within its viewport without widening the page, and items can be added while zoomed.

## 2026-10-16 — Dragging garden beds and plants

- **Problem:** Dragging a bed or plant from the palette to the garden did not add it to the canvas.
- **Cause:** Palette data and canvas-item movement shared one drag reference, which could be cleared by pointer events before the drop was handled.
- **Fix:** Separate item-movement state from palette drag data and transfer the selected palette item through the browser's drag data. Validate the item before adding it.
- **Verification:** Production build passed. Browser checks confirmed rectangular and circular beds and plants can be dragged onto the canvas, including when pointer-up occurs before drop, and existing canvas items can still be moved.
