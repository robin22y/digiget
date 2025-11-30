// Supabase Edge Function: Check Admin Device
// Checks if a device_id is registered as an admin device
// 
// Usage: POST /check-admin-device
// Body: { device_id: "..." }
// 
// Returns: { isAdmin: boolean, error: null } or { isAdmin: false, error: "..." }

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
    // Get device_id from request body
    const { device_id } = await req.json()
    
    if (!device_id) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Missing device_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    // SUPABASE_URL is automatically available in Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Server configuration error' }),
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

    // Check if device exists and update last_used_at
    const { data, error } = await supabaseAdmin
      .from('admin_devices')
      .select('id, last_used_at')
      .eq('device_id', device_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking admin device:', error)
      return new Response(
        JSON.stringify({ isAdmin: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (data) {
      // Update last_used_at
      await supabaseAdmin
        .from('admin_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('device_id', device_id)
      
      return new Response(
        JSON.stringify({ isAdmin: true, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ isAdmin: false, error: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ isAdmin: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

