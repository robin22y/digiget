# Quick Fix for 400 Error on Signup

## Issue
Getting `400 Bad Request` when trying to sign up

## Solution

### Option 1: Disable Email Confirmation (Recommended for Testing)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/eukloerbmjedwyploxdd
2. Click **Authentication** in the left sidebar
3. Click **Settings**
4. Find **"Enable email confirmations"**
5. **Turn it OFF**
6. Click **Save**

Now try signing up again - it should work!

### Option 2: Use a Real Email

If you want to keep email confirmation ON:
1. Use a real email address (gmail, etc.)
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. Then try logging in

## Why This Happens

Supabase by default requires email confirmation. When enabled, users must click a link in their email before they can log in. For development/testing, it's easier to disable this feature.

