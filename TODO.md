# TODO - API Response Caching Implementation

## Task: Add API response caching for frequently accessed, rarely changing data

- [x] 1. Update GET /api/branches - add Next.js cache headers (5 minutes)
- [x] 2. Update GET /api/dentists - add Next.js cache headers (5 minutes)
- [x] 3. Update src/app/providers.tsx - React Query default options with query-specific staleTime:
  - branches query: staleTime 5 minutes (300000 ms)
  - dentists query: staleTime 5 minutes (300000 ms)
  - appointments query: staleTime 30 seconds (30000 ms)
  - patients query: staleTime 1 minute (60000 ms)

## Notes:
- Cache invalidation already implemented in dashboard pages using qc.invalidateQueries()
- No changes needed for branches/[id] and dentists/[id] routes (POST/PUT/DELETE handlers)

