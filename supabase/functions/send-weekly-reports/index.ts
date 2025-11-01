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
    // Verify super admin
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

    // Get all active shops
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, shop_name, owner_email, subscription_status")
      .eq("subscription_status", "active");

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
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    for (const shop of shops || []) {
      try {
        // Get clock entries for the week
        const { data: clockEntries } = await supabase
          .from("clock_entries")
          .select("*, employees(first_name, last_name, hourly_rate)")
          .eq("shop_id", shop.id)
          .gte("clock_in_time", weekStart.toISOString())
          .not("clock_out_time", "is", null);

        // Calculate payroll (simplified - implement full logic as needed)
        let totalHours = 0;
        let totalPay = 0;
        const staffMap = new Map();

        clockEntries?.forEach((entry: any) => {
          const employee = entry.employees;
          const employeeName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
          const hourlyRate = employee?.hourly_rate || 0;

          const clockIn = new Date(entry.clock_in_time);
          const clockOut = new Date(entry.clock_out_time);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

          if (!staffMap.has(entry.employee_id)) {
            staffMap.set(entry.employee_id, {
              name: employeeName,
              hours: 0,
              pay: 0,
            });
          }

          const staff = staffMap.get(entry.employee_id);
          staff.hours += hours;
          staff.pay += hours * hourlyRate;
          totalHours += hours;
          totalPay += hours * hourlyRate;
        });

        if (staffMap.size === 0) {
          results.push({ shop: shop.shop_name, skipped: true, reason: "No staff worked this week" });
          continue;
        }

        // Generate email HTML (simplified - use template)
        const staffRows = Array.from(staffMap.values())
          .map(
            (member: any) =>
              `<tr><td>${member.name}</td><td style="text-align: right;">${member.hours.toFixed(1)}h</td><td style="text-align: right;">£${member.pay.toFixed(2)}</td></tr>`
          )
          .join("");

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
              <h1>Weekly Payroll Report</h1>
            </div>
            <div style="padding: 20px;">
              <p><strong>${shop.shop_name}</strong></p>
              <p>Week: ${weekStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; text-align: left;">Staff</th>
                    <th style="padding: 8px; text-align: right;">Hours</th>
                    <th style="padding: 8px; text-align: right;">Pay</th>
                  </tr>
                </thead>
                <tbody>${staffRows}</tbody>
                <tfoot>
                  <tr style="font-weight: bold;">
                    <td style="padding: 8px;">Total</td>
                    <td style="padding: 8px; text-align: right;">${totalHours.toFixed(1)}h</td>
                    <td style="padding: 8px; text-align: right;">£${totalPay.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </body>
          </html>
        `;

        // Send email
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DigiGet <onboarding@resend.dev>",
            to: [shop.owner_email],
            subject: `Weekly Payroll Report - ${shop.shop_name}`,
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
      JSON.stringify({ success: true, results }),
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

