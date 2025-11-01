import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Verify super admin or get days from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const daysLeft = body.days || 7;

    // Import Supabase client
    const { createClient } = await import("jsr:@supabase/supabase-js@2");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get shops with trials ending in X days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysLeft);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, shop_name, owner_email, trial_ends_at, subscription_status")
      .eq("subscription_status", "trial")
      .gte("trial_ends_at", `${targetDateStr}T00:00:00`)
      .lt("trial_ends_at", `${targetDateStr}T23:59:59`);

    if (shopsError) {
      throw shopsError;
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];

    for (const shop of shops || []) {
      try {
        if (!shop.trial_ends_at) continue;

        const trialEndDate = new Date(shop.trial_ends_at);
        const formattedDate = trialEndDate.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">⚠️ Your Trial Ends Soon</h1>
            </div>
            <div style="background: #fef3c7; padding: 20px;">
              <p><strong>Hi there,</strong></p>
              <p>Your DigiGet trial for <strong>${shop.shop_name}</strong> ends in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
              <div style="background: white; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Trial End Date:</strong> ${formattedDate}</p>
              </div>
              <p><strong>Continue enjoying DigiGet:</strong></p>
              <ul>
                <li>💰 Basic Plan: <strong>FREE</strong> forever</li>
                <li>🚀 Pro Plan: <strong>£9.99/month</strong></li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://digiget.uk/dashboard" 
                   style="background: #2563EB; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Choose Your Plan →
                </a>
              </div>
            </div>
          </body>
          </html>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DigiGet <onboarding@resend.dev>",
            to: [shop.owner_email],
            subject: `Your DigiGet trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          results.push({ shop: shop.shop_name, success: true });
        } else {
          const error = await res.text();
          results.push({ shop: shop.shop_name, success: false, error });
        }
      } catch (error: any) {
        results.push({ shop: shop.shop_name, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, count: results.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

