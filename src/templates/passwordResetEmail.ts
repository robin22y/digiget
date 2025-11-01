/**
 * Password reset email template
 */

export function passwordResetEmail(resetToken: string, resetUrl?: string) {
  const resetLink = resetUrl || `https://digiget.uk/reset-password?token=${resetToken}`;

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Hi there,</strong></p>
        
        <p>We received a request to reset your DigiGet password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #2563EB; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; 
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;">
            <strong>⚠️ Security:</strong> This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${resetLink}" style="color: #2563EB; word-break: break-all;">${resetLink}</a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

