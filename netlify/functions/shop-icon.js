/**
 * Netlify Function to generate shop-specific PWA icon
 * GET /api/shop/:code/icon?size=192
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
      },
      body: 'Method not allowed',
    };
  }

  try {
    // Extract shop code and size from path/query
    // Path format: /api/shop/:code/icon
    const pathMatch = event.path.match(/\/api\/shop\/([^\/]+)\/icon/);
    if (!pathMatch || !pathMatch[1]) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
        body: 'Shop code missing',
      };
    }

    const shopCode = pathMatch[1];
    const size = parseInt(event.queryStringParameters?.size || '192', 10);

    // Initialize Supabase
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
        body: 'Server configuration error',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shop data
    const { data: shop, error } = await supabase
      .from('shops')
      .select('shop_name')
      .eq('short_code', shopCode)
      .maybeSingle();

    if (error || !shop) {
      // Return default icon
      return generateDefaultIcon(size);
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
    
    // Generate SVG icon (easier than PNG in serverless)
    const svg = generateSVGIcon(initials, size);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
      body: svg,
    };
  } catch (error) {
    console.error('Error generating icon:', error);
    return generateDefaultIcon(192);
  }
};

function generateSVGIcon(initials, size) {
  const fontSize = Math.floor(size * 0.45);
  const radius = Math.floor(size * 0.2);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`;
}

function generateDefaultIcon(size) {
  const svg = generateSVGIcon('DG', size);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
    body: svg,
  };
}

