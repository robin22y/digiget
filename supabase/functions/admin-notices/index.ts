// Supabase Edge Function: Admin Notices Management
// Manages notices/announcements (CRUD operations) using service role key (bypasses RLS)
// 
// Usage:
//   GET    /admin-notices - List all notices
//   POST   /admin-notices - Create new notice
//   PATCH  /admin-notices?id=<notice_id> - Update notice
//   DELETE /admin-notices?id=<notice_id> - Delete notice
// 
// Headers: Authorization: Bearer <anon-key>, x-admin-password: <admin-password>
// Body (for POST/PATCH): { title, content, link, link_text, is_active, priority }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Verify admin password from custom header
    const adminPasswordHeader = req.headers.get('x-admin-password')
    if (!adminPasswordHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing admin password header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'Rncdm@2025'
    
    if (adminPasswordHeader !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
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

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // List all notices
      const { data: notices, error } = await supabaseAdmin
        .from('notices')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notices:', error)
        return new Response(
          JSON.stringify({ error: error.message, notices: null }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ notices: notices || [], error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Create new notice
      const body = await req.json()
      const { title, content, link, link_text, is_active = true, priority = 0 } = body

      if (!title || !content) {
        return new Response(
          JSON.stringify({ error: 'Title and content are required', notice: null }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: notice, error } = await supabaseAdmin
        .from('notices')
        .insert({
          title,
          content,
          link: link || null,
          link_text: link_text || null,
          is_active,
          priority: priority || 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notice:', error)
        return new Response(
          JSON.stringify({ error: error.message, notice: null }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ notice, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'PATCH') {
      // Update notice
      const url = new URL(req.url)
      const noticeId = url.searchParams.get('id')
      
      if (!noticeId) {
        return new Response(
          JSON.stringify({ error: 'Notice ID is required', notice: null }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      if (body.title !== undefined) updates.title = body.title
      if (body.content !== undefined) updates.content = body.content
      if (body.link !== undefined) updates.link = body.link || null
      if (body.link_text !== undefined) updates.link_text = body.link_text || null
      if (body.is_active !== undefined) updates.is_active = body.is_active
      if (body.priority !== undefined) updates.priority = body.priority

      const { data: notice, error } = await supabaseAdmin
        .from('notices')
        .update(updates)
        .eq('id', noticeId)
        .select()
        .single()

      if (error) {
        console.error('Error updating notice:', error)
        return new Response(
          JSON.stringify({ error: error.message, notice: null }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ notice, error: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE') {
      // Delete notice
      const url = new URL(req.url)
      const noticeId = url.searchParams.get('id')
      
      if (!noticeId) {
        return new Response(
          JSON.stringify({ error: 'Notice ID is required', success: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (error) {
        console.error('Error deleting notice:', error)
        return new Response(
          JSON.stringify({ error: error.message, success: false }),
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

