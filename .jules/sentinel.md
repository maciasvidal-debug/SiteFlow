## 2024-05-14 - XSS Sanitization in Dashboard Rendering
**Learning:** Data fetched from a database (even if previously validated) should always be treated as untrusted when rendering it into HTML via `.innerHTML`. Unsanitized fields like `profiles.first_name` could lead to Stored XSS if compromised.
**Action:** Enforced the strict use of the `escapeHTML()` utility when building string templates for the `tablaAuditoria` in `renderizarTablaAuditoria`, ensuring all dynamic string fields fetched from Supabase are safely encoded.
