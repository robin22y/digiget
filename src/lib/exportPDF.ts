import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  shop: any;
  analytics: any;
  period: string;
  dateRange: { start: string; end: string };
  dashboardRef: HTMLElement | null;
}

export async function exportAnalyticsToPDF(options: ExportOptions) {
  const { shop, analytics, period, dateRange } = options;
  const { overview, staffPerformance, payrollBreakdown } = analytics;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(shop.shop_name || 'Shop', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Performance Report', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const periodText = period === 'custom' 
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : `Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`;
  pdf.text(periodText, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 3;
  pdf.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, yPos, { align: 'center' });

  // Reset text color
  pdf.setTextColor(0);
  yPos += 15;

  // Key Metrics Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Key Metrics', 15, yPos);
  yPos += 8;

  const metricsData = [
    ['Total Revenue', `£${overview.totalRevenue.toFixed(2)}`],
    ['Total Payroll', `£${overview.totalPayroll.toFixed(2)}`],
    ['Net Profit', `£${overview.netProfit.toFixed(2)}`],
    ['Profit Margin', `${overview.profitMargin}%`],
    ['Total Customers', overview.totalCustomers.toString()],
    ['New Customers', overview.newCustomers.toString()],
    ['Returning Customers', overview.returningCustomers.toString()],
    ['Total Visits', overview.totalVisits.toString()],
    ['Average Bill', `£${overview.averageBill.toFixed(2)}`]
  ];

  autoTable(pdf, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [0, 122, 255], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 80 }
    }
  });

  yPos = (pdf as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = 20;
  }

  // Staff Performance Section
  if (staffPerformance && staffPerformance.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('👥 Staff Performance', 15, yPos);
    yPos += 8;

    const staffData = staffPerformance.map((staff: any, index: number) => [
      `#${index + 1}`,
      `${staff.staff?.first_name || 'Unknown'} ${staff.staff?.last_name || ''}`,
      staff.customersServed.toString(),
      `£${staff.revenue.toFixed(2)}`,
      `£${staff.commission.toFixed(2)}`
    ]);

    autoTable(pdf, {
      startY: yPos,
      head: [['Rank', 'Staff Member', 'Customers', 'Revenue', 'Commission']],
      body: staffData,
      theme: 'striped',
      headStyles: { fillColor: [0, 122, 255], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 40 },
        4: { halign: 'right', cellWidth: 40 }
      }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 15;
  }

  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = 20;
  }

  // Payroll Breakdown Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💸 Payroll Breakdown', 15, yPos);
  yPos += 8;

  const payrollTotal = payrollBreakdown.total || 0;
  const payrollData = [
    [
      'Hourly Wages',
      `£${payrollBreakdown.hourlyWages.toFixed(2)}`,
      payrollTotal > 0
        ? `${((payrollBreakdown.hourlyWages / payrollTotal) * 100).toFixed(2)}%`
        : '-',
    ],
    [
      'Commission',
      `£${payrollBreakdown.commission.toFixed(2)}`,
      payrollTotal > 0
        ? `${((payrollBreakdown.commission / payrollTotal) * 100).toFixed(2)}%`
        : '-',
    ],
    ['Total Payroll', `£${payrollTotal.toFixed(2)}`, '100%']
  ];

  autoTable(pdf, {
    startY: yPos,
    head: [['Category', 'Amount', '% of Total']],
    body: payrollData,
    theme: 'grid',
    headStyles: { fillColor: [0, 122, 255], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 60 },
      2: { halign: 'right', cellWidth: 45 }
    },
    didParseCell: (data) => {
      if (data.row.index === 2 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  yPos = (pdf as any).lastAutoTable.finalY + 15;

  // Financial Summary
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = 20;
  }

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💰 Financial Summary', 15, yPos);
  yPos += 8;

  const financialData = [
    ['Total Revenue', `£${overview.totalRevenue.toFixed(2)}`],
    ['Total Payroll', `£${overview.totalPayroll.toFixed(2)}`],
    ['Net Profit', `£${overview.netProfit.toFixed(2)}`]
  ];

  autoTable(pdf, {
    startY: yPos,
    body: financialData,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 80, fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        const profit = overview.netProfit;
        data.cell.styles.textColor = profit >= 0 ? [52, 199, 89] : [255, 59, 48];
        data.cell.styles.fontSize = 13;
      }
    }
  });

  yPos = (pdf as any).lastAutoTable.finalY + 10;

  // Profit/Loss Box
  const boxWidth = 180;
  const boxHeight = 25;
  const boxX = (pageWidth - boxWidth) / 2;
  
  const isProfit = overview.netProfit >= 0;
  pdf.setFillColor(isProfit ? 52 : 255, isProfit ? 199 : 59, isProfit ? 89 : 48);
  pdf.setDrawColor(isProfit ? 52 : 255, isProfit ? 199 : 59, isProfit ? 89 : 48);
  pdf.roundedRect(boxX, yPos, boxWidth, boxHeight, 3, 3, 'FD');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(
    `${isProfit ? '📈' : '📉'} ${isProfit ? 'PROFIT' : 'LOSS'}: £${Math.abs(overview.netProfit).toFixed(2)}`,
    pageWidth / 2,
    yPos + 12,
    { align: 'center' }
  );

  pdf.setFontSize(10);
  pdf.text(
    `Profit Margin: ${overview.profitMargin}%`,
    pageWidth / 2,
    yPos + 19,
    { align: 'center' }
  );

  // Footer
  pdf.setTextColor(150);
  pdf.setFontSize(8);
  pdf.text(
    'Generated by DigiGet - Shop Management System',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  const filename = `${(shop.shop_name || 'Shop').replace(/\s+/g, '-')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

