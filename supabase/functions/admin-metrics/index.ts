// Supabase Edge Function: Admin Metrics
// Fetches all shift logs for admin dashboard (bypasses RLS using service role key)
// 
// Usage: POST /admin-metrics
// Headers: Authorization: Bearer <admin-password-token>
// 
// Returns: { logs: [...], error: null } or { logs: null, error: "..." }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get admin password from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin password (should match your frontend admin password)
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'Rncdm@2025'
    const providedPassword = authHeader.replace('Bearer ', '')
    
    if (providedPassword !== ADMIN_PASSWORD) {
      console.error('Unauthorized access attempt. Password mismatch.')
      return new Response(
        JSON.stringify({ logs: null, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    // SUPABASE_URL is automatically available in Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
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

    // Fetch all shift logs (bypasses RLS)
    const { data: logs, error } = await supabaseAdmin
      .from('shift_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000) // Adjust limit as needed

    if (error) {
      console.error('Error fetching logs:', error)
      return new Response(
        JSON.stringify({ logs: null, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure logs is always an array (even if empty)
    const logsArray = logs || []
    console.log(`Fetched ${logsArray.length} logs from database`)

    return new Response(
      JSON.stringify({ logs: logsArray, error: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

