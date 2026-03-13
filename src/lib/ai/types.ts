// AI Orchestrator Types

export type IntentType = 
  | 'query' 
  | 'create_sale' 
  | 'create_expense' 
  | 'create_payment' 
  | 'create_party' 
  | 'create_item'
  | 'update_sale'
  | 'update_party'
  | 'informative';

export type ActionType = 
  | 'query' 
  | 'create_sale' 
  | 'create_expense' 
  | 'create_payment' 
  | 'create_party' 
  | 'create_item'
  | 'need_clarification' 
  | 'confirm_action'
  | 'none';

export interface ExtractedEntities {
  // Date/time
  date?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days' | 'custom';
  
  // Items
  itemName?: string;
  itemId?: string;
  quantity?: number;
  unitPrice?: number;
  costPrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  unit?: string;
  
  // Parties
  partyName?: string;
  partyId?: string;
  partyType?: 'customer' | 'supplier';
  phone?: string;
  address?: string;
  
  // Financial
  amount?: number;
  paidAmount?: number;
  dueAmount?: number;
  discount?: number;
  
  // Payment
  paymentMethod?: 'cash' | 'credit' | 'card' | 'mobile_banking';
  paymentType?: 'received' | 'paid';
  
  // Expense
  expenseCategory?: string;
  expenseCategoryId?: string;
  description?: string;
  
  // Reference
  invoiceNo?: string;
  invoiceRef?: string;
  
  // Account
  accountId?: string;
  accountName?: string;
}

export interface IntentResult {
  intent: IntentType;
  entities: ExtractedEntities;
  confidence: number;
  missingFields: string[];
  clarifyingQuestion?: string;
  clarifyingQuestionBn?: string;
}

export interface AIChatRequest {
  userId: string;
  businessId: string;
  language: 'en' | 'bn';
  message: string;
  sessionId?: string;
  confirm?: boolean;
  previousAction?: PendingAction;
}

export interface PendingAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  confirmedAt?: string;
}

export interface AIChatResponse {
  answer: string;
  action: {
    type: ActionType;
    parameters: Record<string, unknown>;
  };
  tables?: Array<{
    headers: string[];
    rows: string[][];
  }>;
}

export interface ERPContext {
  businessId: string;
  userId: string;
  language: 'en' | 'bn';
  data: Record<string, unknown>;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

// ERP API Response types
export interface ERPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    messageBn?: string;
  };
}

export interface DashboardStats {
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  receivable: number;
  payable: number;
  totalStock: number;
  stockValue: number;
  lowStockItems: number;
  activeParties: number;
  salesGrowth: number;
}

export interface DailySales {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
  transactions: number;
}

export interface Item {
  id: string;
  name: string;
  nameBn?: string;
  currentStock: number;
  sellingPrice: number;
  costPrice: number;
  minStock: number;
  unit: string;
}

export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  currentBalance: number;
  phone?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  total: number;
  profit: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  party?: Party;
  items: SaleItem[];
}

export interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category?: { name: string };
}

export interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  nameBn?: string;
}

export interface TopSellingItem {
  itemId: string;
  itemName: string;
  quantity: number;
  total: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  nameBn?: string;
  currentStock: number;
  minStock: number;
  sellingPrice: number;
}
