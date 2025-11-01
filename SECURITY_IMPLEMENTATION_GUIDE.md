# Security Implementation Guide

This guide walks you through implementing comprehensive security fixes for DigiGet.

## ✅ STEP 1: RUN THE SQL MIGRATION

**CRITICAL - Run this first:**

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste the entire contents of:
   ```
   supabase/migrations/20250203000001_security_audit_rls_and_indexes.sql
   ```
3. Click **Run**
4. Verify success - check for any errors

This migration:
- ✅ Enables RLS on all critical tables
- ✅ Creates `user_shop_access` table for multi-user shop access
- ✅ Creates helper function `is_super_admin()`
- ✅ Sets up RLS policies for shops, customers, employees, clock entries
- ✅ Creates all necessary database indexes
- ✅ Creates atomic functions for customer check-ins and points

## ✅ STEP 2: TEST RLS POLICIES

After running the migration, test that RLS works:

```sql
-- As a regular user, try to access another shop's data
-- This should return EMPTY (no rows)
SELECT * FROM customers WHERE shop_id = 'SOME_OTHER_SHOP_ID';

-- Your shop's data should be visible
SELECT * FROM customers WHERE shop_id = (SELECT id FROM shops WHERE user_id = auth.uid() LIMIT 1);
```

## ✅ STEP 3: USE NEW UTILITY FUNCTIONS

The following utility files have been created:

### `src/lib/validation.ts`
Use for all form inputs:
```typescript
import { validatePhoneNumber, sanitizeInput, validateEmail } from '@/lib/validation';

// In your forms:
if (!validatePhoneNumber(phoneNumber)) {
  setError('Invalid UK phone number');
  return;
}

const safeName = sanitizeInput(userInput);
```

### `src/lib/geolocation.ts`
Use for GPS verification:
```typescript
import { getCurrentPosition, isWithinRadius } from '@/lib/geolocation';

const location = await getCurrentPosition({ timeout: 10000 });
if (!location) {
  throw new Error('Could not get location');
}

const check = isWithinRadius(location, shopLocation, 100); // 100m radius
if (!check.within) {
  throw new Error(check.message);
}
```

### `src/lib/logger.ts`
Use for error logging:
```typescript
import { logger, getUserFriendlyError } from '@/lib/logger';

try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', error, { userId, shopId });
  setError(getUserFriendlyError(error));
}
```

### `src/lib/rateLimit.ts`
Use to prevent abuse:
```typescript
import { checkRateLimit } from '@/lib/rateLimit';

if (!checkRateLimit(`check-in:${userId}`, 100, 60000)) {
  throw new Error('Too many check-ins. Please slow down.');
}
```

## ⚠️ STEP 4: UPDATE COMPONENTS TO USE NEW UTILITIES

### Example: Update Clock-In Function

**Find:** All clock-in functions in:
- `src/pages/staff/StaffPortal.tsx`
- `src/components/StaffLocationCheckins.tsx`

**Replace with:**

```typescript
import { getCurrentPosition, isWithinRadius } from '@/lib/geolocation';
import { logger, getUserFriendlyError } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';

async function handleClockIn() {
  if (isLoading) return; // Prevent double-click
  
  setIsLoading(true);
  
  try {
    // Rate limiting
    if (!checkRateLimit(`clock-in:${employeeId}`, 10, 60000)) {
      setError('Too many attempts. Please wait a minute.');
      return;
    }

    // Get location
    const location = await getCurrentPosition({ timeout: 10000 });
    if (!location) {
      setError('Could not get your location. Please enable GPS and try again.');
      return;
    }

    // Verify within radius
    const { currentShop } = useShop();
    if (!currentShop.latitude || !currentShop.longitude) {
      setError('Shop location not configured.');
      return;
    }

    const radiusCheck = isWithinRadius(
      location,
      { latitude: currentShop.latitude, longitude: currentShop.longitude },
      currentShop.location_radius || 100
    );

    if (!radiusCheck.within) {
      setError(radiusCheck.message || 'You are too far from the shop.');
      return;
    }

    // Clock in
    const { data, error } = await supabase
      .from('clock_entries')
      .insert({
        employee_id: employeeId,
        shop_id: currentShop.id,
        clock_in_time: new Date().toISOString(),
        clock_in_latitude: location.latitude,
        clock_in_longitude: location.longitude,
      })
      .select()
      .single();

    if (error) {
      logger.error('Clock-in database error', error, { employeeId, shopId: currentShop.id });
      setError(getUserFriendlyError(error));
      return;
    }

    setMessage('Clocked in successfully!');
  } catch (error: any) {
    logger.error('Clock-in failed', error, { employeeId });
    setError(getUserFriendlyError(error));
  } finally {
    setIsLoading(false);
  }
}
```

### Example: Update Customer Check-In

**Use atomic database function instead of manual update:**

```typescript
// OLD (vulnerable to race conditions):
const customer = await getCustomer(customerId);
await updateCustomer(customerId, { points: customer.points + 1 });

// NEW (atomic):
const { data, error } = await supabase.rpc('check_in_customer', {
  p_customer_id: customerId,
  p_shop_id: currentShop.id,
  p_points_to_add: 1,
});

if (error) {
  logger.error('Customer check-in failed', error);
  setError(getUserFriendlyError(error));
  return;
}

if (!data || !data[0]?.success) {
  setError(data?.[0]?.message || 'Check-in failed');
  return;
}

// Success - data[0].customer_data contains updated customer
```

### Example: Fix Memory Leaks

**Find all `useEffect` hooks and ensure cleanup:**

```typescript
// BAD:
useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('INSERT', handleNotification)
    .subscribe();
}, []);

// GOOD:
useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('INSERT', handleNotification)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## ⚠️ STEP 5: ADD LOADING STATES TO ALL BUTTONS

Find all action buttons and add:

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleAction() {
  if (isLoading) return; // Prevent double-click
  
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
}

// In JSX:
<button 
  onClick={handleAction}
  disabled={isLoading || !canPerformAction}
  className="btn btn-primary"
>
  {isLoading ? 'Processing...' : 'Action'}
</button>
```

## ⚠️ STEP 6: ADD INPUT VALIDATION TO ALL FORMS

**Customer Check-In Form:**
```typescript
import { validatePhoneNumber, sanitizeName } from '@/lib/validation';

function handlePhoneSubmit(phone: string) {
  if (!validatePhoneNumber(phone)) {
    setError('Invalid UK phone number format');
    return;
  }
  
  const formatted = formatPhoneNumber(phone);
  // Continue with check-in...
}
```

**Staff PIN Form:**
```typescript
import { validatePIN } from '@/lib/validation';

if (!validatePIN(pin)) {
  setError('PIN must be exactly 4 digits');
  return;
}
```

## 📋 TESTING CHECKLIST

After implementing all fixes, test:

### Security Tests
- [ ] Try to access another shop's data via API - should fail
- [ ] Try to check in customer for different shop - should fail  
- [ ] Try to clock in from far away - should fail
- [ ] Try to bypass GPS check - should fail
- [ ] Test with invalid shop_id in API calls - should fail

### Functionality Tests
- [ ] Clock in works when within radius
- [ ] Clock in fails when outside radius
- [ ] Customer check-in adds points atomically
- [ ] Points redeem correctly
- [ ] Payroll calculates correctly
- [ ] CSV exports work

### Edge Case Tests
- [ ] GPS timeout shows friendly error
- [ ] Network failure shows error message
- [ ] Double-click doesn't create duplicates
- [ ] Long shop names don't break UI
- [ ] Special characters in names handled
- [ ] Invalid phone numbers rejected

### Performance Tests
- [ ] 1000 customers load quickly
- [ ] Payroll with 50 staff loads quickly
- [ ] Search is instant
- [ ] No console errors

## 🔍 FINDING VULNERABILITIES

Search codebase for these patterns and fix:

```bash
# Find all places using shop_id from params
grep -r "params.shopId\|query.shopId\|req.body.shopId" src/

# Find all missing error handling
grep -r "await.*supabase" src/ | grep -v "try\|catch"

# Find all missing cleanup
grep -r "useEffect" src/ | grep -v "return\|cleanup"
```

## 📝 NEXT STEPS

1. ✅ Run SQL migration (Step 1)
2. ⚠️ Test RLS policies (Step 2)
3. ⚠️ Update components one by one to use new utilities
4. ⚠️ Add loading states and validation
5. ⚠️ Fix memory leaks
6. ⚠️ Run testing checklist

**Priority Order:**
1. SQL migration (CRITICAL - do this first)
2. Clock-in functions (high risk)
3. Customer check-in (high risk)
4. Forms validation
5. Error handling
6. Memory leaks
7. Rate limiting

