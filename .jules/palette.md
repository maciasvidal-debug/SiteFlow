## 2024-05-14 - CSS-based Progress Bars and ARIA Enhancements
**Learning:** Using heavy charting libraries (like Chart.js) for simple dashboard metrics bloats the application bundle. Simple percentage representations can be beautifully and efficiently created using CSS flex/width transitions.
**Action:** Implemented a pure CSS `.progress-bar` system in `style.css` and added `aria-label` properties to the newly added navigation buttons (`#btnNavDashboard`, `#btnNavCatalogos`) to ensure assistive technologies correctly announce the role-specific functionality.
