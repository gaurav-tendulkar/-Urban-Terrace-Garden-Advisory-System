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

## 2026-10-20 — Circular bed delete button positioning

- **Problem:** The delete button was positioned outside bed boundaries and became too small to target when the canvas was scaled, making it difficult to delete circular beds.
- **Fix:** Move the delete control inside the bed's top-right edge, keep its rendered size consistent across canvas zoom levels, and show it on touch devices and keyboard focus.
- **Verification:** Production build passed. Browser checks confirmed the button remains inside a scaled circular bed at a usable 28 px size and clicking it removes the bed.

## 2026-10-20 — Compact Garden Elements sidebar

- **Request:** Reduce the space used by Garden Elements in the garden builder.
- **Change:** Narrowed the desktop sidebar and tightened its padding and vertical spacing so more room is available to the canvas. Mobile continues to use the full-width controls view.
- **Verification:** Production build passed.

## 2026-10-20 — Vegetable growing profiles

- **Request:** Add India-focused growing information for the supplied vegetables and show it when a plant is selected in the garden builder.
- **Change:** Added the 30 supplied vegetable profiles to the palette, show their growing details in a dialog, and retain Sunflower for compatibility with existing designs. New catalog plants use the canvas's default icon so adding one does not crash rendering.
- **Verification:** Production build and `git diff --check` passed. Browser checks confirmed profile selection and dialog closing, plus mobile tap-to-add rendering a new catalog plant.

## 2026-10-21 — Local plant and decoration icons

- **Request:** Download the needed vegetable and decoration icons into the project.
- **Change:** Added 15 locally stored plant SVGs and 9 decoration SVGs from Twemoji, mapped every catalog plant to a palette and canvas icon, and included the CC BY 4.0 license and attribution.
- **Verification:** Production build passed, all 30 vegetable profiles have icon mappings, and Vite copies all 24 SVGs into the production output.

## 2026-10-21 — Individual transparent vegetable illustrations

- **Request:** Give every vegetable its own comprehensive icon and remove the white background.
- **Change:** Replaced shared plant icon mappings with 30 distinct original transparent vegetable SVGs, added a separate Sunflower SVG, and removed the white badge behind plants on the garden canvas. Twemoji attribution now applies only to the downloaded decoration icons.
- **Verification:** Confirmed all 31 plant SVG files are unique, every vegetable and Sunflower has a matching asset, and none has a white background rectangle. The production build passed; browser checks confirmed all 31 palette images load and added plants render on a transparent canvas.

## 2026-10-21 — Plant quick-add and garden decorations

- **Request:** Let users add a plant from its details popup and add decorative garden elements.
- **Change:** Added an Add to garden action to plant details, plus clickable, keyboard-accessible, draggable Pathway, Fence, Bench, Flower Pot, Garden Light, Water Feature, Stepping Stones, and Garden Arch elements. Decorations render on the canvas and are validated, repositioned, and persisted with garden designs.
- **Verification:** Production build and `git diff --check` passed. Browser checks confirmed popup quick-add, click and keyboard decoration placement, drag-and-drop, and decoration persistence through save/reload.

## 2026-10-21 — Rotating and refining garden decorations

- **Request:** Rotate decorations between horizontal and vertical orientations and use better icons with appropriate dimensions.
- **Change:** Added a 90-degree rotate control to canvas decorations. Rotated items swap their footprint dimensions, stay within garden bounds, and preserve orientation when designs are saved and loaded. Replaced emoji/borrowed generic decoration renderings with dedicated transparent vector illustrations and adjusted each element's dimensions.
- **Verification:** Production build and `git diff --check` passed. Browser checks confirmed rotation changes a pathway from 160 × 48 px to 48 × 160 px and restores the rotated dimensions after save/reload.
