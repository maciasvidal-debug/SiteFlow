## 2026-03-04 - Optimize DOM and string manipulation in loops
**Learning:** Found multiple instances where DOM elements were appended individually in loops (e.g., table rows, dropdown options) causing unnecessary reflows/repaints, and strings were concatenated in loops for CSV generation, which can be inefficient due to multiple memory allocations.
**Action:** Always use DocumentFragment for batched DOM insertions within loops, and prefer array `.push()` combined with `.join()` for large string builder operations to ensure O(N) memory complexity rather than O(N^2).

## 2026-03-05 - Batching Filter Updates
**Learning:** Appending options to a `select` element one by one in a loop triggers multiple browser reflows and repaints, which is suboptimal for performance.
**Action:** Implemented `DocumentFragment` to batch the addition of options to the protocol filter dropdown. This ensures that the DOM is modified only once per update, reducing synchronous layout overhead.
