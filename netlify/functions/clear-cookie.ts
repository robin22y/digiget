/**
 * Netlify Function to clear owner access cookie
 * POST /.netlify/functions/clear-cookie?shopId=xxx
 */

import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
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

    // Clear cookie by setting it to expire immediately
    const cookieName = `owner_access_${shopId.replace(/-/g, '')}`;
    const cookie = `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Clear cookie error:', error);
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

