# Supabase Migration Guide

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `digiget` (or any name)
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users (e.g., `London` for UK)
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to initialize

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Update Environment Variables

### Local `.env` file:
Add these lines:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Environment Variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
3. Make sure they're set for **Production**, **Preview**, and **Development**

## Step 4: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. **Copy the entire contents of `supabase_schema.sql` file** (or paste the SQL below)
4. Click **"Run"** to execute

**OR** use the SQL file:
- Open `supabase_schema.sql` in your project
- Copy all contents
- Paste into Supabase SQL Editor
- Click **"Run"**

The SQL creates:
- `shift_logs` table with proper indexes and RLS policies
- `ads` table with proper indexes and RLS policies
- All necessary security policies for anonymous and authenticated users
- **Admin policy** that allows authenticated users to read all shift logs (for admin dashboard metrics)

## Step 5: Enable Anonymous Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Scroll down to **"Anonymous"** provider
3. Enable it
4. Click **"Save"**

## Step 6: Update Code to Use Supabase

The code has been updated to use Supabase. You just need to:
1. Update your `.env` file with Supabase credentials
2. Update Vercel environment variables
3. Restart your dev server: `npm run dev`
4. Test locally
5. Deploy to Vercel

## Step 7: Update Components

The following files need to be updated to import from `supabase.js` instead of `firebase.js`:
- `src/main.js`
- `src/App.vue`
- `src/components/AdminDashboard.vue`
- `src/components/AdContainer.vue`
- `src/components/InfoPages.vue`

## Migration Notes

- **Firebase → Supabase**: The API is different but similar
- **Collections → Tables**: Firestore collections become PostgreSQL tables
- **Documents → Rows**: Firestore documents become table rows
- **Security Rules → RLS**: Firestore rules become Row Level Security policies
- **Anonymous Auth**: Works the same way in both

## Benefits of Supabase

✅ Simpler setup
✅ Better real-time features
✅ PostgreSQL (more powerful than Firestore)
✅ Better error messages
✅ No hanging promises
✅ Easier debugging

