## 2025-03-05 - Fix security function roles configuration
**Learning:** Functions created without a definitive search_path parameter are susceptible to 'Role Mutable Search Path' warnings in PostgreSQL. If the caller alters the search path, they can inadvertently or maliciously invoke functions on unrelated schemas or alter operation outcomes.
**Action:** Recreated `get_my_role` and `get_my_department` functions adding `SET search_path = public` to enforce predictable schema resolution and comply with Supabase's Security linter rules.

## 2025-03-06 - Protected DOM Injection with Template Literals
**Learning:** Building HTML structures using template literals inside a `forEach` loop and appending them to the DOM exposes vulnerabilities to XSS attacks if data from the backend (like email, name, or role) contains untrusted input. Browsers evaluate entities during `.innerHTML` assignment.
**Action:** Implemented `escapeHTML()` wrapper on all dynamic profile and activity data fields before rendering them in the `teamHtml` loop for the Dashboard, and applied the same mechanism inside the `cuerpoTablaAdminActividades` and `cuerpoTablaAdminCategorias` rendering logic for the IT Admin view.
## 2026-03-06 - Implement Splash Screen and UX fixes
**Learning:** Adding DOM logic like `splashScreen` transitions requires defensive checks (`if (splash)`) and careful handling of async operations to ensure it doesn't break initial loads. Also, patching Supabase dependencies manually via JS regex or replaces can easily introduce typos (like `supabaseClientClient`), always verify function paths via automated unit tests and strictly typed references.
**Action:** Implemented a minimal `splashScreen` loader component with SVG. Fixed `supabase.from` reference bug to `supabaseClient.from`. Enforced strictly "Zero White Boxes" on table and UI elements using dynamic CSS variables (`var(--surface-color)`). Increased PWA cache version (`sw.js`).

## 2025-03-07 - Avoid Inline JavaScript Event Handlers with Interpolated Data
**Vulnerability:** Inline event handlers (like `onclick="delete('${id}')"`) combined with interpolated database data in HTML strings bypass `escapeHTML` protection. The browser decodes HTML entities before executing the script, leaving the application open to Cross-Site Scripting (XSS).
**Learning:** Even if data is sanitized via HTML entity encoding, interpolating it inside an HTML attribute that expects JavaScript code evaluates the decoded string directly as code.
**Prevention:** Never use inline JavaScript event handlers (like `onclick`) when rendering dynamic lists. Instead, attach necessary data using `data-*` attributes and bind events securely via `addEventListener()` after the elements are added to the DOM.
