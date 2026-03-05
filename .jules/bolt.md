## 2024-05-14 - Optimized KPI Dashboard Calculation (O(N) single pass)
**Learning:** Initial iterations might require multiple `.filter` or `.reduce` passes over arrays to extract different sum metrics (e.g., pending hours vs. approved hours). This iterates the entire array N times. By combining the calculation in a single `.forEach` loop, we reduce iterations to just O(N) regardless of how many metrics we need.
**Action:** Implemented a single `forEach` loop in `renderizarKPIsEquipo` to calculate `totalPending`, `totalApproved`, and `totalQueried` in one pass before computing percentages.
