// Hello Khata OS - Export Utilities
// হ্যালো খাতা - এক্সপোর্ট ইউটিলিটিস

export interface ReportData {
  dateRange: {
    start: string;
    end: string;
    period: string;
  };
  stats: {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    receivable: number;
    stockValue: number;
  };
  chartData: Array<{
    date: string;
    sales: number;
    expenses: number;
    profit: number;
  }>;
  salesByCategory?: Array<{
    name: string;
    value: number;
  }>;
  profitLossSummary: {
    totalRevenue: number;
    costOfGoods: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
  };
}

// Get current date string for filename
function getDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format currency for export
function formatCurrencyExport(amount: number): string {
  return `৳${amount.toLocaleString('en-US')}`;
}

// Helper function to download blob - Fixed for reliability
function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    // Try using modern download API first
    if (window.navigator && 'msSaveOrOpenBlob' in window.navigator) {
      // IE/Edge legacy support
      (window.navigator as Navigator & { msSaveOrOpenBlob: (blob: Blob, filename: string) => boolean }).msSaveOrOpenBlob(blob, filename);
      return true;
    }
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
    
    // Append to body, click, then remove
    document.body.appendChild(link);
    
    // Force click using MouseEvent for better compatibility
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    link.dispatchEvent(event);
    
    // Cleanup after a delay to ensure download starts
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 200);
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    
    // Fallback: try opening in new tab
    try {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return true;
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      return false;
    }
  }
}

// Export to CSV
export function exportToCSV(data: ReportData, filename?: string): boolean {
  const actualFilename = filename || `sales-report-${getDateForFilename()}.csv`;
  
  // Create CSV content
  const rows: string[][] = [];
  
  // Header row
  rows.push(['Hello Khata OS - Sales Report']);
  rows.push([`Period: ${data.dateRange.period}`]);
  rows.push([`Generated: ${new Date().toLocaleString()}`]);
  rows.push([]);
  
  // Summary stats
  rows.push(['SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Sales', formatCurrencyExport(data.stats.totalSales)]);
  rows.push(['Total Expenses', formatCurrencyExport(data.stats.totalExpenses)]);
  rows.push(['Net Profit', formatCurrencyExport(data.stats.netProfit)]);
  rows.push(['Profit Margin', `${data.stats.profitMargin.toFixed(1)}%`]);
  rows.push(['Receivable', formatCurrencyExport(data.stats.receivable)]);
  rows.push(['Stock Value', formatCurrencyExport(data.stats.stockValue)]);
  rows.push([]);
  
  // Daily data
  rows.push(['DAILY DATA']);
  rows.push(['Date', 'Sales', 'Expenses', 'Profit']);
  data.chartData.forEach(row => {
    rows.push([row.date, row.sales.toString(), row.expenses.toString(), row.profit.toString()]);
  });
  rows.push([]);
  
  // Sales by Category
  if (data.salesByCategory && data.salesByCategory.length > 0) {
    rows.push(['SALES BY CATEGORY']);
    rows.push(['Category', 'Percentage']);
    data.salesByCategory.forEach(row => {
      rows.push([row.name, `${row.value}%`]);
    });
    rows.push([]);
  }
  
  // Profit & Loss Summary
  rows.push(['PROFIT & LOSS SUMMARY']);
  rows.push(['Item', 'Amount']);
  rows.push(['Total Revenue', formatCurrencyExport(data.profitLossSummary.totalRevenue)]);
  rows.push(['Cost of Goods Sold', formatCurrencyExport(data.profitLossSummary.costOfGoods)]);
  rows.push(['Gross Profit', formatCurrencyExport(data.profitLossSummary.grossProfit)]);
  rows.push(['Operating Expenses', formatCurrencyExport(data.profitLossSummary.operatingExpenses)]);
  rows.push(['Net Profit', formatCurrencyExport(data.profitLossSummary.netProfit)]);
  
  // Convert to CSV string with proper escaping
  const csvContent = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes
      const escaped = String(cell).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  ).join('\n');
  
  // Create and download file with BOM for proper Unicode support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  return downloadBlob(blob, actualFilename);
}

// Export to Excel (HTML table approach - works with Excel and LibreOffice)
export function exportToExcel(data: ReportData, filename?: string): boolean {
  const actualFilename = filename || `sales-report-${getDateForFilename()}.xlsx`;
  
  // Create HTML table for Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Report</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        .header { font-weight: bold; font-size: 14px; }
        .section-header { font-weight: bold; background-color: #f0f0f0; }
        .label { font-weight: bold; }
        .currency { text-align: right; }
        .profit { color: #10B981; font-weight: bold; }
        .expense { color: #EF4444; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="4" class="header">Hello Khata OS - Sales Report</td></tr>
        <tr><td colspan="4">Period: ${data.dateRange.period}</td></tr>
        <tr><td colspan="4">Generated: ${new Date().toLocaleString()}</td></tr>
        <tr><td colspan="4"></td></tr>
        
        <tr class="section-header"><td colspan="4">SUMMARY</td></tr>
        <tr><td class="label">Metric</td><td class="label">Value</td></tr>
        <tr><td>Total Sales</td><td class="currency">${formatCurrencyExport(data.stats.totalSales)}</td></tr>
        <tr><td>Total Expenses</td><td class="currency">${formatCurrencyExport(data.stats.totalExpenses)}</td></tr>
        <tr><td>Net Profit</td><td class="currency profit">${formatCurrencyExport(data.stats.netProfit)}</td></tr>
        <tr><td>Profit Margin</td><td>${data.stats.profitMargin.toFixed(1)}%</td></tr>
        <tr><td>Receivable</td><td class="currency">${formatCurrencyExport(data.stats.receivable)}</td></tr>
        <tr><td>Stock Value</td><td class="currency">${formatCurrencyExport(data.stats.stockValue)}</td></tr>
        <tr><td colspan="4"></td></tr>
        
        <tr class="section-header"><td colspan="4">DAILY DATA</td></tr>
        <tr><td class="label">Date</td><td class="label">Sales</td><td class="label">Expenses</td><td class="label">Profit</td></tr>
        ${data.chartData.map(row => `
          <tr>
            <td>${row.date}</td>
            <td class="currency">${formatCurrencyExport(row.sales)}</td>
            <td class="currency expense">${formatCurrencyExport(row.expenses)}</td>
            <td class="currency profit">${formatCurrencyExport(row.profit)}</td>
          </tr>
        `).join('')}
        <tr><td colspan="4"></td></tr>
        
        <tr class="section-header"><td colspan="4">PROFIT & LOSS SUMMARY</td></tr>
        <tr><td class="label">Item</td><td class="label">Amount</td></tr>
        <tr><td>Total Revenue</td><td class="currency">${formatCurrencyExport(data.profitLossSummary.totalRevenue)}</td></tr>
        <tr><td>Cost of Goods Sold</td><td class="currency expense">-${formatCurrencyExport(data.profitLossSummary.costOfGoods)}</td></tr>
        <tr><td>Gross Profit</td><td class="currency">${formatCurrencyExport(data.profitLossSummary.grossProfit)}</td></tr>
        <tr><td>Operating Expenses</td><td class="currency expense">-${formatCurrencyExport(data.profitLossSummary.operatingExpenses)}</td></tr>
        <tr><td class="label">Net Profit</td><td class="currency profit">${formatCurrencyExport(data.profitLossSummary.netProfit)}</td></tr>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  return downloadBlob(blob, actualFilename);
}

// Export to PDF (printable HTML that can be saved as PDF)
export function exportToPDF(data: ReportData, filename?: string): boolean {
  // Create printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hello Khata OS - Sales Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #10B981;
        }
        .header h1 {
          font-size: 24px;
          color: #0E1117;
          margin-bottom: 8px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #0E1117;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e5e5;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #0E1117;
        }
        .stat-value.profit { color: #10B981; }
        .stat-value.expense { color: #EF4444; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 13px;
        }
        td {
          font-size: 14px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .profit-row {
          background: #f0fdf4;
          font-weight: 600;
        }
        .expense-row {
          color: #EF4444;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          margin-bottom: 8px;
          border-radius: 6px;
        }
        .summary-row.revenue { background: #f0fdf4; }
        .summary-row.expense { background: #fef2f2; }
        .summary-row.profit { background: #ecfdf5; border: 2px solid #10B981; }
        .summary-row.gross { background: #eff6ff; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .no-print {
          padding: 15px;
          text-align: center;
          background: #f0f0f0;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <p><strong>Print Instructions:</strong> Use Ctrl+P (or Cmd+P on Mac) to print, or select "Save as PDF" as the printer destination.</p>
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #10B981; color: white; border: none; border-radius: 6px;">Print / Save as PDF</button>
      </div>
      <div class="header">
        <h1>Hello Khata OS - Sales Report</h1>
        <p>Period: ${data.dateRange.period} | Generated: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Sales</div>
            <div class="stat-value">${formatCurrencyExport(data.stats.totalSales)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Expenses</div>
            <div class="stat-value expense">${formatCurrencyExport(data.stats.totalExpenses)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Net Profit</div>
            <div class="stat-value profit">${formatCurrencyExport(data.stats.netProfit)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Profit Margin</div>
            <div class="stat-value">${data.stats.profitMargin.toFixed(1)}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Receivable</div>
            <div class="stat-value">${formatCurrencyExport(data.stats.receivable)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Stock Value</div>
            <div class="stat-value">${formatCurrencyExport(data.stats.stockValue)}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Daily Data</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-right">Sales</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${data.chartData.map(row => `
              <tr>
                <td>${row.date}</td>
                <td class="text-right">${formatCurrencyExport(row.sales)}</td>
                <td class="text-right expense-row">${formatCurrencyExport(row.expenses)}</td>
                <td class="text-right" style="color: #10B981;">${formatCurrencyExport(row.profit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Profit & Loss Summary</div>
        <div class="summary-row revenue">
          <span>Total Revenue</span>
          <span style="color: #10B981; font-weight: 600;">${formatCurrencyExport(data.profitLossSummary.totalRevenue)}</span>
        </div>
        <div class="summary-row expense">
          <span>Cost of Goods Sold</span>
          <span>-${formatCurrencyExport(data.profitLossSummary.costOfGoods)}</span>
        </div>
        <div class="summary-row gross">
          <span>Gross Profit</span>
          <span style="font-weight: 600;">${formatCurrencyExport(data.profitLossSummary.grossProfit)}</span>
        </div>
        <div class="summary-row expense">
          <span>Operating Expenses</span>
          <span>-${formatCurrencyExport(data.profitLossSummary.operatingExpenses)}</span>
        </div>
        <div class="summary-row profit">
          <span style="font-size: 16px;">Net Profit</span>
          <span style="color: #10B981; font-size: 18px;">${formatCurrencyExport(data.profitLossSummary.netProfit)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Generated by Hello Khata OS - Business Management System</p>
      </div>
      
      <script>
        // Auto-trigger print after a short delay
        setTimeout(function() {
          window.print();
        }, 500);
      </script>
    </body>
    </html>
  `;
  
  // Open in new window for printing
  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank', 'width=900,height=650,scrollbars=yes,resizable=yes');
  } catch (e) {
    console.error('Popup blocked:', e);
  }
  
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Focus the window
    printWindow.focus();
    
    return true;
  } else {
    // Popup was blocked - try alternative approach
    console.warn('Popup blocked. Creating inline print dialog.');
    
    // Create an iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;';
    iframe.id = 'print-iframe';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
        
        // Cleanup after printing
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 1000);
      }, 500);
      
      return true;
    }
  }
  
  return false;
}

// Print Report
export function printReport(data: ReportData): boolean {
  // Use the same PDF generation for printing
  return exportToPDF(data);
}

// Alternative: Direct file download using FileSaver pattern
export function downloadFile(content: string | Blob, filename: string, mimeType?: string): boolean {
  let blob: Blob;
  
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8;' });
  } else {
    blob = content;
  }
  
  return downloadBlob(blob, filename);
}
