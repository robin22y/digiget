# Shop PIN System - Implementation Summary

## Overview

Implemented a "Shop PIN" system where the shop tablet stays logged in with a shared shop PIN, and staff identify themselves per action with their own PIN. This eliminates the confusion of individual logins on shared tablets while keeping personal data private on staff phones.

## Key Concepts

### Shop Tablet = Shared Portal
- **Always unlocked** with shop PIN (e.g., 999999)
- **Any staff** can use it
- **Staff enter their PIN** for each action (clock in, check in customer)
- **System tracks** who did what via their PIN
- **No login/logout** confusion

### Staff Phone = Personal Portal
- **Staff logs in** with their own PIN
- **Sees only their** hours/wages
- **Can check in customers** too (if needed)
- **Can clock in/out** remotely (with GPS)

## Database Changes

### Migration: `supabase/migrations/20250206000002_add_shop_pin.sql`
- Adds `shop_pin` column (VARCHAR(6)) to `shops` table
- Provides default value for existing shops
- Creates index for faster lookups

**To Apply:**
Run the migration in Supabase SQL Editor.

## Components Created

### 1. `src/components/ShopPINEntry.tsx`
- Entry screen for shop PIN
- Validates shop PIN against database
- Stores unlock state in sessionStorage
- Shows helpful message about shop vs personal PIN

### 2. `src/components/ShopClockInOutModal.tsx`
- Modal for clock in/out from shop tablet
- Asks for staff PIN (not shop PIN)
- Handles both clock in and clock out
- Shows success/error messages

### 3. `src/components/ShopCustomerCheckInModal.tsx`
- Modal for checking in customers
- Two-step process:
  1. Enter customer phone number
  2. Enter staff PIN (tracks who checked them in)
- Awards loyalty points if enabled
- Records visit with `staff_id` to track who did it

### 4. `src/pages/ShopPortal.tsx`
- Main shop portal page (shared tablet interface)
- Shows large action buttons:
  - Clock In/Out
  - Check In Customer
- Displays real-time info:
  - Currently working staff
  - Today's customer count
- Lock/unlock functionality
- Session persistence (stays unlocked until locked)

## Routes Added

### New Routes:
- `/shop/:code` - Shop Portal (shared tablet)
- `/staff/:code` - Staff Personal Portal (kept existing, now redirects from `/p/:code`)

### Updated Routes:
- `/p/:code` now redirects to `/staff/:code` (personal portal)

## Settings Page Updates

Added new section in Security tab:

### Shop PIN & Portal Access
- **Shop PIN Configuration:**
  - Display current shop PIN (or set if not configured)
  - Change shop PIN button
  - Helpful description

- **Portal Links:**
  - **Shop Tablet Portal** link (`/shop/:code`)
    - For shared tablet
    - Shows shop PIN when set
    - Copy button
  
  - **Staff Personal Portal** link (`/staff/:code`)
    - For personal phones
    - Copy button

## How It Works

### Tablet Workflow:
1. **Start of day:** Staff opens `/shop/:code` on tablet
2. **Enter shop PIN:** Unlocks tablet (stays unlocked)
3. **Ahmed arrives:** Clicks "Clock In" → Enters his PIN (1234)
4. **Customer comes:** Clicks "Check In Customer" → Enter phone → Enter staff PIN (tracks who did it)
5. **Sarah arrives:** Clicks "Clock In" → Enters her PIN (5678)
6. **No conflicts:** Both can use tablet simultaneously
7. **End of day:** Click "Lock" to secure tablet

### Phone Workflow:
1. **Staff opens:** `/staff/:code` on their phone
2. **Enter their PIN:** Personal login
3. **See only their data:** Hours, wages, clock history
4. **Can clock in/out:** Remotely (with GPS verification)
5. **Can check in customers:** If needed (uses their PIN)

## Benefits

✅ **No login confusion** - Tablet always unlocked, staff identify per action  
✅ **Multiple staff can use tablet** - No conflicts  
✅ **Simpler workflow** - No need to log out to switch users  
✅ **Faster** - No login needed on tablet  
✅ **Personal data stays private** - On their phones  
✅ **System tracks who did what** - Via staff PIN on each action  
✅ **Still secure** - Shop PIN required, staff PIN for actions  

## Database Tables Used

### `customer_visits`
- Uses `staff_id` column to track who checked in each customer
- Updated in `ShopCustomerCheckInModal` to record staff member

### `clock_entries`
- Uses existing tracking (employee_id)
- Updated via `ShopClockInOutModal`

## Security Considerations

- Shop PIN is 6 digits (easy to remember, share with staff)
- Staff PIN is 4 digits (personal, not shared)
- Session stored in sessionStorage (clears on browser close)
- Shop PIN can be changed by owner in Settings
- System tracks all actions with staff ID

## Testing Checklist

### Shop PIN Setup:
- [ ] Owner can set shop PIN in Settings
- [ ] Owner can change shop PIN
- [ ] Default PIN generated for existing shops (999999)

### Shop Portal:
- [ ] Tablet unlocks with shop PIN
- [ ] Portal stays unlocked (sessionStorage)
- [ ] Lock button works
- [ ] Shows currently working staff
- [ ] Shows today's customer count

### Clock In/Out:
- [ ] Staff can clock in with their PIN
- [ ] Staff can clock out with their PIN
- [ ] Shows success message with staff name
- [ ] Updates currently working list

### Customer Check-In:
- [ ] Can enter customer phone
- [ ] Asks for staff PIN before completing
- [ ] Awards loyalty points correctly
- [ ] Records visit with staff_id
- [ ] Shows who checked them in

### Settings:
- [ ] Shop PIN section visible
- [ ] Portal links display correctly
- [ ] Copy buttons work
- [ ] Links use correct format (`/shop/:code` and `/staff/:code`)

## Files Modified

1. ✅ `supabase/migrations/20250206000002_add_shop_pin.sql` - Database schema
2. ✅ `src/components/ShopPINEntry.tsx` - PIN entry screen
3. ✅ `src/components/ShopClockInOutModal.tsx` - Clock in/out modal
4. ✅ `src/components/ShopCustomerCheckInModal.tsx` - Customer check-in modal
5. ✅ `src/pages/ShopPortal.tsx` - Main shop portal page
6. ✅ `src/pages/dashboard/SettingsPage.tsx` - Added shop PIN & portal links
7. ✅ `src/App.tsx` - Added routes

## Next Steps

1. **Run database migration** in Supabase SQL Editor
2. **Test shop PIN setup** in Settings
3. **Test shop portal** on tablet
4. **Test clock in/out** flow
5. **Test customer check-in** flow
6. **Verify staff tracking** in database

## Notes

- Shop PIN is separate from Owner PIN
- Owner PIN = Settings access
- Shop PIN = Tablet access
- Staff PIN = Individual action tracking
- Personal portal (`/staff/:code`) remains unchanged - staff still log in with their PIN for personal data

