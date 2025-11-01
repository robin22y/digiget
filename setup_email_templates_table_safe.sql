-- Safe migration: Add missing columns if table exists, create table if it doesn't
-- Use this if you want to preserve existing data

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add template_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'template_type') THEN
    ALTER TABLE email_templates ADD COLUMN template_type TEXT;
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_template_type_unique UNIQUE (template_type);
  END IF;

  -- Add subject if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'subject') THEN
    ALTER TABLE email_templates ADD COLUMN subject TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add html_body if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'html_body') THEN
    ALTER TABLE email_templates ADD COLUMN html_body TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add text_body if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'text_body') THEN
    ALTER TABLE email_templates ADD COLUMN text_body TEXT;
  END IF;

  -- Add variables if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'variables') THEN
    ALTER TABLE email_templates ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'created_at') THEN
    ALTER TABLE email_templates ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'updated_at') THEN
    ALTER TABLE email_templates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_by if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'updated_by') THEN
    ALTER TABLE email_templates ADD COLUMN updated_by TEXT;
  END IF;
END $$;

-- Add RLS policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can manage email templates" ON email_templates;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage email templates" ON email_templates
  FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@digiget.uk' OR auth.jwt() ->> 'role' = 'super');

-- Insert default staff credentials template (only if it doesn't exist)
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

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

