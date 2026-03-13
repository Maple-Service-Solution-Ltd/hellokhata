// Invoice PDF Generation
// Creates printable invoices with templates

import { db } from '@/lib/db';

export interface InvoiceTemplate {
  name: string;
  paperSize: 'A4' | 'A5' | 'POS_80mm';
  language: 'bn' | 'en' | 'bilingual';
  showLogo: boolean;
  showTaxDetails: boolean;
  showPaymentTerms: boolean;
  showSignature: boolean;
}

export interface InvoiceData {
  invoiceNo: string;
  date: Date;
  dueDate?: Date;
  business: {
    name: string;
    nameBn?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    currency: string;
  };
  customer?: {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  items: Array<{
    name: string;
    nameBn?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
  footer?: string;
}

/**
 * Generate HTML for invoice
 */
export function generateInvoiceHTML(
  data: InvoiceData,
  template: InvoiceTemplate
): string {
  const isBangla = template.language === 'bn' || template.language === 'bilingual';
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    const symbol = data.business.currency === 'BDT' ? '৳' : data.business.currency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getWidth = () => {
    switch (template.paperSize) {
      case 'POS_80mm': return '280px';
      case 'A5': return '400px';
      default: return '600px';
    }
  };

  const isPOS = template.paperSize === 'POS_80mm';

  return `
<!DOCTYPE html>
<html lang="${isBangla ? 'bn' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: ${isPOS ? '11px' : '12px'};
      line-height: 1.4;
      color: #1a1a1a;
    }
    .invoice {
      width: ${getWidth()};
      margin: 0 auto;
      padding: ${isPOS ? '10px' : '30px'};
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: ${isPOS ? '15px' : '30px'};
      padding-bottom: ${isPOS ? '10px' : '20px'};
      border-bottom: 2px solid #1a1a1a;
    }
    .logo {
      max-width: ${isPOS ? '60px' : '80px'};
      max-height: ${isPOS ? '40px' : '60px'};
      margin-bottom: 10px;
    }
    .business-name {
      font-size: ${isPOS ? '16px' : '24px'};
      font-weight: bold;
      margin-bottom: 5px;
    }
    .business-info {
      color: #666;
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .invoice-title {
      font-size: ${isPOS ? '14px' : '20px'};
      font-weight: bold;
      margin: ${isPOS ? '10px 0' : '20px 0'};
      text-align: center;
      ${isPOS ? '' : 'text-transform: uppercase;'}
    }
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: ${isPOS ? '10px' : '20px'};
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .invoice-meta div {
      flex: 1;
    }
    .invoice-meta .label {
      color: #666;
    }
    .invoice-meta .value {
      font-weight: 600;
    }
    .customer-info {
      background: #f8f8f8;
      padding: ${isPOS ? '8px' : '15px'};
      margin-bottom: ${isPOS ? '10px' : '20px'};
      border-radius: 4px;
    }
    .customer-info h4 {
      margin-bottom: 5px;
      font-size: ${isPOS ? '11px' : '14px'};
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${isPOS ? '10px' : '20px'};
    }
    .items-table th {
      background: #1a1a1a;
      color: white;
      padding: ${isPOS ? '6px 4px' : '10px 8px'};
      text-align: left;
      font-weight: 500;
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .items-table td {
      padding: ${isPOS ? '6px 4px' : '10px 8px'};
      border-bottom: 1px solid #eee;
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .items-table .text-right {
      text-align: right;
    }
    .items-table .item-name {
      max-width: ${isPOS ? '120px' : '200px'};
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .totals {
      margin-left: auto;
      width: ${isPOS ? '100%' : '250px'};
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: ${isPOS ? '4px 0' : '8px 0'};
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .totals-row.total {
      border-top: 2px solid #1a1a1a;
      padding-top: ${isPOS ? '8px' : '12px'};
      margin-top: ${isPOS ? '5px' : '8px'};
      font-size: ${isPOS ? '13px' : '16px'};
      font-weight: bold;
    }
    .totals-row.due {
      color: #dc2626;
    }
    .footer {
      margin-top: ${isPOS ? '15px' : '30px'};
      padding-top: ${isPOS ? '10px' : '20px'};
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: ${isPOS ? '9px' : '11px'};
    }
    .notes {
      margin-top: ${isPOS ? '10px' : '20px'};
      padding: ${isPOS ? '8px' : '15px'};
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      font-size: ${isPOS ? '10px' : '12px'};
    }
    .signature {
      margin-top: ${isPOS ? '15px' : '30px'};
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #1a1a1a;
      margin-top: ${isPOS ? '30px' : '60px'};
      padding-top: 5px;
      font-size: ${isPOS ? '9px' : '11px'};
    }
    .thank-you {
      text-align: center;
      margin-top: ${isPOS ? '15px' : '30px'};
      font-size: ${isPOS ? '12px' : '16px'};
      font-weight: 600;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .invoice {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      ${template.showLogo && data.business.logo ? `<img src="${data.business.logo}" alt="Logo" class="logo" />` : ''}
      <div class="business-name">
        ${isBangla && data.business.nameBn ? data.business.nameBn : data.business.name}
      </div>
      ${data.business.address ? `<div class="business-info">${data.business.address}</div>` : ''}
      ${data.business.phone ? `<div class="business-info">${isBangla ? 'ফোন' : 'Phone'}: ${data.business.phone}</div>` : ''}
      ${data.business.email ? `<div class="business-info">${data.business.email}</div>` : ''}
    </div>

    <!-- Invoice Title -->
    <div class="invoice-title">
      ${isBangla ? 'ইনভয়েস' : 'INVOICE'}
    </div>

    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <div>
        <div class="label">${isBangla ? 'ইনভয়েস নম্বর' : 'Invoice No'}</div>
        <div class="value">${data.invoiceNo}</div>
      </div>
      <div>
        <div class="label">${isBangla ? 'তারিখ' : 'Date'}</div>
        <div class="value">${formatDate(data.date)}</div>
      </div>
      ${data.dueDate ? `
      <div>
        <div class="label">${isBangla ? 'বকেয়া তারিখ' : 'Due Date'}</div>
        <div class="value">${formatDate(data.dueDate)}</div>
      </div>
      ` : ''}
    </div>

    <!-- Customer Info -->
    ${data.customer ? `
    <div class="customer-info">
      <h4>${isBangla ? 'গ্রাহক' : 'Bill To'}:</h4>
      <div><strong>${data.customer.name}</strong></div>
      ${data.customer.phone ? `<div>${isBangla ? 'ফোন' : 'Phone'}: ${data.customer.phone}</div>` : ''}
      ${data.customer.address ? `<div>${data.customer.address}</div>` : ''}
    </div>
    ` : ''}

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="item-name">${isBangla ? 'পণ্য' : 'Item'}</th>
          <th class="text-right">${isBangla ? 'পরিমাণ' : 'Qty'}</th>
          <th class="text-right">${isBangla ? 'দর' : 'Price'}</th>
          ${!isPOS ? `<th class="text-right">${isBangla ? 'ছাড়' : 'Disc'}</th>` : ''}
          <th class="text-right">${isBangla ? 'মোট' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
        <tr>
          <td class="item-name">${isBangla && item.nameBn ? item.nameBn : item.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          ${!isPOS ? `<td class="text-right">${item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>` : ''}
          <td class="text-right">${formatCurrency(item.total)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span>${isBangla ? 'উপমোট' : 'Subtotal'}:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.discount > 0 ? `
      <div class="totals-row">
        <span>${isBangla ? 'ছাড়' : 'Discount'}:</span>
        <span>-${formatCurrency(data.discount)}</span>
      </div>
      ` : ''}
      ${data.tax > 0 ? `
      <div class="totals-row">
        <span>${isBangla ? 'ট্যাক্স' : 'Tax'}:</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>${isBangla ? 'সর্বমোট' : 'Total'}:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
      ${data.paidAmount > 0 ? `
      <div class="totals-row">
        <span>${isBangla ? 'পরিশোধ' : 'Paid'}:</span>
        <span>${formatCurrency(data.paidAmount)}</span>
      </div>
      ` : ''}
      ${data.dueAmount > 0 ? `
      <div class="totals-row due">
        <span>${isBangla ? 'বকেয়া' : 'Due'}:</span>
        <span>${formatCurrency(data.dueAmount)}</span>
      </div>
      ` : ''}
    </div>

    <!-- Notes -->
    ${data.notes ? `
    <div class="notes">
      <strong>${isBangla ? 'নোট' : 'Notes'}:</strong> ${data.notes}
    </div>
    ` : ''}

    <!-- Signature -->
    ${template.showSignature && !isPOS ? `
    <div class="signature">
      <div class="signature-box">
        <div class="signature-line">${isBangla ? 'গ্রাহকের স্বাক্ষর' : 'Customer Signature'}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">${isBangla ? 'অনুমোদিত স্বাক্ষর' : 'Authorized Signature'}</div>
      </div>
    </div>
    ` : ''}

    <!-- Thank You -->
    <div class="thank-you">
      ${isBangla ? 'ধন্যবাদ আপনার সাথে ব্যবসা করার জন্য!' : 'Thank you for your business!'}
    </div>

    <!-- Footer -->
    ${data.footer ? `
    <div class="footer">
      ${data.footer}
    </div>
    ` : ''}
  </div>
</body>
</html>
`;
}

/**
 * Generate invoice data from sale
 */
export async function getInvoiceData(saleId: string): Promise<InvoiceData | null> {
  try {
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          where: { deletedAt: null },
        },
        party: true,
        business: {
          select: {
            name: true,
            nameBn: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
            currency: true,
            invoiceFooter: true,
          },
        },
      },
    });

    if (!sale) return null;

    return {
      invoiceNo: sale.invoiceNo,
      date: sale.createdAt,
      business: {
        name: sale.business.name,
        nameBn: sale.business.nameBn || undefined,
        address: sale.business.address || undefined,
        phone: sale.business.phone || undefined,
        email: sale.business.email || undefined,
        logo: sale.business.logo || undefined,
        currency: sale.business.currency,
      },
      customer: sale.party ? {
        name: sale.party.name,
        phone: sale.party.phone || undefined,
        address: sale.party.address || undefined,
        email: sale.party.email || undefined,
      } : undefined,
      items: sale.items.map(item => ({
        name: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      notes: sale.notes || undefined,
      footer: sale.business.invoiceFooter || undefined,
    };
  } catch (error) {
    console.error('Error getting invoice data:', error);
    return null;
  }
}

/**
 * Get default invoice template for a business
 */
export async function getInvoiceTemplate(businessId: string): Promise<InvoiceTemplate> {
  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        invoicePaperSize: true,
        invoiceLanguage: true,
        logo: true,
      },
    });

    return {
      name: 'Default',
      paperSize: (business?.invoicePaperSize as InvoiceTemplate['paperSize']) || 'A4',
      language: (business?.invoiceLanguage as InvoiceTemplate['language']) || 'bn',
      showLogo: !!business?.logo,
      showTaxDetails: true,
      showPaymentTerms: true,
      showSignature: true,
    };
  } catch {
    return {
      name: 'Default',
      paperSize: 'A4',
      language: 'bn',
      showLogo: false,
      showTaxDetails: true,
      showPaymentTerms: true,
      showSignature: true,
    };
  }
}

/**
 * Generate print-ready HTML for invoice
 */
export async function generatePrintableInvoice(
  saleId: string,
  templateOverride?: Partial<InvoiceTemplate>
): Promise<string | null> {
  const invoiceData = await getInvoiceData(saleId);
  if (!invoiceData) return null;

  const template = {
    ...(await getInvoiceTemplate(invoiceData.business.name)), // Use business context
    ...templateOverride,
  };

  return generateInvoiceHTML(invoiceData, template);
}
