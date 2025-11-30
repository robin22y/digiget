// Supabase Edge Function: Admin Ads Management
// Manages ads (CRUD operations) using service role key (bypasses RLS)
// 
// Usage:
//   GET    /admin-ads - List all ads
//   POST   /admin-ads - Create new ad
//   PATCH  /admin-ads?id=<ad_id> - Update ad
//   DELETE /admin-ads?id=<ad_id> - Delete ad
// 
// Headers: Authorization: Bearer <admin-password-token>
// Body (for POST/PATCH): { type, content, link, image_url, is_active, target_city, target_region, target_shifts }

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

    // GET - List all ads
    if (method === 'GET') {
      const { data: ads, error } = await supabaseAdmin
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ ads, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create new ad
    if (method === 'POST') {
      const body = await req.json()
      const { type, content, link, image_url, is_active, target_city, target_region, target_shifts } = body

      if (!content || !link) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: content, link' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: ad, error } = await supabaseAdmin
        .from('ads')
        .insert([{
          type: type || 'text',
          content,
          link,
          image_url: image_url || null,
          is_active: is_active !== undefined ? is_active : true,
          target_city: target_city || null,
          target_region: target_region || null,
          target_shifts: target_shifts || [],
        }])
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ ad, error: null }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH - Update ad
    if (method === 'PATCH') {
      const adId = url.searchParams.get('id')
      if (!adId) {
        return new Response(
          JSON.stringify({ error: 'Missing ad id parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { data: ad, error } = await supabaseAdmin
        .from('ads')
        .update(body)
        .eq('id', adId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ ad, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete ad
    if (method === 'DELETE') {
      const adId = url.searchParams.get('id')
      if (!adId) {
        return new Response(
          JSON.stringify({ error: 'Missing ad id parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('ads')
        .delete()
        .eq('id', adId)

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

