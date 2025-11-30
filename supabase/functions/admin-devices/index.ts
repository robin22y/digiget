// Supabase Edge Function: Admin Devices Management
// Manages admin devices (CRUD operations) using service role key (bypasses RLS)
// 
// Usage:
//   GET    /admin-devices - List all admin devices
//   POST   /admin-devices - Register new admin device
//   DELETE /admin-devices?device_id=<device_id> - Delete admin device
// 
// Headers: Authorization: Bearer <admin-password-token>
// Body (for POST): { device_id, device_name, user_agent }

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
    // Verify admin password
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'your-admin-password-here'
    const providedPassword = authHeader.replace('Bearer ', '')
    
    if (providedPassword !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
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

    const url = new URL(req.url)
    const method = req.method

    // GET - List all admin devices
    if (method === 'GET') {
      const { data: devices, error } = await supabaseAdmin
        .from('admin_devices')
        .select('*')
        .order('last_used_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ devices, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Register new admin device
    if (method === 'POST') {
      const body = await req.json()
      const { device_id, device_name, user_agent } = body

      if (!device_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: device_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update last_used_at if device exists, otherwise insert
      const { data: existingDevice } = await supabaseAdmin
        .from('admin_devices')
        .select('*')
        .eq('device_id', device_id)
        .single()

      let result
      if (existingDevice) {
        // Update existing device
        result = await supabaseAdmin
          .from('admin_devices')
          .update({
            device_name: device_name || existingDevice.device_name,
            user_agent: user_agent || existingDevice.user_agent,
            last_used_at: new Date().toISOString(),
          })
          .eq('device_id', device_id)
          .select()
          .single()
      } else {
        // Insert new device
        result = await supabaseAdmin
          .from('admin_devices')
          .insert([{
            device_id,
            device_name: device_name || null,
            user_agent: user_agent || null,
            last_used_at: new Date().toISOString(),
          }])
          .select()
          .single()
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ device: result.data, error: null }),
        { status: existingDevice ? 200 : 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete admin device
    if (method === 'DELETE') {
      const deviceId = url.searchParams.get('device_id')
      if (!deviceId) {
        return new Response(
          JSON.stringify({ error: 'Missing device_id parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('admin_devices')
        .delete()
        .eq('device_id', deviceId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

