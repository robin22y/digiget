/**
 * Netlify Function to serve shop-specific PWA manifest
 * GET /api/shop/:code/manifest.json
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract shop code from path
    // Path format: /api/shop/:code/manifest.json
    const pathMatch = event.path.match(/\/api\/shop\/([^\/]+)\/manifest\.json/);
    if (!pathMatch || !pathMatch[1]) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Shop code missing' }),
      };
    }

    const shopCode = pathMatch[1];

    // Initialize Supabase
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shop data
    const { data: shop, error } = await supabase
      .from('shops')
      .select('id, shop_name, short_code')
      .eq('short_code', shopCode)
      .maybeSingle();

    if (error || !shop) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Shop not found' }),
      };
    }

    // Generate shop initials
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .filter(char => char && /[A-Za-z]/.test(char))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'DG';
    };

    const initials = getInitials(shop.shop_name);
    const baseUrl = event.headers.host ? `https://${event.headers.host}` : 'https://digiget.uk';

    // Build manifest
    const manifest = {
      name: `${shop.shop_name} - DigiGet`,
      short_name: shop.shop_name.length > 20 
        ? shop.shop_name.substring(0, 20) 
        : shop.shop_name,
      description: `Staff clock in and customer check-in for ${shop.shop_name}`,
      start_url: `/shop/${shop.short_code}`,
      scope: `/shop/${shop.short_code}/`,
      display: 'standalone',
      background_color: '#f5f5f7',
      theme_color: '#2563EB',
      orientation: 'portrait-primary',
      icons: [
        {
          src: `${baseUrl}/api/shop/${shop.short_code}/icon?size=192`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: `${baseUrl}/api/shop/${shop.short_code}/icon?size=512`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Clock In/Out',
          short_name: 'Clock',
          description: 'Staff clock in or out',
          url: `/shop/${shop.short_code}?action=clock`,
          icons: [{ 
            src: `${baseUrl}/api/shop/${shop.short_code}/icon?size=96`, 
            sizes: '96x96' 
          }]
        },
        {
          name: 'Check In Customer',
          short_name: 'Customer',
          description: 'Check in customer and award points',
          url: `/shop/${shop.short_code}?action=customer`,
          icons: [{ 
            src: `${baseUrl}/api/shop/${shop.short_code}/icon?size=96`, 
            sizes: '96x96' 
          }]
        }
      ],
      categories: ['business', 'productivity']
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify(manifest, null, 2),
    };
  } catch (error) {
    console.error('Error generating manifest:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

