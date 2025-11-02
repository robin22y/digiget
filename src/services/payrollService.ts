/**
 * Payroll Service
 * Generates and sends weekly payroll reports
 */

import { supabase } from '../lib/supabase';
import { payrollEmail, PayrollEmailData } from '../templates/payrollEmail';

export interface StaffPayrollData {
  name: string;
  hours: number;
  rate: number;
  grossPay: number;
  daysWorked: number;
}

export interface WeeklyPayrollData {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  weekNumber: number;
  dateRange: string;
  totalHours: number;
  totalPay: number;
  staffBreakdown: StaffPayrollData[];
}

/**
 * Get current week number of the year
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * Get start of current week (Monday 00:00:00)
 */
export function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get end of current week (Sunday 23:59:59)
 */
export function getEndOfWeek(): Date {
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format date range for display
 */
export function getWeekDateRange(): string {
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

/**
 * Calculate hours between two timestamps
 */
export function calculateHours(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  
  const inTime = new Date(clockIn).getTime();
  const outTime = new Date(clockOut).getTime();
  const diffMs = outTime - inTime;
  
  if (diffMs < 0) return 0; // Invalid if clock out before clock in
  
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Get weekly payroll data for a shop
 */
export async function getWeeklyPayrollData(shopId: string): Promise<WeeklyPayrollData | null> {
  try {
    // Get shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('shop_name, owner_name, owner_email')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      throw new Error('Shop not found');
    }

    // Get week boundaries
    const weekStart = getStartOfWeek();
    const weekEnd = getEndOfWeek();

    // Get clock entries for this week
    const { data: clockEntries, error: clockError } = await supabase
      .from('clock_entries')
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          hourly_rate
        )
      `)
      .eq('shop_id', shopId)
      .gte('clock_in_time', weekStart.toISOString())
      .lt('clock_in_time', weekEnd.toISOString())
      .not('clock_out_time', 'is', null);

    if (clockError) {
      throw clockError;
    }

    if (!clockEntries || clockEntries.length === 0) {
      return null; // No data for this week
    }

    // Group by employee and calculate
    const staffMap = new Map<string, {
      name: string;
      hours: number;
      rate: number;
      daysWorked: Set<string>;
    }>();

    clockEntries.forEach((entry: any) => {
      const employee = entry.employees;
      if (!employee) return;

      const employeeId = employee.id;
      const name = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
      const rate = employee.hourly_rate || 0;
      const hours = calculateHours(entry.clock_in_time, entry.clock_out_time);
      
      // Get date (YYYY-MM-DD) for counting days
      const date = new Date(entry.clock_in_time).toISOString().split('T')[0];

      if (!staffMap.has(employeeId)) {
        staffMap.set(employeeId, {
          name,
          hours: 0,
          rate,
          daysWorked: new Set(),
        });
      }

      const staff = staffMap.get(employeeId)!;
      staff.hours += hours;
      staff.daysWorked.add(date);
    });

    // Convert to array and calculate totals
    const staffBreakdown: StaffPayrollData[] = Array.from(staffMap.values()).map((staff) => ({
      name: staff.name,
      hours: staff.hours,
      rate: staff.rate,
      grossPay: staff.hours * staff.rate,
      daysWorked: staff.daysWorked.size,
    }));

    const totalHours = staffBreakdown.reduce((sum, s) => sum + s.hours, 0);
    const totalPay = staffBreakdown.reduce((sum, s) => sum + s.grossPay, 0);

    return {
      shopName: shop.shop_name,
      ownerName: shop.owner_name,
      ownerEmail: shop.owner_email,
      weekNumber: getCurrentWeekNumber(),
      dateRange: getWeekDateRange(),
      totalHours,
      totalPay,
      staffBreakdown,
    };
  } catch (error) {
    console.error('Error getting payroll data:', error);
    throw error;
  }
}

/**
 * Generate CSV content for payroll
 */
export function generatePayrollCSV(data: WeeklyPayrollData): string {
  // Excel-compatible CSV: No currency symbols, just numbers
  const headers = ['Staff Member', 'Hours', 'Rate (GBP)', 'Gross Pay (GBP)', 'Days Worked'];
  const rows = data.staffBreakdown.map((staff) => [
    staff.name,
    staff.hours.toFixed(1),
    staff.rate.toFixed(2), // No £ symbol
    staff.grossPay.toFixed(2), // No £ symbol
    staff.daysWorked.toString(),
  ]);

  // Add totals row
  rows.push([
    'TOTAL',
    data.totalHours.toFixed(1),
    '',
    data.totalPay.toFixed(2),
    '',
  ]);

  // Convert to CSV format with proper quoting
  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => {
      const escaped = String(cell).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')),
  ];

  // Use Windows line endings for Excel compatibility
  // Add UTF-8 BOM for Excel
  const BOM = '\uFEFF';
  return BOM + csvRows.join('\r\n');
}

/**
 * Upload CSV to Supabase Storage and get public URL
 */
export async function uploadPayrollCSV(shopId: string, csvContent: string): Promise<string> {
  try {
    const fileName = `payroll-${shopId}-${Date.now()}.csv`;
    const filePath = `${shopId}/${fileName}`;

    // Convert string to Blob
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], fileName, { type: 'text/csv' });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('payroll-reports')
      .upload(filePath, file, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payroll-reports')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading CSV:', error);
    throw error;
  }
}

/**
 * Send weekly payroll report email
 */
export async function sendWeeklyPayrollReport(shopId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get payroll data
    const payrollData = await getWeeklyPayrollData(shopId);
    
    if (!payrollData || payrollData.staffBreakdown.length === 0) {
      return {
        success: false,
        error: 'No payroll data for this week',
      };
    }

    // Generate CSV
    const csvContent = generatePayrollCSV(payrollData);

    // Upload CSV and get URL
    const csvDownloadUrl = await uploadPayrollCSV(shopId, csvContent);

    // Prepare email data
    const emailData: PayrollEmailData = {
      shopName: payrollData.shopName,
      ownerName: payrollData.ownerName,
      weekNumber: payrollData.weekNumber,
      dateRange: payrollData.dateRange,
      totalHours: payrollData.totalHours,
      totalPay: payrollData.totalPay,
      staffBreakdown: payrollData.staffBreakdown,
      csvDownloadUrl,
    };

    // Generate email HTML
    const html = payrollEmail(emailData);

    // Send email using existing email utility
    const { sendEmail } = await import('../lib/email');
    const result = await sendEmail({
      to: payrollData.ownerEmail,
      subject: `Weekly Payroll Report - ${payrollData.shopName} (Week ${payrollData.weekNumber})`,
      html,
      text: `Weekly Payroll Report for ${payrollData.shopName}\nWeek ${payrollData.weekNumber}: ${payrollData.dateRange}\n\nTotal Hours: ${payrollData.totalHours.toFixed(1)}h\nTotal Gross Pay: £${payrollData.totalPay.toFixed(2)}\n\nDownload CSV: ${csvDownloadUrl}`,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send email',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error sending payroll report:', error);
    return {
      success: false,
      error: error.message || 'Failed to send payroll report',
    };
  }
}

