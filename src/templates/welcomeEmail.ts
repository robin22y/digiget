/**
 * Welcome email template for new shop owners
 */

export function welcomeEmail(shopName: string, ownerName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to DigiGet!</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Hi ${ownerName},</p>
        
        <p>Welcome! Your shop <strong>${shopName}</strong> is ready.</p>
        
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
    </html>
  `;
}

