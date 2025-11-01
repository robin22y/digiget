/**
 * Send Weekly Payroll Reports
 * Supabase Edge Function to send payroll reports to all active shops
 * 
 * Schedule: Run every Sunday at 8:00 PM via cron job
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Import Supabase client
    const { createClient } = await import("jsr:@supabase/supabase-js@2");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active Pro plan shops
    const { data: shops, error: shopsError } = await supabase
      .from("shops")
      .select("id, shop_name, owner_name, owner_email, subscription_status, plan_type")
      .eq("subscription_status", "active")
      .eq("plan_type", "pro");

    if (shopsError) {
      throw shopsError;
    }

    if (!shops || shops.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No active shops found",
          results: [] 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: Array<{
      shopId: string;
      shopName: string;
      success: boolean;
      error?: string;
      skipped?: boolean;
      reason?: string;
    }> = [];

    // Helper functions (inline for Deno environment)
    function getCurrentWeekNumber(): number {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + start.getDay() + 1) / 7);
    }

    function getStartOfWeek(): Date {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    }

    function getEndOfWeek(): Date {
      const start = getStartOfWeek();
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return end;
    }

    function getWeekDateRange(): string {
      const start = getStartOfWeek();
      const end = getEndOfWeek();
      
      const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
      const startDay = start.getDate();
      const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
      const endDay = end.getDate();
      const year = start.getFullYear();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }

    function calculateHours(clockIn: string, clockOut: string | null): number {
      if (!clockOut) return 0;
      const inTime = new Date(clockIn).getTime();
      const outTime = new Date(clockOut).getTime();
      const diffMs = outTime - inTime;
      if (diffMs < 0) return 0;
      return diffMs / (1000 * 60 * 60);
    }

    function generatePayrollEmailHTML(data: any): string {
      const staffRows = data.staffBreakdown
        .map(
          (staff: any) => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; text-align: left;">${staff.name}</td>
            <td style="padding: 12px; text-align: right; font-family: monospace;">${staff.hours.toFixed(1)}h</td>
            <td style="padding: 12px; text-align: right; font-family: monospace;">£${staff.rate.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 600; color: #059669;">£${staff.grossPay.toFixed(2)}</td>
            <td style="padding: 12px; text-align: center;">${staff.daysWorked}</td>
          </tr>
        `
        )
        .join('');

      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">Weekly Payroll Report</h1>
              <p style="margin: 8px 0 0 0; color: #DBEAFE; font-size: 16px;">Week ${data.weekNumber} • ${data.dateRange}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #111827;">Hi ${data.ownerName},</p>
              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 1.6; color: #111827;">Here's your weekly payroll summary for <strong>${data.shopName}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; text-align: center; border-right: 1px solid #DBEAFE;">
                    <div style="font-size: 14px; color: #6B7280; font-weight: 600; margin-bottom: 8px;">Total Hours</div>
                    <div style="font-size: 32px; font-weight: bold; color: #1E40AF; font-family: monospace;">${data.totalHours.toFixed(1)}h</div>
                  </td>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 14px; color: #6B7280; font-weight: 600; margin-bottom: 8px;">Total Gross Pay</div>
                    <div style="font-size: 32px; font-weight: bold; color: #059669; font-family: monospace;">£${data.totalPay.toFixed(2)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Staff Breakdown</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 8px;">
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #6B7280;">Staff Member</th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280;">Hours</th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280;">Rate</th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280;">Gross Pay</th>
                  <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #6B7280;">Days</th>
                </tr>
                ${staffRows}
                <tr style="background-color: #F0FDF4; border-top: 2px solid #059669;">
                  <td style="padding: 16px 12px; font-weight: 600;">TOTAL</td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 600; font-family: monospace;">${data.totalHours.toFixed(1)}h</td>
                  <td style="padding: 16px 12px; text-align: right;">—</td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #059669; font-size: 18px; font-family: monospace;">£${data.totalPay.toFixed(2)}</td>
                  <td style="padding: 16px 12px; text-align: center;">—</td>
                </tr>
              </table>
            </td>
          </tr>
          ${data.csvDownloadUrl ? `
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${data.csvDownloadUrl}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600;">📥 Download CSV Report</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400E;"><strong>⚠️ Important:</strong> This report shows <strong>GROSS PAY ONLY</strong>. Tax, National Insurance, and other deductions must be calculated separately.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 13px; color: #6B7280;">Need help? Reply to this email or contact <a href="mailto:help@digiget.uk" style="color: #2563EB;">help@digiget.uk</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    // Process each shop
    const weekStart = getStartOfWeek();
    const weekEnd = getEndOfWeek();

    for (const shop of shops) {
      try {
        // Get clock entries for this week
        const { data: clockEntries, error: clockError } = await supabase
          .from("clock_entries")
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              hourly_rate
            )
          `)
          .eq("shop_id", shop.id)
          .gte("clock_in_time", weekStart.toISOString())
          .lt("clock_in_time", weekEnd.toISOString())
          .not("clock_out_time", "is", null);

        if (clockError) {
          results.push({
            shopId: shop.id,
            shopName: shop.shop_name,
            success: false,
            error: clockError.message,
          });
          continue;
        }

        if (!clockEntries || clockEntries.length === 0) {
          results.push({
            shopId: shop.id,
            shopName: shop.shop_name,
            success: true,
            skipped: true,
            reason: "No staff worked this week",
          });
          continue;
        }

        // Calculate payroll
        const staffMap = new Map();
        let totalHours = 0;
        let totalPay = 0;

        clockEntries.forEach((entry: any) => {
          const employee = entry.employees;
          if (!employee) return;

          const employeeId = employee.id;
          const name = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
          const rate = employee.hourly_rate || 0;
          const hours = calculateHours(entry.clock_in_time, entry.clock_out_time);
          const date = new Date(entry.clock_in_time).toISOString().split('T')[0];

          if (!staffMap.has(employeeId)) {
            staffMap.set(employeeId, {
              name,
              hours: 0,
              rate,
              daysWorked: new Set(),
            });
          }

          const staff = staffMap.get(employeeId);
          staff.hours += hours;
          staff.daysWorked.add(date);
        });

        const staffBreakdown = Array.from(staffMap.values()).map((staff: any) => {
          const grossPay = staff.hours * staff.rate;
          totalHours += staff.hours;
          totalPay += grossPay;
          return {
            name: staff.name,
            hours: staff.hours,
            rate: staff.rate,
            grossPay,
            daysWorked: staff.daysWorked.size,
          };
        });

        // Generate CSV
        const csvContent = [
          'Staff Member,Hours,Rate (£),Gross Pay (£),Days Worked',
          ...staffBreakdown.map((s: any) =>
            `"${s.name}",${s.hours.toFixed(1)},${s.rate.toFixed(2)},${s.grossPay.toFixed(2)},${s.daysWorked}`
          ),
          `TOTAL,${totalHours.toFixed(1)},,${totalPay.toFixed(2)},`,
        ].join('\n');

        // Upload CSV to storage
        const fileName = `payroll-${shop.id}-${Date.now()}.csv`;
        const filePath = `${shop.id}/${fileName}`;
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvFile = new File([csvBlob], fileName, { type: 'text/csv' });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payroll-reports')
          .upload(filePath, csvFile, {
            contentType: 'text/csv',
            upsert: false,
          });

        let csvDownloadUrl = '';
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('payroll-reports')
            .getPublicUrl(filePath);
          csvDownloadUrl = urlData.publicUrl;
        }

        // Prepare email data
        const emailData = {
          shopName: shop.shop_name,
          ownerName: shop.owner_name,
          weekNumber: getCurrentWeekNumber(),
          dateRange: getWeekDateRange(),
          totalHours,
          totalPay,
          staffBreakdown,
          csvDownloadUrl,
        };

        // Generate and send email
        const emailHtml = generatePayrollEmailHTML(emailData);

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DigiGet <onboarding@resend.dev>",
            to: [shop.owner_email],
            subject: `Weekly Payroll Report - ${shop.shop_name} (Week ${emailData.weekNumber})`,
            html: emailHtml,
            text: `Weekly Payroll Report for ${shop.shop_name}\nWeek ${emailData.weekNumber}: ${emailData.dateRange}\n\nTotal Hours: ${totalHours.toFixed(1)}h\nTotal Gross Pay: £${totalPay.toFixed(2)}\n\n${csvDownloadUrl ? `Download CSV: ${csvDownloadUrl}` : ''}`,
          }),
        });

        if (emailRes.ok) {
          results.push({
            shopId: shop.id,
            shopName: shop.shop_name,
            success: true,
          });
        } else {
          const errorText = await emailRes.text();
          results.push({
            shopId: shop.id,
            shopName: shop.shop_name,
            success: false,
            error: errorText,
          });
        }
      } catch (error: any) {
        results.push({
          shopId: shop.id,
          shopName: shop.shop_name,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success && !r.skipped).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const failedCount = results.filter((r) => !r.success && !r.skipped).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          successful: successCount,
          skipped: skippedCount,
          failed: failedCount,
        },
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Payroll email error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

