import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  latitude: number;
  longitude: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { latitude, longitude }: RequestBody = await req.json();

    // Validate inputs
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Missing latitude or longitude" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
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
      return new Response(
        JSON.stringify({ 
          error: "Geocoding service unavailable",
          fallback: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    // Return the full response from Nominatim
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error: any) {
    console.error("Error in reverse-geocode function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        fallback: "Unable to determine location"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

