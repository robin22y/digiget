# Supabase Troubleshooting Guide

## Error: "Invalid API key" (401)

This error means Supabase can't authenticate with the provided API key. Here's how to fix it:

### Step 1: Verify Your API Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xyliesesbxbaslgctvzo
2. Click **Settings** (gear icon) → **API**
3. Under **Project API keys**, find the **anon/public** key
4. Copy the entire key (it should start with `eyJ...` and be very long)

### Step 2: Update Your .env File

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://xyliesesbxbaslgctvzo.supabase.co
VITE_SUPABASE_ANON_KEY=your-complete-anon-key-here
```

**Important:**
- The key must be on ONE line (no line breaks)
- No quotes around the key
- No spaces before or after the `=`

### Step 3: Restart Dev Server

**CRITICAL:** Vite only loads `.env` files when the server starts!

1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again
3. Check the browser console for the "🔍 Supabase Config Check" log

### Step 4: Enable Anonymous Authentication

1. Go to: https://supabase.com/dashboard/project/xyliesesbxbaslgctvzo/auth/providers
2. Scroll down to find **"Anonymous"** provider
3. Click on it
4. Toggle **"Enable Anonymous Sign-ins"** to ON
5. Click **"Save"**

### Step 5: Verify in Console

After restarting, check your browser console. You should see:
```
🔍 Supabase Config Check: {
  hasUrl: true,
  hasAnonKey: true,
  urlPreview: "https://xyliesesbxbaslgctvzo.supabase...",
  keyPreview: "eyJhbGciOiJIUzI1NiIs...",
  keyLength: 200+ (should be around 200-300 characters)
}
```

If `hasAnonKey: false` or `keyLength: 0`, the key isn't being loaded - restart the dev server.

### Common Issues

**Issue:** Key shows as loaded but still getting 401
- **Fix:** Double-check the key matches exactly what's in Supabase dashboard
- **Fix:** Make sure Anonymous auth is enabled

**Issue:** Key not loading (hasAnonKey: false)
- **Fix:** Restart dev server
- **Fix:** Check `.env` file is in project root (same folder as `package.json`)
- **Fix:** Make sure variable names start with `VITE_`

**Issue:** Key is truncated or has line breaks
- **Fix:** The key must be on a single line in `.env`
- **Fix:** No quotes, no spaces around `=`

### Test the Connection

Once everything is set up, you should see in console:
```
✅ Supabase client initialized
Anonymous user signed in: [some-uuid]
```

If you still see errors, the API key in your `.env` doesn't match the one in Supabase dashboard.



