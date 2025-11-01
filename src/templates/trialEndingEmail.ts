/**
 * Trial ending reminder email template
 */

export function trialEndingEmail(shopName: string, trialEndDate: string | Date, daysLeft: number) {
  const endDate = typeof trialEndDate === 'string' ? new Date(trialEndDate) : trialEndDate;
  const formattedDate = endDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">⚠️ Your Trial Ends Soon</h1>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Hi there,</strong></p>
        
        <p>Your DigiGet trial for <strong>${shopName}</strong> ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
        
        <div style="background: white; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Trial End Date:</strong> ${formattedDate}</p>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>After ${formattedDate}, your account will be paused</li>
          <li>You won't be able to check in customers or manage staff</li>
          <li>Your data is safe and will be restored when you subscribe</li>
        </ul>
        
        <p><strong>Continue enjoying DigiGet:</strong></p>
        <ul>
          <li>💰 Basic Plan: <strong>FREE</strong> forever (limited features)</li>
          <li>🚀 Pro Plan: <strong>£9.99/month</strong> (all features)</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://digiget.uk/dashboard" 
             style="background: #2563EB; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; 
                    font-weight: bold; font-size: 16px;">
            Choose Your Plan →
          </a>
        </div>
        
        <p style="color: #92400e; font-size: 14px;">
          💡 <strong>No card required</strong> for Basic Plan. Upgrade anytime!
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Questions? Reply to this email or visit <a href="https://digiget.uk">digiget.uk</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

