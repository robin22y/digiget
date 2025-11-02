# Deploy Reverse Geocode Function - Fix CORS Error

## Problem
The `reverse-geocode` Edge Function is returning CORS errors because the updated code with proper CORS headers hasn't been deployed yet.

## Solution
Deploy the updated function to Supabase. Here are three methods:

---

## Method 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/eukloerbmjedwyploxdd
   - Navigate to **Edge Functions** in the left sidebar

2. **Find the `reverse-geocode` function**
   - If it exists, click on it
   - Click **Edit** or **Update**

3. **Copy the code**
   - Open `supabase/functions/reverse-geocode/index.ts` in your editor
   - Copy ALL the code

4. **Paste and Deploy**
   - Paste the code into the Supabase dashboard editor
   - Click **Deploy** or **Save**

---

## Method 2: Deploy via Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref eukloerbmjedwyploxdd

# Deploy the function
supabase functions deploy reverse-geocode
```

---

## Method 3: Deploy via Supabase Management API

You can also deploy programmatically, but the CLI or Dashboard methods are easier.

---

## Verify Deployment

After deploying, test the function:

1. **Check function logs in Supabase Dashboard**
   - Go to Edge Functions → `reverse-geocode` → Logs
   - Make sure there are no errors

2. **Test from your app**
   - Try the feature that uses reverse geocoding
   - The CORS error should be gone
   - Check browser console for any remaining errors

---

## What Was Fixed

The updated function now:
- ✅ Properly handles OPTIONS preflight requests (returns 200 with CORS headers)
- ✅ Includes `Access-Control-Allow-Origin: *` on all responses
- ✅ Adds `Access-Control-Max-Age` header for better performance
- ✅ Ensures all error responses include CORS headers
- ✅ Has better error handling for invalid requests

---

## If You Still Get CORS Errors

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Wait 1-2 minutes** - Supabase CDN may need to update
3. **Check function logs** - Look for any errors in the Supabase dashboard
4. **Verify deployment** - Make sure the function shows as "Active" in the dashboard

---

## Quick Test Command

You can test the function directly using curl:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS \
  https://eukloerbmjedwyploxdd.supabase.co/functions/v1/reverse-geocode \
  -H "Origin: https://digiget.uk" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return 200 with CORS headers

# Test POST (actual request)
curl -X POST \
  https://eukloerbmjedwyploxdd.supabase.co/functions/v1/reverse-geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"latitude": 51.5074, "longitude": -0.1278}' \
  -v
```

---

## Need Help?

If deployment fails or you still see CORS errors:
1. Check Supabase Edge Functions documentation
2. Verify your project ID is correct: `eukloerbmjedwyploxdd`
3. Make sure you have the correct permissions to deploy functions
4. Check the function logs in Supabase dashboard for detailed error messages

