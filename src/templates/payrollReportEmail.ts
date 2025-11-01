/**
 * Payroll report email template
 */

export interface PayrollReport {
  shopName: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalPay: number;
  staffCount: number;
  staff: Array<{
    name: string;
    hours: number;
    pay: number;
  }>;
}

export function payrollReportEmail(report: PayrollReport) {
  const staffRows = report.staff
    .map(
      (member) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${member.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${member.hours.toFixed(1)}h</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${member.pay.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Weekly Payroll Report</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>${report.shopName}</strong></p>
        <p>Week: ${new Date(report.weekStart).toLocaleDateString()} - ${new Date(report.weekEnd).toLocaleDateString()}</p>
        
        <div style="background: white; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Staff Member</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Hours</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Pay</th>
              </tr>
            </thead>
            <tbody>
              ${staffRows}
              <tr style="font-weight: bold; background: #eff6ff;">
                <td style="padding: 12px; border-top: 2px solid #2563EB;">Total</td>
                <td style="padding: 12px; border-top: 2px solid #2563EB; text-align: right;">${report.totalHours.toFixed(1)}h</td>
                <td style="padding: 12px; border-top: 2px solid #2563EB; text-align: right;">£${report.totalPay.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          ${report.staffCount} staff member${report.staffCount !== 1 ? 's' : ''} worked this week.
        </p>
        
        <p>
          <a href="https://digiget.uk/dashboard" 
             style="background: #2563EB; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Report
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated weekly report. Questions? Reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

