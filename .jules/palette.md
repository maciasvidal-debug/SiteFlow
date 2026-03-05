## 2024-05-17 - A11y in Multi-Input Form Groups
**Learning:** Screen readers struggle to contextualize multi-input form groups (e.g., hours and minutes inputs clustered under a single "Tiempo invertido:" visual label) because standard `<label>` tags only associate with one input ID. Additionally, adjacent decorative text spans (like "h" and "m") create redundant or confusing auditory noise.
**Action:** Always add explicit `aria-label`s to individual inputs within a multi-input group, and use `aria-hidden="true"` on their adjacent decorative text units to ensure clean, clear screen reader pronunciation.🎨 Palette: Fix cut-off buttons on mobile view

**Learning:** The bottom navigation bar was overlapping with the main container content on mobile devices due to insufficient bottom padding in the scrollable view and no bottom margin on the container itself. Adjusting the padding and margin resolves this layout issue while maintaining an optimal UI/UX.

**Action:** Increased `.vista` padding-bottom from 90px to 120px and added a 20px margin-bottom to `.contenedor` in `style.css`. Incremented `NOMBRE_CACHE` in `sw.js` from v1.3.5 to v1.3.6 to trigger the PWA update flow.
