# Quick Supabase Setup Verification

## Step 1: Check Console Log

After restarting your dev server, check the browser console. You should see:

```
🔍 Supabase Config Check: {
  hasUrl: true,
  hasAnonKey: true,
  urlPreview: "https://xyliesesbxbaslgctvzo.supabase...",
  keyPreview: "eyJhbGciOiJIUzI1NiIs...",
  keyLength: 200+
}
```

**If `hasAnonKey: false`** → The key isn't loading. Restart dev server.

## Step 2: Get Fresh API Key from Supabase

1. Go to: https://supabase.com/dashboard/project/xyliesesbxbaslgctvzo/settings/api
2. Under **"Project API keys"**, find **"anon public"**
3. Click the **copy icon** to copy the entire key
4. It should start with `eyJ` and be very long (200+ characters)

## Step 3: Update .env File

Open `.env` and make sure it looks exactly like this (replace with your actual key):

```
VITE_SUPABASE_URL=https://xyliesesbxbaslgctvzo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGllc2VzYnhiYXNsZ2N0dnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTE5NDMsImV4cCI6MjA3OTkyNzk0M30.1jUq5rp01Nqvf3eZPK25NseMub4EWJOm3S8yx1-CCDY=
```

**CRITICAL:**
- No quotes around the key
- No spaces around `=`
- Key must be on ONE line (no line breaks)
- Save the file

## Step 4: Enable Anonymous Authentication

1. Go to: https://supabase.com/dashboard/project/xyliesesbxbaslgctvzo/auth/providers
2. Scroll down to find **"Anonymous"**
3. Click on it
4. Toggle **"Enable Anonymous Sign-ins"** to **ON**
5. Click **"Save"**

## Step 5: Restart Dev Server

**MUST DO THIS:** Vite only loads `.env` on startup!

1. Stop dev server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Refresh browser
4. Check console for the config check log

## Step 6: Verify It Works

After restart, you should see in console:
```
✅ Supabase client initialized
Anonymous user signed in: [uuid-here]
```

If you still see "Invalid API key":
- The key in `.env` doesn't match Supabase dashboard
- Copy the key again from Supabase dashboard
- Make sure you're using the **anon public** key (not service_role key)



