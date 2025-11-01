/**
 * Email sending utility
 * Handles all email sending via Supabase edge functions
 */

import { supabase } from './supabase';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Send an email using the Supabase edge function
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!supabaseUrl) {
      return {
        success: false,
        error: 'Supabase URL not configured',
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to send email';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.details || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    return {
      success: true,
      emailId: data.emailId,
    };
  } catch (error: any) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string, resetToken: string, resetUrl?: string) {
  try {
    const { passwordResetEmail } = await import('../templates/passwordResetEmail');
    const html = passwordResetEmail(resetToken, resetUrl);

    return await sendEmail({
      to: email,
      subject: 'Reset your DigiGet password',
      html,
    });
  } catch (error: any) {
    console.error('Password reset email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
    };
  }
}

/**
 * Send welcome email when shop signs up
 */
export async function onShopSignup(shop: { name: string; id: string }, owner: { email: string; name: string }) {
  try {
    // Get welcome email template from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', 'welcome')
      .single();

    if (templateError || !template) {
      console.error('Failed to load welcome template:', templateError);
      // Fallback to hardcoded template
      const { welcomeEmail } = await import('../templates/welcomeEmail');
      const html = welcomeEmail(shop.name, owner.name);
      
      return await sendEmail({
        to: owner.email,
        subject: 'Welcome to DigiGet!',
        html,
      });
    }

    // Replace template variables
    let subject = template.subject;
    let html = template.html_body;
    let text = template.text_body || '';

    template.variables.forEach((variable: string) => {
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      const value = variable === 'shopName' ? shop.name : 
                    variable === 'ownerName' ? owner.name : '';
      
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });

    return await sendEmail({
      to: owner.email,
      subject,
      html,
      text,
    });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email',
    };
  }
}

