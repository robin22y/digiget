# Supabase Edge Functions Setup Guide

This guide explains how to set up and deploy the secure Edge Functions for admin operations.

## Overview

The Edge Functions provide secure admin operations that bypass RLS (Row Level Security) using the Supabase service role key. This ensures only authorized admins can perform sensitive operations.

## Edge Functions Created

1. **admin-metrics** - Fetches all shift logs for metrics calculation
2. **admin-ads** - Manages ads (CRUD operations)
3. **admin-devices** - Manages admin devices (CRUD operations)
4. **admin-purge-test-data** - Deletes all test data from shift_logs

## Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Supabase project** with service role key
   - Get your service role key from: Supabase Dashboard → Settings → API → service_role key

3. **Admin password** configured
   - The Edge Functions use an admin password for authentication
   - Default: `Rncdm@2025` (matches App.vue)
   - Should be set as environment variable in production

## Setup Steps

### 1. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

To find your project ref:
- Go to Supabase Dashboard
- Project Settings → General
- Copy the "Reference ID"

### 4. Set Environment Variables

Create a `.env` file in the `supabase/functions` directory (or set in Supabase Dashboard):

```env
ADMIN_PASSWORD=Rncdm@2025
SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note**: `SUPABASE_URL` is automatically available in Edge Functions, no need to set it.

**Important**: Never commit the service role key to version control!

### 5. Deploy Edge Functions

Deploy all functions at once:

```bash
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy admin-metrics
supabase functions deploy admin-ads
supabase functions deploy admin-devices
supabase functions deploy admin-purge-test-data
```

### 6. Set Secrets (Alternative to .env)

You can also set secrets directly in Supabase:

```bash
supabase secrets set ADMIN_PASSWORD=Rncdm@2025
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note**: `SUPABASE_URL` is automatically available in Edge Functions runtime, no need to set it as a secret.

Or set them in Supabase Dashboard:
- Go to Project Settings → Edge Functions → Secrets

## Testing Edge Functions

### Test admin-metrics

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/admin-metrics \
  -H "Authorization: Bearer Rncdm@2025" \
  -H "Content-Type: application/json"
```

### Test admin-ads (GET)

```bash
curl https://your-project-ref.supabase.co/functions/v1/admin-ads \
  -H "Authorization: Bearer Rncdm@2025"
```

### Test admin-devices (GET)

```bash
curl https://your-project-ref.supabase.co/functions/v1/admin-devices \
  -H "Authorization: Bearer Rncdm@2025"
```

## Security Notes

### ✅ Security Improvements

1. **RLS Bypass**: Edge Functions use service role key, bypassing RLS
2. **Password Protection**: All functions require admin password in Authorization header
3. **No Direct Access**: Users can no longer directly query admin tables
4. **Audit Trail**: All admin operations go through Edge Functions

### ⚠️ Important Security Considerations

1. **Service Role Key**: 
   - Never expose in frontend code
   - Only used in Edge Functions (server-side)
   - Has full database access

2. **Admin Password**:
   - Should be strong and unique
   - Consider using environment variables
   - Change regularly in production

3. **CORS**: 
   - Edge Functions allow CORS from any origin
   - Consider restricting in production if needed

## Updating RLS Policies

After deploying Edge Functions, update your RLS policies in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the updated `supabase_schema.sql`
3. This removes overly permissive policies

The updated schema:
- ✅ Removes "read all logs" policy
- ✅ Removes "manage ads" policies
- ✅ Removes "manage admin devices" policies
- ✅ Keeps user data protection (users can only access their own logs)

## Troubleshooting

### Function Not Found (404)

- Check function name matches exactly
- Verify deployment was successful
- Check function URL format

### Unauthorized (403)

- Verify admin password matches
- Check Authorization header format: `Bearer <password>`
- Ensure password is set in environment/secrets

### Database Errors

- Verify service role key is correct
- Check RLS policies are updated
- Ensure tables exist and have correct structure

### CORS Errors

- Edge Functions include CORS headers
- Check browser console for specific error
- Verify function URL is correct

## Production Checklist

- [ ] Deploy all Edge Functions
- [ ] Set strong admin password
- [ ] Store secrets securely (not in code)
- [ ] Update RLS policies in database
- [ ] Test all admin operations
- [ ] Monitor Edge Function logs
- [ ] Set up error alerting
- [ ] Document admin password securely
- [ ] Consider rate limiting
- [ ] Review CORS settings

## Monitoring

View Edge Function logs:

```bash
supabase functions logs admin-metrics
supabase functions logs admin-ads
supabase functions logs admin-devices
supabase functions logs admin-purge-test-data
```

Or in Supabase Dashboard:
- Go to Edge Functions → Logs

## Rollback

If you need to rollback to direct queries:

1. Re-enable RLS policies in `supabase_schema.sql`
2. Update `AdminDashboard.vue` to use direct queries
3. Remove Edge Function calls from `src/supabase.js`

## Support

For issues:
1. Check Edge Function logs
2. Verify environment variables
3. Test with curl commands
4. Review Supabase documentation: https://supabase.com/docs/guides/functions

