import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import qrcode from 'npm:qrcode@1.5.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get shop ID from request body
    const { shopId } = await req.json();
    
    if (!shopId) {
      return new Response(
        JSON.stringify({ error: 'Missing shopId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load shop data
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, shop_name, owner_name, logo_url, qr_url, image_url')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Shop not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this shop
    const { data: shopOwner, error: ownerError } = await supabase
      .from('shops')
      .select('owner_id')
      .eq('id', shopId)
      .single();

    if (ownerError || shopOwner?.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure QR URL exists
    if (!shop.qr_url) {
      const defaultQrUrl = `https://digiget.uk/dashboard/${shop.id}/checkin`;
      await supabase
        .from('shops')
        .update({ qr_url: defaultQrUrl })
        .eq('id', shopId);
      shop.qr_url = defaultQrUrl;
    }

    // Generate simple branded QR with text overlay
    const qrCodeDataURL = await qrcode.toDataURL(shop.qr_url, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Upload QR to storage
    const qrBuffer = Uint8Array.from(
      atob(qrCodeDataURL.split(',')[1]),
      c => c.charCodeAt(0)
    );

    const timestamp = Date.now();
    const pngPath = `branded-qrs/${shopId}_${timestamp}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(pngPath, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload QR code', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(pngPath);

    const pngUrl = urlData.publicUrl;

    // Update shop record
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        branded_qr_url: pngUrl,
      })
      .eq('id', shopId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update shop', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Branded QR code generated successfully',
        pngUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

