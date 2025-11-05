/**
 * Netlify Function to check owner access cookie
 * GET /.netlify/functions/check-cookie?shopId=xxx
 */

import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const handler: Handler = async (event) => {
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
    const shopId = event.queryStringParameters?.shopId;

    if (!shopId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing shopId' }),
      };
    }

    // Extract cookie from headers
    const cookies = event.headers.cookie || '';
    const cookieName = `owner_access_${shopId.replace(/-/g, '')}`;
    const cookieMatch = cookies.match(new RegExp(`${cookieName}=([^;]+)`));

    if (!cookieMatch) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'No access cookie found' }),
      };
    }

    const token = cookieMatch[1];

      try {
        // Decode token (simple base64)
        // Note: In Node.js environment, Buffer is global
        const decoded = (typeof Buffer !== 'undefined'
          ? Buffer.from(token, 'base64').toString('utf-8')
          : atob(token));
      const [tokenShopId] = decoded.split(':');

      // Verify shopId matches
      if (tokenShopId !== shopId) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Invalid token' }),
        };
      }

      // Verify shop exists
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .single();

      if (shopError || !shop) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Shop not found' }),
        };
      }

      // Access granted
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: true,
          hasAccess: true,
        }),
      };
    } catch (decodeError) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token format' }),
      };
    }
  } catch (error: any) {
    console.error('Check cookie error:', error);
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

