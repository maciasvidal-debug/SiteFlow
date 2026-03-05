## 2024-05-24 - Formula Injection in CSV Export
**Vulnerability:** The application was vulnerable to Formula Injection (CSV Injection) because it exported user-provided data directly to a CSV file without sanitization. An attacker could register an activity with a malicious payload (e.g., starting with '=', '+', '-', or '@') which could be executed when the exported CSV file is opened in a spreadsheet application like Microsoft Excel.
**Learning:** Untrusted user input should never be directly exported to CSV files without proper sanitization. The risk of Formula Injection is high when exporting data intended for spreadsheet applications.
**Prevention:** Apply a sanitization function (`escaparCSV`) to all user-provided data before exporting it to a CSV file. The function should prefix values starting with dangerous characters ('=', '+', '-', '@', '\t', '\r') with a single quote to prevent formula execution, and correctly escape commas and quotes.

## Current Task - XSS Prevention in Task Rendering
**Enhancement/Vulnerability:** When rendering the newly implemented "Action Items" (Tareas), the task title string from user input (which inherits the description from activities) was interpolated directly into HTML strings (`div.innerHTML = ... ${tarea.titulo} ...`). This posed a risk of Stored XSS if malicious scripts were injected into activity descriptions.
**Learning:** Always use standard text modification (like `textContent` or `innerText`) instead of `.innerHTML` when handling user-provided data. For complex HTML rendering, user data must be explicitly sanitized or appended as text nodes.
**Prevention:** Avoid `innerHTML` directly with user input. Since the implementation is Vanilla JS, user strings can be placed safely via DOM TextNode creation or `textContent`.
