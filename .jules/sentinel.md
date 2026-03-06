## 2025-03-05 - Fix security function roles configuration
**Learning:** Functions created without a definitive search_path parameter are susceptible to 'Role Mutable Search Path' warnings in PostgreSQL. If the caller alters the search path, they can inadvertently or maliciously invoke functions on unrelated schemas or alter operation outcomes.
**Action:** Recreated `get_my_role` and `get_my_department` functions adding `SET search_path = public` to enforce predictable schema resolution and comply with Supabase's Security linter rules.
