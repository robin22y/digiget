// Supabase Edge Function: Purge Test Data
// Deletes all shift logs where is_test = true (bypasses RLS using service role key)
// 
// Usage: POST /admin-purge-test-data
// Headers: Authorization: Bearer <admin-password-token>
// 
// Returns: { deleted_count: number, error: null } or { deleted_count: 0, error: "..." }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin password from custom header
    const adminPasswordHeader = req.headers.get('x-admin-password')
    if (!adminPasswordHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing admin password header', deleted_count: 0 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'Rncdm@2025'
    
    if (adminPasswordHeader !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', deleted_count: 0 }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    // SUPABASE_URL is automatically available in Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error', deleted_count: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete all test logs and return the deleted rows using .select()
    // This allows us to count how many were actually deleted
    const { data, error } = await supabaseAdmin
      .from('shift_logs')
      .delete()
      .eq('is_test', true)
      .select('id') // Select only id to minimize data transfer, but get all deleted rows

    if (error) {
      console.error('Error purging test data:', error)
      return new Response(
        JSON.stringify({ error: error.message, deleted_count: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // data will be an array of deleted rows, so its length is the count
    const deletedCount = data ? data.length : 0

    return new Response(
      JSON.stringify({ deleted_count: deletedCount, error: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message, deleted_count: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

