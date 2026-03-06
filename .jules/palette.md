## 2024-05-14 - CSS-based Progress Bars and ARIA Enhancements
**Learning:** Using heavy charting libraries (like Chart.js) for simple dashboard metrics bloats the application bundle. Simple percentage representations can be beautifully and efficiently created using CSS flex/width transitions.
**Action:** Implemented a pure CSS `.progress-bar` system in `style.css` and added `aria-label` properties to the newly added navigation buttons (`#btnNavDashboard`, `#btnNavCatalogos`) to ensure assistive technologies correctly announce the role-specific functionality.

## 2026-03-05 - Dashboard Stats Redesign
**Learning:** Replaced single row stats banner with a modern, responsive grid-based set of cards with visual hierarchy, icons, and soft box-shadows matching QbD design rules.
**Action:** Overhauled `bannerEstadisticas` in `index.html` and added `.modern-dashboard` styling in `style.css`.

## 2025-03-06 - Executive Dashboard Empty State Redesign
**Learning:** Returning completely blank screens when an expected database relation (like `department`) is missing creates an extremely frustrating user experience, often misidentified by non-technical users as a critical application failure.
**Action:** Replaced the silent `return` on the `teamMembers` array check with a full-width empty state container containing a descriptive icon (👥), a clear heading ("Aún no tienes un equipo asignado"), and actionable copy instructing the VP to contact the IT Administrator to configure their Supabase profile.

## 2026-03-06 - Progressive Disclosure & Dashboard Layout UX
**Learning:** Cluttered UI forms (like Management or Stats) create significant cognitive load and feel like a "programmer's prototype". Using Progressive Disclosure via interactive CSS-based Cards and Accordions dramatically improves the Elite Clinical Software experience without changing backend logic.
**Action:** Replaced static grids with hide/show Card Menus and `<div class="accordion-item">` wrappers to handle complex team/stats comparisons (H2H) and administration tools.
