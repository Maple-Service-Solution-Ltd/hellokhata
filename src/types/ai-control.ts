// Hello Khata OS - AI Control Room Types
// AI-First Architecture Type Definitions

// Demo Workspace
export interface DemoData {
  customers: DemoCustomer[];
  items: DemoItem[];
  transactions: DemoTransaction[];
  insights: AIInsight[];
  healthScore: BusinessHealthScore;
}

export interface DemoCustomer {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  type: 'retail' | 'wholesale' | 'vip';
  outstanding: number;
  creditLimit: number;
  agingBuckets: AgingBuckets;
  riskScore: number;
  lastPurchase: Date;
  totalPurchases: number;
}

export interface DemoItem {
  id: string;
  name: string;
  nameBn: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  vipPrice?: number;
  margin: number;
  turnover: number;
  lastSold: Date | null;
  daysUnsold: number;
  capitalStuck: number;
}

export interface DemoTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'payment' | 'expense';
  date: Date;
  partyId: string;
  items: TransactionItem[];
  total: number;
  profit: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface TransactionItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Aging Buckets
export interface AgingBuckets {
  current: number;      // 0-30 days
  bucket31_60: number;  // 31-60 days
  bucket61_90: number;  // 61-90 days
  over90: number;       // 90+ days
}

// AI Insights
export interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'achievement' | 'suggestion';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  impact: 'high' | 'medium' | 'low';
  impactLabel: string;
  impactLabelBn: string;
  actionLabel: string;
  actionLabelBn: string;
  actionUrl: string;
  category: 'sales' | 'inventory' | 'credit' | 'cash' | 'profit';
  createdAt: Date;
}

// Business Health Score
export interface BusinessHealthScore {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'declining' | 'stable';
  components: HealthComponent[];
  lastUpdated: Date;
}

export interface HealthComponent {
  name: string;
  nameBn: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  suggestion: string;
  suggestionBn: string;
}

// AI Drawer
export interface AIDrawerTab {
  id: 'brief' | 'chat' | 'actions';
  label: string;
  labelBn: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tables?: DataTable[];
  actions?: SuggestedAction[];
}

export interface DataTable {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

export interface SuggestedAction {
  id: string;
  label: string;
  labelBn: string;
  action: () => void;
  icon?: string;
}

// Voice AI
export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export interface VoiceResult {
  id: string;
  query: string;
  answer: string;
  answerBn: string;
  data?: DataTable;
  actions: SuggestedAction[];
  timestamp: Date;
}

// Command Palette
export interface CommandItem {
  id: string;
  label: string;
  labelBn: string;
  shortcut?: string;
  icon: string;
  category: 'navigation' | 'action' | 'search';
  action: () => void;
  keywords?: string[];
}

// Credit Control
export interface CreditControlAlert {
  partyId: string;
  partyName: string;
  currentOutstanding: number;
  creditLimit: number;
  usagePercent: number;
  agingBuckets: AgingBuckets;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

// Dead Stock
export interface DeadStockItem {
  itemId: string;
  itemName: string;
  sku: string;
  stock: number;
  costPrice: number;
  capitalStuck: number;
  daysUnsold: number;
  category: '30-60' | '60-90' | '90+';
  lastSold: Date | null;
  suggestedAction: string;
}

// Bank Accounts
export interface BankAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_wallet';
  accountNumber?: string;
  bankName?: string;
  currentBalance: number;
  lastReconciled: Date | null;
  reconciliationGap: number;
}

export interface ReconciliationEntry {
  id: string;
  accountId: string;
  date: Date;
  statementBalance: number;
  systemBalance: number;
  difference: number;
  status: 'matched' | 'unmatched' | 'pending';
  notes?: string;
}

// Audit Trail
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export';
  entityType: 'sale' | 'item' | 'party' | 'expense' | 'payment' | 'user' | 'setting';
  entityId: string;
  entityName: string;
  changes: FieldChange[];
  timestamp: Date;
  ipAddress?: string;
}

export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

// Pricing Tiers
export interface PricingTier {
  id: string;
  name: string;
  nameBn: string;
  type: 'retail' | 'wholesale' | 'vip';
  discountPercent: number;
  minQuantity?: number;
  isActive: boolean;
}

export interface CustomerPricing {
  customerId: string;
  itemId: string;
  customPrice: number;
  validFrom: Date;
  validTo?: Date;
}

// Playbooks
export interface Playbook {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: 'collection' | 'inventory' | 'profit' | 'purchase';
  steps: PlaybookStep[];
  estimatedImpact: string;
  estimatedImpactBn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
}

export interface PlaybookStep {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  action: string;
  actionBn: string;
  isCompleted: boolean;
}

// Feature Gates
export type FeatureTier = 'free' | 'business' | 'pro' | 'ai';

export interface FeatureGate {
  feature: string;
  minTier: FeatureTier;
  label: string;
  labelBn: string;
}

// Branch
export interface Branch {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  phone: string;
  isActive: boolean;
  managerId?: string;
  createdAt: Date;
}
