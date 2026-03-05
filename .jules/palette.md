## 2024-05-24 - Accessibility improvements for icon-only buttons
**Learning:** Icon-only buttons (like Edit/Delete emojis) are inherently inaccessible to screen readers.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons (e.g., `aria-label="Editar actividad"`, `aria-label="Eliminar actividad"`) to communicate their purpose to assistive technology users. Ensure focus visibility is maintained for keyboard navigation.

## Current Task - Accessibility improvements for 'Action Item' checkboxes and labels
**Learning:** Standalone checkboxes inside forms without associated labels make it impossible for screen reader users to understand their context or activate them easily by clicking the text.
**Action:** Wrapped the "Create Action Item" checkbox in a `<label>` element. This natively associates the descriptive text with the input element, dramatically increasing the click target area (UX) and ensuring proper semantic reading for assistive technologies (A11Y).
