# Fix "Email address is invalid" Error on Netlify

## Issue
After deploying to Netlify, you're getting: `Email address "robin@test.com" is invalid`

This happens because Supabase has stricter email validation in production that rejects test domains.

## Solution

### Option 1: Change Supabase Email Validation Settings (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/eukloerbmjedwyploxdd
2. Click **Authentication** in the left sidebar
3. Click **Settings** (or **Configuration**)
4. Scroll down to **Email validation**
5. Change the validation level from **"Strict"** to **"Relaxed"**
   - This allows more email formats including test domains
6. Click **Save**

Now try signing up again with `robin@test.com` - it should work!

### Option 2: Use a Real Email Domain

If you want to keep strict validation:
- Use real email domains like `@gmail.com`, `@outlook.com`, `@yahoo.com`, etc.
- Or use your own domain like `robin@yourdomain.com`

### Option 3: Add Test Domain to Allowed List (If Available)

Some Supabase projects have an "Allowed email domains" setting:
1. Go to **Authentication** → **Settings**
2. Look for **"Allowed email domains"** or **"Email domain whitelist"**
3. Add `test.com` to the list
4. Save

### Option 4: Disable Email Validation Temporarily (For Development)

1. Go to **Authentication** → **Settings**
2. Find **"Email validation"** or **"Email format validation"**
3. Set to **"None"** or **"Disabled"** (if available)
4. Save

⚠️ **Warning:** Only disable validation for development/testing. Re-enable it for production.

## Why This Happens

Supabase validates email addresses to prevent spam and ensure valid signups. The validation is stricter in production environments and may reject:
- Test domains (`@test.com`, `@example.com`)
- Fake domains that don't exist
- Invalid email formats

The validation level can be adjusted in your Supabase project settings.

## Quick Check

After making changes:
1. Wait 1-2 minutes for settings to propagate
2. Try signing up again
3. If it still doesn't work, check the browser console for the exact error message

