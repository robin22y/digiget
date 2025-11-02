import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Max-Age": "3600",
};

interface RequestBody {
  latitude: number;
  longitude: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight - must be first and return 200
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Ensure CORS headers are on all responses
  const createResponse = (body: any, status: number = 200) => {
    return new Response(
      typeof body === 'string' ? body : JSON.stringify(body),
      {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  };

  try {
    // Validate request method
    if (req.method !== "POST") {
      return createResponse({ error: "Method not allowed" }, 405);
    }

    // Parse request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return createResponse({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { latitude, longitude } = requestBody;

    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return createResponse({ error: "Missing or invalid latitude or longitude" }, 400);
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return createResponse({ error: "Invalid coordinates" }, 400);
    }

    // Make request to Nominatim API from server (no CORS issues)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'DigiGet Location Service (https://digiget.uk)', // Required by Nominatim
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return createResponse(
        { 
          error: "Geocoding service unavailable",
          fallback: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        },
        502
      );
    }

    const data = await response.json();

    // Return the full response from Nominatim
    return createResponse(data, 200);

  } catch (error: any) {
    console.error("Error in reverse-geocode function:", error);
    return createResponse(
      { 
        error: error.message || "Internal server error",
        fallback: "Unable to determine location"
      },
      500
    );
  }
});

