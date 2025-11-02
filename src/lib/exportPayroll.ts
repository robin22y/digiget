/**
 * Excel-compatible CSV export utilities
 * 
 * Key fixes:
 * - No currency symbols (just numbers)
 * - UTF-8 with BOM (Excel compatibility)
 * - Proper number formatting (2 decimal places)
 * - Quoted cells (handles commas in names)
 * - Windows line endings (\r\n) for Excel
 */

export interface PayrollRow {
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: number;
  hourlyRate: number;
  pay: number;
  notes?: string;
}

/**
 * Export payroll data to Excel-compatible CSV
 */
export function exportPayrollToCSV(
  payrollData: PayrollRow[],
  filename?: string
) {
  // Headers
  const headers = [
    'Employee',
    'Date',
    'Clock In',
    'Clock Out',
    'Hours',
    'Hourly Rate (GBP)',
    'Pay (GBP)',
    'Notes'
  ];

  // Data rows
  const rows = payrollData.map(row => [
    row.employeeName,
    formatDate(row.date),
    row.clockIn,
    row.clockOut,
    formatNumber(row.hours),
    formatNumber(row.hourlyRate),
    formatNumber(row.pay),
    row.notes || ''
  ]);

  // Add summary row
  const totalHours = payrollData.reduce((sum, row) => sum + row.hours, 0);
  const totalPay = payrollData.reduce((sum, row) => sum + row.pay, 0);
  
  const summaryRow = [
    'TOTAL',
    '',
    '',
    '',
    formatNumber(totalHours),
    '',
    formatNumber(totalPay),
    ''
  ];

  // Combine all rows
  const allRows = [
    headers,
    ...rows,
    [], // Empty row
    summaryRow
  ];

  // Convert to CSV format
  const csvContent = allRows
    .map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
    .join('\r\n'); // Use Windows line endings for Excel

  // Add UTF-8 BOM (Byte Order Mark) for Excel
  const BOM = '\uFEFF';
  const finalCSV = BOM + csvContent;

  // Create and download file
  downloadCSV(finalCSV, filename || `payroll-${getDateString()}.csv`);
}

/**
 * Format number to 2 decimal places
 */
function formatNumber(num: number): string {
  return num.toFixed(2);
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get current date string for filename
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export simple data to CSV (for analytics, etc.)
 */
export function exportToCSV(
  data: (string | number)[][],
  filename: string,
  headers?: string[]
) {
  const allRows = headers ? [headers, ...data] : data;

  const csvContent = allRows
    .map(row => 
      row.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
    .join('\r\n');

  // Add UTF-8 BOM for Excel
  const BOM = '\uFEFF';
  downloadCSV(BOM + csvContent, filename);
}

