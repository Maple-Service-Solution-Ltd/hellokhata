// Hello Khata OS - Quotation Type Definitions
// হ্যালো খাতা - কোটেশন টাইপ ডেফিনিশন

// ============================================
// Quotation Status Types
// ============================================

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

// ============================================
// Quotation Item Types
// ============================================

export interface QuotationItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: Date;
}

// ============================================
// Quotation Types
// ============================================

export interface Quotation {
  id: string;
  businessId: string;
  branchId?: string;
  quotationNo: string;
  partyId?: string;
  partyName?: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validityDate: Date;
  quotationDate: Date;
  status: QuotationStatus;
  notes?: string;
  convertedToSaleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Quotation Form Data Types
// ============================================

export interface QuotationFormData {
  partyId?: string;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  discount: number;
  tax: number;
  validityDate: string;
  quotationDate: string;
  notes?: string;
}

// ============================================
// Quotation Filter Types
// ============================================

export interface QuotationFilter {
  status?: QuotationStatus;
  partyId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  branchId?: string;
}

// ============================================
// Quotation Summary Types
// ============================================

export interface QuotationSummary {
  totalQuotations: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  rejectedCount: number;
  convertedCount: number;
  totalValue: number;
  acceptedValue: number;
  averageValue: number;
  conversionRate: number;
}

// ============================================
// Status Configuration
// ============================================

export const QUOTATION_STATUS_CONFIG: Record<QuotationStatus, {
  label: string;
  labelBn: string;
  variant: 'default' | 'warning' | 'success' | 'destructive' | 'indigo';
}> = {
  draft: {
    label: 'Draft',
    labelBn: 'খসড়া',
    variant: 'default',
  },
  sent: {
    label: 'Sent',
    labelBn: 'প্রেরিত',
    variant: 'warning',
  },
  accepted: {
    label: 'Accepted',
    labelBn: 'গৃহীত',
    variant: 'success',
  },
  rejected: {
    label: 'Rejected',
    labelBn: 'প্রত্যাখ্যাত',
    variant: 'destructive',
  },
  converted: {
    label: 'Converted',
    labelBn: 'রূপান্তরিত',
    variant: 'indigo',
  },
};
