## 2026-03-04 - Optimize DOM and string manipulation in loops
**Learning:** Found multiple instances where DOM elements were appended individually in loops (e.g., table rows, dropdown options) causing unnecessary reflows/repaints, and strings were concatenated in loops for CSV generation, which can be inefficient due to multiple memory allocations.
**Action:** Always use DocumentFragment for batched DOM insertions within loops, and prefer array `.push()` combined with `.join()` for large string builder operations to ensure O(N) memory complexity rather than O(N^2).

## Current Task - Memory Optimization in Array Filtering
**Learning:** When filtering large datasets for CSV export (e.g., the new Date & Protocol filters), it is inefficient to constantly slice or mutate arrays directly if they can be immutable. The previous array filter in `actualizarTablaBitacora` was generating new large arrays in memory unnecessarily.
**Action:** The CSV export logic was optimized to directly utilize the pre-filtered `actividadesFiltradas` reference if it exists and has length, rather than parsing `listaActividades` from scratch. This is a O(1) memory check instead of an O(N) iteration, which saves CPU cycles and prevents GC bloat on large timesheet datasets.
