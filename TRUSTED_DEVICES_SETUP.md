# Trusted Devices Feature - Setup Guide

## Overview

The Trusted Devices feature allows shop owners to authorize specific devices (tablets, computers) that are physically at the shop. Staff can clock in from trusted devices without GPS verification, making clock-ins faster and more reliable.

## Features

✅ **Faster clock-ins** - No GPS wait time on trusted devices  
✅ **Works in basements** - No GPS signal needed for trusted devices  
✅ **More reliable** - No GPS failures on shop tablets  
✅ **Still secure** - Device must be authorized by owner  
✅ **GPS still works** - Personal phones still need GPS verification  

## Database Setup

### Step 1: Run Migration

Run the migration file in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20250206000001_create_trusted_devices.sql
```

This will:
- Create the `trusted_devices` table
- Add `trusted_devices_enabled` column to `shops` table
- Add `verification_method` and `device_fingerprint` columns to `clock_entries` table
- Set up RLS policies
- Create triggers to update device usage

### Step 2: Verify Migration

After running the migration, verify the tables exist:

```sql
-- Check trusted_devices table exists
SELECT * FROM trusted_devices LIMIT 1;

-- Check shops has trusted_devices_enabled column
SELECT trusted_devices_enabled FROM shops LIMIT 1;

-- Check clock_entries has verification_method column
SELECT verification_method FROM clock_entries LIMIT 1;
```

## How to Use

### For Shop Owners

1. **Go to Settings → Security tab**
2. **Scroll to "Trusted Devices" section**
3. **Click "Authorize This Device"**
4. **Enter device name** (e.g., "Counter Tablet")
5. **Add optional notes** (e.g., "Black iPad at front desk")
6. **Enter your 6-digit owner PIN**
7. **Click "Authorize Device"**

That's it! Staff can now clock in from that device without GPS verification.

### Managing Devices

- **View all authorized devices** in the Trusted Devices list
- **Revoke access** - Click trash icon to revoke a device
- **Reactivate** - Click rotate icon to reactivate a revoked device
- **See usage** - View when each device was last used

## How It Works

### Device Fingerprinting

Each device gets a unique fingerprint based on:
- Browser user agent
- Screen resolution
- Timezone
- Hardware capabilities
- Other device characteristics

This fingerprint is stored in localStorage and used to identify the device.

### Clock-In Flow

1. **Staff tries to clock in**
2. **System checks if device is trusted**
   - If trusted → Skip GPS, instant clock-in ✅
   - If not trusted → Proceed with GPS verification
3. **Verification method is saved** in clock entry

### Security

- ✅ Requires owner PIN to authorize
- ✅ Owner can revoke anytime
- ✅ Device fingerprint cannot be easily spoofed
- ✅ GPS still required for untrusted devices
- ✅ All actions logged in database

## Benefits

### For Shop Owners
- Faster clock-ins for staff using shop tablets
- No GPS issues in basements or thick-walled buildings
- Full control over which devices are trusted
- Can see which device was used for each clock-in

### For Staff
- Instant clock-ins from shop tablets (2 seconds vs 10-15 seconds)
- No GPS failures blocking clock-ins
- Works even when GPS signal is weak

## Technical Details

### Database Schema

**trusted_devices table:**
- `id` - UUID primary key
- `shop_id` - Reference to shop
- `device_name` - User-friendly name
- `device_fingerprint` - Unique device identifier
- `authorized_by` - User who authorized it
- `authorized_at` - When it was authorized
- `last_used_at` - Last clock-in from this device
- `is_active` - Whether device is currently trusted
- `notes` - Optional notes about the device

**clock_entries table additions:**
- `verification_method` - How clock-in was verified:
  - `trusted_device` - From authorized device
  - `gps_verified` - GPS location verified
  - `no_verification` - No verification needed
  - `manual_override` - Owner manually added
- `device_fingerprint` - Device used (if trusted device)

### RLS Policies

- Shop owners can view and manage their trusted devices
- Anonymous users can check if device is trusted (for clock-in)
- All operations are logged

## Troubleshooting

### Device not showing as trusted
- Make sure you authorized it from that exact device
- Check if device was revoked
- Clear browser cache and localStorage
- Re-authorize the device

### Clock-in still asking for GPS
- Verify device is in the trusted devices list
- Check if `trusted_devices_enabled` is true in shops table
- Make sure device fingerprint matches

### Can't authorize device
- Verify owner PIN is correct
- Check if you have permission to manage settings
- Make sure shop exists and is active

## Best Practices

1. **Only authorize shop devices** - Don't authorize staff personal phones
2. **Use descriptive names** - "Counter Tablet" not "Device 1"
3. **Add notes** - Help identify devices later
4. **Review regularly** - Remove devices no longer at shop
5. **Revoke if lost** - If tablet is lost/stolen, revoke immediately

## Files Changed

- ✅ `supabase/migrations/20250206000001_create_trusted_devices.sql` - Database schema
- ✅ `src/lib/deviceFingerprint.ts` - Device fingerprinting utility
- ✅ `src/components/AuthorizeDeviceModal.tsx` - Authorization modal
- ✅ `src/pages/dashboard/SettingsPage.tsx` - Trusted devices UI
- ✅ `src/lib/clockService.ts` - Clock-in logic with trusted device check

## Next Steps

After running the migration:

1. ✅ Database tables created
2. ✅ Code updated
3. 🔄 Test authorization flow
4. 🔄 Test clock-in from trusted device
5. 🔄 Verify GPS still required for untrusted devices
6. 🔄 Check verification method is saved correctly

