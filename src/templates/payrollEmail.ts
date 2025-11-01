/**
 * Professional Payroll Email Template
 * Mobile-responsive HTML email for weekly payroll reports
 */

export interface PayrollEmailData {
  shopName: string;
  ownerName: string;
  weekNumber: number;
  dateRange: string; // "Oct 28 - Nov 3, 2025"
  totalHours: number;
  totalPay: number;
  staffBreakdown: Array<{
    name: string;
    hours: number;
    rate: number;
    grossPay: number;
    daysWorked: number;
  }>;
  csvDownloadUrl: string;
}

export function payrollEmail(data: PayrollEmailData): string {
  const staffRows = data.staffBreakdown
    .map(
      (staff) => `
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
  <title>Weekly Payroll Report - ${data.shopName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Email Container (Max 600px) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                Weekly Payroll Report
              </h1>
              <p style="margin: 8px 0 0 0; color: #DBEAFE; font-size: 16px;">
                Week ${data.weekNumber} • ${data.dateRange}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #111827;">
                Hi ${data.ownerName},
              </p>
              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 1.6; color: #111827;">
                Here's your weekly payroll summary for <strong>${data.shopName}</strong>.
              </p>
            </td>
          </tr>

          <!-- Summary Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px; text-align: center; border-right: 1px solid #DBEAFE;">
                    <div style="font-size: 14px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Total Hours
                    </div>
                    <div style="font-size: 32px; font-weight: bold; color: #1E40AF; font-family: monospace;">
                      ${data.totalHours.toFixed(1)}h
                    </div>
                  </td>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 14px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Total Gross Pay
                    </div>
                    <div style="font-size: 32px; font-weight: bold; color: #059669; font-family: monospace;">
                      £${data.totalPay.toFixed(2)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Staff Breakdown Table -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                Staff Breakdown
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <!-- Table Header -->
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Staff Member
                  </th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Hours
                  </th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Rate
                  </th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Gross Pay
                  </th>
                  <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Days
                  </th>
                </tr>
                ${staffRows}
                <!-- Totals Row -->
                <tr style="background-color: #F0FDF4; border-top: 2px solid #059669;">
                  <td style="padding: 16px 12px; font-weight: 600; color: #111827;">
                    TOTAL
                  </td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #111827; font-family: monospace;">
                    ${data.totalHours.toFixed(1)}h
                  </td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #111827;">
                    —
                  </td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #059669; font-size: 18px; font-family: monospace;">
                    £${data.totalPay.toFixed(2)}
                  </td>
                  <td style="padding: 16px 12px; text-align: center; font-weight: 600; color: #111827;">
                    —
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Download CSV Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${data.csvDownloadUrl}" 
                 style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                📥 Download CSV Report
              </a>
            </td>
          </tr>

          <!-- Warning Note -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400E;">
                  <strong>⚠️ Important:</strong> This report shows <strong>GROSS PAY ONLY</strong>. Tax, National Insurance, and other deductions must be calculated separately. Please use your accountant, Xero, QuickBooks, or payroll software for accurate tax calculations.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.6;">
                <strong>Need help?</strong> Reply to this email or contact support at 
                <a href="mailto:help@digiget.uk" style="color: #2563EB; text-decoration: none;">help@digiget.uk</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9CA3AF;">
                This is an automated weekly report from DigiGet
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

