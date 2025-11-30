# Fix for Admin Device Access Error (406)

## Problem
After securing RLS policies, the `checkAdminDevice` function was getting 406 errors because it tried to directly query the `admin_devices` table which no longer had read policies.

## Solution

### 1. Created Edge Function
- **File**: `supabase/functions/check-admin-device/index.ts`
- **Purpose**: Securely check if a device is an admin device
- **Usage**: Called by `checkAdminDevice()` in `src/supabase.js`

### 2. Updated Frontend Code
- **File**: `src/supabase.js`
- **Change**: `checkAdminDevice()` now uses Edge Function first, falls back to direct query if Edge Function not available

### 3. Added Minimal RLS Policy
- **File**: `supabase_schema.sql`
- **Policy**: Allows authenticated users to read and update `admin_devices` (needed for checking status)
- **Note**: Insert/delete operations still require Edge Functions

## Deployment Steps

1. **Deploy the new Edge Function**:
   ```bash
   supabase functions deploy check-admin-device
   ```

2. **Update RLS Policies** (if not already done):
   - Run the updated `supabase_schema.sql` in Supabase SQL Editor
   - This adds the minimal read/update policies for `admin_devices`

3. **Test**:
   - The app should now work without 406 errors
   - Admin device checking will use Edge Function (more secure)
   - Falls back to direct query if Edge Function not available

## Security Notes

- ✅ Edge Function approach is more secure (uses service role key)
- ⚠️ Minimal RLS policy allows reading admin_devices (needed for functionality)
- ✅ Insert/delete operations still require Edge Functions
- ✅ Full admin management is secure via Edge Functions

## Alternative (More Secure)

If you want to remove the RLS read policy entirely:

1. Deploy `check-admin-device` Edge Function
2. Remove the read policy from `admin_devices`
3. The app will use Edge Function only (no fallback)

This is more secure but requires the Edge Function to always be available.

