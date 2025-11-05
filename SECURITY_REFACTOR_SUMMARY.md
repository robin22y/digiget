# Security Refactor Summary - Phase 1B

## Overview
Refactored owner PIN unlock system to remove client-side `sessionStorage` usage and replace with secure HttpOnly cookies.

## Changes Made

### 1. New Netlify Functions

#### `netlify/functions/verify-pin.ts`
- **Purpose:** Verify owner PIN and set HttpOnly cookie
- **Method:** POST
- **Body:** `{ shopId: string, pin: string, device: string }`
- **Response:** Sets HttpOnly cookie with 30-minute expiration
- **Security:** Server-side PIN validation, no client exposure

#### `netlify/functions/check-cookie.ts`
- **Purpose:** Check if user has owner access via HttpOnly cookie
- **Method:** GET
- **Query:** `?shopId=xxx`
- **Response:** Returns `{ success: true, hasAccess: true }` if cookie is valid

#### `netlify/functions/clear-cookie.ts`
- **Purpose:** Clear owner access cookie
- **Method:** POST
- **Query:** `?shopId=xxx`
- **Response:** Sets cookie to expire immediately

### 2. New Utility

#### `src/utils/ownerAccess.ts`
- **`hasOwnerAccess(shopId: string): Promise<boolean>`**
  - Checks server-side cookie for owner access
  - Returns `true` if access granted, `false` otherwise
- **`clearOwnerAccess(shopId: string): Promise<void>`**
  - Helper to clear owner access cookie

### 3. Updated Components

#### `src/components/OwnerPinModal.tsx`
- **Removed:** All `sessionStorage.setItem/getItem` calls for owner unlock
- **Added:** Server-side PIN verification via `/.netlify/functions/verify-pin`
- **Changed:** PIN verification now uses HttpOnly cookies instead of sessionStorage
- **Note:** After PIN reset, automatically verifies with server to get cookie

#### `src/hooks/useOwnerPinProtection.tsx`
- **Removed:** All `sessionStorage.getItem` checks
- **Removed:** Session expiration time checks
- **Added:** Server-side cookie check via `hasOwnerAccess()` utility
- **Changed:** `checkUnlockStatus` is now async and checks server-side cookie
- **Changed:** `handleLock` now calls clear-cookie endpoint

#### `src/pages/dashboard/SettingsPage.tsx`
- **Removed:** All `sessionStorage.removeItem/setItem` calls
- **Changed:** `handleLockSettings` now calls clear-cookie endpoint
- **Removed:** Session storage cleanup on mount

#### `src/pages/dashboard/DashboardHome.tsx`
- **Removed:** All `sessionStorage.removeItem` calls when navigating to external pages
- **Note:** Security handled by `useOwnerPinProtection` hook

## Security Improvements

1. **HttpOnly Cookies:** PIN unlock status now stored in HttpOnly cookies (not accessible via JavaScript)
2. **Server-Side Validation:** PIN verification happens server-side, preventing client-side bypass
3. **No XSS Risk:** HttpOnly cookies cannot be accessed by malicious scripts
4. **Automatic Expiration:** Cookies expire after 30 minutes (server-controlled)
5. **Secure Transmission:** Cookies use `Secure` flag (HTTPS only) and `SameSite=Strict`

## Migration Notes

### Before (Client-Side SessionStorage):
```typescript
// ❌ UNSAFE - Client-side storage
sessionStorage.setItem(`owner_unlocked_${shopId}`, 'true');
const unlocked = sessionStorage.getItem(`owner_unlocked_${shopId}`);
```

### After (Server-Side HttpOnly Cookie):
```typescript
// ✅ SAFE - Server-side cookie
const res = await fetch("/.netlify/functions/verify-pin", {
  method: "POST",
  credentials: 'include',
  body: JSON.stringify({ shopId, pin, device })
});
// Cookie set by server automatically

const hasAccess = await hasOwnerAccess(shopId);
```

## Testing Checklist

- [ ] PIN verification works correctly
- [ ] Cookie is set after successful PIN entry
- [ ] Cookie expires after 30 minutes
- [ ] Access check works via `hasOwnerAccess()`
- [ ] Clear cookie works when locking settings
- [ ] No sessionStorage references remain
- [ ] External page navigation still requires PIN re-entry

## Environment Variables Required

Ensure these are set in Netlify:
- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side Supabase access)

## Files Changed

### New Files:
- `netlify/functions/verify-pin.ts`
- `netlify/functions/check-cookie.ts`
- `netlify/functions/clear-cookie.ts`
- `src/utils/ownerAccess.ts`

### Modified Files:
- `src/components/OwnerPinModal.tsx`
- `src/hooks/useOwnerPinProtection.tsx`
- `src/pages/dashboard/SettingsPage.tsx`
- `src/pages/dashboard/DashboardHome.tsx`

### Dependencies:
- `@netlify/functions` (added to package.json)

## Breaking Changes

None - This is a security enhancement that maintains the same user experience.

## Next Steps

1. Deploy to Netlify and test all flows
2. Verify cookies are set correctly in browser DevTools
3. Test cookie expiration (30 minutes)
4. Monitor for any issues with access checks

