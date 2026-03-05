## 2024-05-24 - Formula Injection in CSV Export
**Vulnerability:** The application was vulnerable to Formula Injection (CSV Injection) because it exported user-provided data directly to a CSV file without sanitization. An attacker could register an activity with a malicious payload (e.g., starting with '=', '+', '-', or '@') which could be executed when the exported CSV file is opened in a spreadsheet application like Microsoft Excel.
**Learning:** Untrusted user input should never be directly exported to CSV files without proper sanitization. The risk of Formula Injection is high when exporting data intended for spreadsheet applications.
**Prevention:** Apply a sanitization function (`escaparCSV`) to all user-provided data before exporting it to a CSV file. The function should prefix values starting with dangerous characters ('=', '+', '-', '@', '\t', '\r') with a single quote to prevent formula execution, and correctly escape commas and quotes.

## 2026-03-05 - Safe Option Creation
**Enhancement:** Refactored multiple instances of manual `<option>` element creation into a unified `crearOpcion(valor, texto)` helper.
**Learning:** Using `.textContent` instead of `.innerHTML` or `.innerText` during DOM element creation is a critical security practice for preventing XSS, as it treats the input as literal text and does not execute any embedded HTML or scripts.
**Prevention:** Always prefer `.textContent` for assigning dynamic strings to UI elements unless HTML parsing is explicitly required and the source is trusted/sanitized.

## 2024-05-24 - Stored XSS via "Safe" Inputs
**Vulnerability:** Date input fields were stored in IndexedDB and subsequently injected directly into `innerHTML` without escaping, assuming dates are inherently safe.
**Learning:** Client-side input types (e.g., `<input type="date">`) enforce zero data integrity or security guarantees. Attackers can trivially modify input attributes (e.g., changing `type="date"` to `type="text"`) via DevTools to submit arbitrary JavaScript payloads. If these are saved (Stored XSS) and rendered unescaped, it results in critical vulnerabilities.
**Prevention:** Never trust ANY user input regardless of the client-side input field type. Always sanitize or escape (e.g., `escapeHTML`) EVERY piece of user-controlled data before inserting it into the DOM via methods like `innerHTML`.
