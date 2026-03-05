## 2026-03-04 - Optimize DOM and string manipulation in loops
**Learning:** Found multiple instances where DOM elements were appended individually in loops (e.g., table rows, dropdown options) causing unnecessary reflows/repaints, and strings were concatenated in loops for CSV generation, which can be inefficient due to multiple memory allocations.
**Action:** Always use DocumentFragment for batched DOM insertions within loops, and prefer array `.push()` combined with `.join()` for large string builder operations to ensure O(N) memory complexity rather than O(N^2).

## Current Task - Memory Optimization in Array Filtering
**Learning:** When filtering large datasets for CSV export (e.g., the new Date & Protocol filters), it is inefficient to constantly slice or mutate arrays directly if they can be immutable. The previous array filter in `actualizarTablaBitacora` was generating new large arrays in memory unnecessarily.
**Action:** The CSV export logic was optimized to directly utilize the pre-filtered `actividadesFiltradas` reference if it exists and has length, rather than parsing `listaActividades` from scratch. This is a O(1) memory check instead of an O(N) iteration, which saves CPU cycles and prevents GC bloat on large timesheet datasets.

## Performance Learning: Redundant Synchronous I/O
- **Problem:** Repeated calls to `localStorage.getItem` within the same function execution.
- **Solution:** Store the value in a local variable on the first call and reuse it.
- **Impact:** Reduces blocking synchronous I/O. Although `localStorage` is fast for small values, avoiding unnecessary calls is a best practice for smooth UI performance, especially in functions called during render or update cycles.
- **Task:** Removed redundant `localStorage.getItem('metaFTE')` call in `actualizarEstadisticas`.
