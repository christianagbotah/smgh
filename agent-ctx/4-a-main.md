---
Task ID: 4-a
Agent: Main
Task: Fix admin orders and users CMS pages — fetch helpers, PageLoadingOverlay, useConfirm, className

Work Log:
- Read worklog.md for project context (MySQL production, Prisma ORM, dark admin theme, shadcn/ui)
- Read both target files and dependencies: fetch-helpers.ts, useConfirm.tsx, PageLoadingOverlay.tsx

### orders/page.tsx fixes:
1. **Imports**: Added `fetchJSON`, `fetchWrite` from `@/lib/fetch-helpers` and `PageLoadingOverlay` from `@/components/admin/PageLoadingOverlay`
2. **fetchOrders**: Replaced raw `fetch()` + manual `res.ok` check + `res.json()` with single `fetchJSON()` call
3. **handleStatusChange**: Replaced raw `fetch()` with `fetchWrite()`, added `savingStatus` state tracking
4. **handleTrackingSave**: Replaced raw `fetch()` with `fetchWrite()`, added `savingTracking` state tracking
5. **handleNotesSave**: Replaced raw `fetch()` with `fetchWrite()`, added `savingNotes` state tracking
6. **PageLoadingOverlay**: Added to JSX with `visible={savingStatus || savingTracking || savingNotes}` and `message="Saving changes..."`
7. **Status tab className**: Replaced `gradient-green text-white` with `bg-white/10 text-white shadow-sm` on the active status tab `<button>`

### users/page.tsx fixes:
1. **Imports**: Added `fetchJSON`, `fetchJSONOrNull`, `fetchWrite` from `@/lib/fetch-helpers`, `useConfirm` from `@/hooks/useConfirm`, `PageLoadingOverlay` from `@/components/admin/PageLoadingOverlay`. Removed `AlertTriangle` from lucide imports.
2. **fetchUsers**: Replaced raw `fetch('/api/users')` with `fetchJSON()`, replaced nested `fetch('/api/auth')` fallback with `fetchJSONOrNull()`
3. **Initial auth check**: Replaced raw `fetch('/api/auth').then(r => r.ok ? r.json() : null)` with `fetchJSONOrNull('/api/auth')`
4. **handleAddUser**: Replaced raw `fetch()` with `fetchWrite()`, used `{ ok, data }` destructuring
5. **handleToggleRole**: Replaced raw `fetch()` + try/catch with `fetchWrite()` + `{ ok, data }` destructuring
6. **handleToggleActive**: Replaced raw `fetch()` + try/catch with `fetchWrite()` + `{ ok, data }` destructuring
7. **handleDelete**: Replaced raw `fetch()` with `fetchWrite()`, added `confirm()` dialog from `useConfirm` hook before deletion
8. **deleteConfirm state removed**: Removed `deleteConfirmId` state variable entirely
9. **Desktop delete UI**: Replaced inline "Delete? Yes/No" confirmation with direct `handleDelete()` call (confirm dialog handles it)
10. **Mobile delete UI**: Same — removed inline confirmation block, button now calls `handleDelete()` directly
11. **PageLoadingOverlay**: Added with `visible={adding}` and `message="Creating user..."`

### Verification:
- Ran `bun run lint` — no errors from modified source files (only pre-existing warnings in other files and generated code)

Stage Summary:
- Both admin pages now use consistent fetch helpers (fetchJSON, fetchWrite, fetchJSONOrNull) instead of raw fetch
- Both pages have PageLoadingOverlay for loading states
- Users page uses useConfirm hook for delete confirmation instead of manual state management
- Status tabs on orders page use consistent bg-white/10 styling instead of gradient-green
- Zero new lint errors introduced
