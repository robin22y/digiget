# Super Admin Login Troubleshooting

## Default Credentials
- **Email:** `robin@digiget.uk`
- **Password:** `DigiGet2024!`

## Steps to Fix 400 Error

### Step 1: Create the Account
The account may not exist yet. Visit:
```
http://localhost:5174/create-super-admin
```
(or your deployed URL + `/create-super-admin`)

Click "Create Super Admin Account" to create the account.

### Step 2: Check Supabase Settings
If the account exists but login still fails:

1. Go to Supabase Dashboard → Authentication → Settings
2. **Disable Email Confirmation:**
   - Find "Enable email confirmations"
   - Turn it OFF (for testing)
   - OR confirm the email if it's enabled

3. **Check Email Validation:**
   - Set email validation to "Relaxed" or "None"
   - Some email domains may be blocked

### Step 3: Reset Password (if needed)
If the password was changed:

1. Go to Supabase Dashboard → Authentication → Users
2. Find `robin@digiget.uk`
3. Click "Reset Password" or manually update via SQL:

```sql
-- Update password for super admin (run in Supabase SQL Editor)
UPDATE auth.users 
SET encrypted_password = crypt('DigiGet2024!', gen_salt('bf'))
WHERE email = 'robin@digiget.uk';
```

### Step 4: Verify Account Exists
Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'robin@digiget.uk';
```

If no rows return, the account doesn't exist - use Step 1.

### Step 5: Check Console Logs
When logging in, check the browser console (F12) for detailed error messages. The updated code now logs:
- Error message
- Error status
- User metadata
- Super admin detection status

## Common Issues

### Issue: "Invalid login credentials"
- **Solution:** Verify email and password are exactly correct (case-sensitive for email domain)
- Try creating a new account via `/create-super-admin`

### Issue: "Email not confirmed"
- **Solution:** 
  - Disable email confirmation in Supabase Auth settings
  - OR check inbox for confirmation email
  - OR manually confirm via Supabase Dashboard → Users → Confirm email

### Issue: "No shop found"
- **Solution:** This error should not appear for super admin (already fixed). If it does:
  - Check console logs to see why super admin detection failed
  - Verify email ends with `@digiget.uk`
  - Check user_metadata has `role: 'super'` or `is_super_admin: true`

## Manual Account Creation (SQL)
If all else fails, create the account directly via SQL:

```sql
-- This creates the auth user (Supabase will handle password hashing)
-- Note: You'll need to use Supabase Admin API or dashboard to set password
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'robin@digiget.uk',
  crypt('DigiGet2024!', gen_salt('bf')),
  NOW(),
  '{"role": "super", "is_super_admin": true, "owner_name": "Robin", "shop_name": "DigiGet Admin"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  ''
);
```

**However, it's recommended to use the `/create-super-admin` page or Supabase Dashboard instead.**

