-- Create email_templates table for managing email templates
-- Run this in your Supabase SQL editor

-- Drop existing table if it exists (removes any incorrect schema)
DROP TABLE IF EXISTS email_templates CASCADE;

-- Create email_templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL UNIQUE,
  -- template_type can be: 'staff_credentials', 'welcome', 'trial_expiry', 'monthly_report', etc.
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  -- variables stores an array of variable names like ["shopName", "staffName", "pin", "portalUrl"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Add RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins can manage email templates" ON email_templates
  FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@digiget.uk' OR auth.jwt() ->> 'role' = 'super');

-- Insert default staff credentials template
INSERT INTO email_templates (template_type, subject, html_body, text_body, variables)
VALUES (
  'staff_credentials',
  'Welcome to {{shopName}} - Your Staff Portal Credentials',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
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
        font-family: ''Courier New'', monospace;
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
      <h1 style="margin: 0; font-size: 28px;">Welcome to {{shopName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{staffName}},</p>
      <p>You''ve been added as a staff member at {{shopName}}. Below are your login credentials:</p>
      
      <div class="credential-box">
        <div class="credential-label">Your PIN</div>
        <div class="credential-value">{{pin}}</div>
      </div>
      
      <div class="important">
        <strong>IMPORTANT:</strong> You will be asked to change this PIN on your first login.
      </div>
      
      <div class="url-box">
        <div class="credential-label">Your Staff Portal Link</div>
        <a href="{{portalUrl}}">{{portalUrl}}</a>
      </div>
      
      <div style="text-align: center;">
        <a href="{{portalUrl}}" class="button">Access Staff Portal</a>
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
</html>',
  'Welcome to {{shopName}}!

Hi {{staffName}},

You''ve been added as a staff member at {{shopName}}. Below are your login credentials:

Your PIN: {{pin}}

IMPORTANT: You will be asked to change this PIN on your first login.

Your Staff Portal Link:
{{portalUrl}}

What you can do:
- Clock in and out of your shifts
- View and complete daily tasks
- Report incidents
- View your work history
- Manage customer loyalty points

If you have any questions, please contact your manager.',
  '["shopName", "staffName", "pin", "portalUrl"]'::jsonb
) ON CONFLICT (template_type) DO NOTHING;

-- Insert welcome email template
INSERT INTO email_templates (template_type, subject, html_body, text_body, variables)
VALUES (
  'welcome',
  'Welcome to DigiGet!',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
    <h1>Welcome to DigiGet!</h1>
  </div>
  
  <div style="padding: 20px;">
    <p>Hi {{ownerName}},</p>
    
    <p>Welcome! Your shop <strong>{{shopName}}</strong> is ready.</p>
    
    <p><strong>Next steps:</strong></p>
    <ol>
      <li>Add your staff</li>
      <li>Set shop location</li>
      <li>Start checking in customers</li>
    </ol>
    
    <p>
      <a href="https://digiget.uk/dashboard" 
         style="background: #2563EB; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; display: inline-block;">
        Go to Dashboard
      </a>
    </p>
    
    <p>Questions? Reply to this email or text: 07XXX XXX XXX</p>
    
    <p>Cheers,<br>DigiGet Team</p>
  </div>
</body>
</html>',
  'Welcome to DigiGet!

Hi {{ownerName}},

Welcome! Your shop {{shopName}} is ready.

Next steps:
1. Add your staff
2. Set shop location
3. Start checking in customers

Go to Dashboard: https://digiget.uk/dashboard

Questions? Reply to this email or text: 07XXX XXX XXX

Cheers,
DigiGet Team',
  '["shopName", "ownerName"]'::jsonb
) ON CONFLICT (template_type) DO NOTHING;

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

