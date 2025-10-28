import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  email: string;
  firstName: string;
  lastName?: string;
  pin: string;
  staffPortalUrl: string;
  shopName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, firstName, lastName, pin, staffPortalUrl, shopName }: RequestBody = await req.json();

    if (!email || !firstName || !pin || !staffPortalUrl || !shopName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .credential-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 2px solid #e5e7eb;
            }
            .credential-label {
              font-size: 12px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .credential-value {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              font-family: 'Courier New', monospace;
            }
            .url-box {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border: 2px solid #e5e7eb;
              word-break: break-all;
            }
            .button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            .important {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to ${shopName}!</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hi ${fullName},</p>
            
            <p>You've been added as a staff member at <strong>${shopName}</strong>. Below are your login credentials to access the staff portal.</p>
            
            <div class="credential-box">
              <div class="credential-label">Your PIN Code</div>
              <div class="credential-value">${pin}</div>
            </div>
            
            <div class="important">
              <strong>⚠️ Important:</strong> You will be asked to change this PIN on your first login for security purposes.
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;"><strong>Your Staff Portal Link:</strong></p>
            <div class="url-box">
              <a href="${staffPortalUrl}" style="color: #2563eb; text-decoration: none;">${staffPortalUrl}</a>
            </div>
            
            <div style="text-align: center;">
              <a href="${staffPortalUrl}" class="button">Access Staff Portal</a>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <h3 style="margin-top: 0; color: #1e40af;">What you can do:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Clock in and out of your shifts</li>
                <li>View and complete daily tasks</li>
                <li>Report incidents</li>
                <li>View your work history</li>
                <li>Manage customer loyalty points</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact your manager.</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Welcome to ${shopName}!

Hi ${fullName},

You've been added as a staff member at ${shopName}. Below are your login credentials:

Your PIN: ${pin}

IMPORTANT: You will be asked to change this PIN on your first login.

Your Staff Portal Link:
${staffPortalUrl}

What you can do:
- Clock in and out of your shifts
- View and complete daily tasks
- Report incidents
- View your work history
- Manage customer loyalty points

If you have any questions, please contact your manager.
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Staff Portal <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to ${shopName} - Your Staff Portal Credentials`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-staff-credentials function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
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
