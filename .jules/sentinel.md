## 2025-03-05 - Fix security function roles configuration
**Learning:** Functions created without a definitive search_path parameter are susceptible to 'Role Mutable Search Path' warnings in PostgreSQL. If the caller alters the search path, they can inadvertently or maliciously invoke functions on unrelated schemas or alter operation outcomes.
**Action:** Recreated `get_my_role` and `get_my_department` functions adding `SET search_path = public` to enforce predictable schema resolution and comply with Supabase's Security linter rules.

## 2025-03-06 - Protected DOM Injection with Template Literals
**Learning:** Building HTML structures using template literals inside a `forEach` loop and appending them to the DOM exposes vulnerabilities to XSS attacks if data from the backend (like email, name, or role) contains untrusted input. Browsers evaluate entities during `.innerHTML` assignment.
**Action:** Implemented `escapeHTML()` wrapper on all dynamic profile and activity data fields before rendering them in the `teamHtml` loop for the Dashboard, and applied the same mechanism inside the `cuerpoTablaAdminActividades` and `cuerpoTablaAdminCategorias` rendering logic for the IT Admin view.
