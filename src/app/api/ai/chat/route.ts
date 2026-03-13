// Hello Khata - AI Chat Orchestrator
// POST /api/ai/chat - Main AI endpoint with intent detection, confirmation flow, and ERP integration
// PRODUCTION-READY with comprehensive security and error handling

import { NextRequest, NextResponse } from 'next/server';
import { parseIntent } from '@/lib/ai/intent-parser';
import { ERPApiClient, createERPClient } from '@/lib/ai/erp-client';
import { generateWithFallback, generateSmartFallback } from '@/lib/ai/ollama-client';
import { 
  repairAIResponse, 
  buildResponse, 
  buildClarificationResponse,
  buildConfirmationResponse,
  buildTable,
  formatCurrency,
  wrapApiResponse,
} from '@/lib/ai/response-validator';
import { 
  validateInput, 
  buildSafeErrorResponse, 
  logSafeError,
  checkRateLimit,
} from '@/lib/ai/safe-response';
import type { 
  AIChatResponse, 
  ActionType, 
  Item, 
  Party, 
  ExpenseCategory,
  DashboardStats,
  Sale,
  LowStockItem,
} from '@/lib/ai/types';

// ============================================================
// SESSION STORAGE FOR PENDING ACTIONS
// In production, use Redis with TTL
// ============================================================

interface PendingAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  timestamp: number;
  businessId: string;  // For security validation
  expiresAt: number;   // Expiration timestamp
}

const pendingActions = new Map<string, PendingAction>();
const PENDING_ACTION_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired actions periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, action] of pendingActions.entries()) {
    if (action.expiresAt < now) {
      pendingActions.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================

function buildSystemPrompt(
  context: string,
  language: 'en' | 'bn',
  responseType: 'json' | 'text' = 'json'
): string {
  const jsonFormat = `{
  "answer": "Your answer here",
  "action": { "type": "query|none", "parameters": {} },
  "tables": []
}`;

  if (language === 'bn') {
    return `তুমি একজন বাংলাদেশি ব্যবসায়িক সহায়ক AI অ্যাসিস্ট্যান্ট।

বর্তমান ব্যবসার তথ্য:
${context}

স্ট্রিক্ট নিয়মাবলী:
1. শুধুমাত্র প্রদত্ত তথ্য থেকে সংখ্যা ব্যবহার করো - কখনো কাল্পনিক সংখ্যা দিও না
2. সংক্ষিপ্ত এবং স্পষ্ট উত্তর দাও (২-৪ বাক্যে)
3. ব্যবসায়িক অন্তর্দৃষ্টি প্রদান করো
4. বাংলায় উত্তর দাও
5. টাকার জন্য ৳ চিহ্ন ব্যবহার করো
6. প্রশ্নের উত্তর তথ্যে না থাকলে স্পষ্টভাবে জানাও
${responseType === 'json' ? `
7. তোমার উত্তর অবশ্যই এই JSON ফরম্যাটে হতে হবে (অন্য কিছু নয়):
${jsonFormat}
` : ''}`;
  }

  return `You are a smart business assistant AI for Bangladeshi small and medium businesses.

Current Business Data:
${context}

STRICT RULES:
1. Use ONLY numbers from the provided data - NEVER invent, estimate, or guess any numbers
2. Be concise but helpful (2-4 sentences for simple queries)
3. Provide business insights when relevant
4. Respond in English
5. Use ৳ symbol for currency (Bangladeshi Taka)
6. If the answer is not in the provided data, clearly state that
7. Do not add any commentary outside the JSON structure
${responseType === 'json' ? `
8. Your response MUST be valid JSON in this exact format (nothing else):
${jsonFormat}
` : ''}`;
}

// ============================================================
// CONTEXT FORMATTER FOR LLM
// ============================================================

function formatContextForLLM(
  stats: DashboardStats | null,
  items: Item[],
  parties: Party[],
  sales: Sale[],
  expenseCategories: ExpenseCategory[],
  lowStock: LowStockItem[],
  language: 'en' | 'bn'
): string {
  const cur = (n: number) => formatCurrency(n);
  const sections: string[] = [];
  
  // Stats section
  if (stats) {
    sections.push(language === 'bn' ? `
আজকের পারফরম্যান্স:
- বিক্রি: ${cur(stats.todaySales)} (${stats.salesGrowth > 0 ? '+' : ''}${stats.salesGrowth}%)
- মুনাফা: ${cur(stats.todayProfit)}
- খরচ: ${cur(stats.todayExpenses)}

মাসিক সারসংক্ষেপ:
- পাওনা (গ্রাহক): ${cur(stats.receivable)}
- দেনা (সাপ্লায়ার): ${cur(stats.payable)}
- মোট পণ্য: ${stats.totalStock}
- কম স্টক: ${stats.lowStockItems}টি পণ্য
- স্টক মূল্য: ${cur(stats.stockValue)}
` : `
Today's Performance:
- Sales: ${cur(stats.todaySales)} (${stats.salesGrowth > 0 ? '+' : ''}${stats.salesGrowth}%)
- Profit: ${cur(stats.todayProfit)}
- Expenses: ${cur(stats.todayExpenses)}

Monthly Summary:
- Receivable: ${cur(stats.receivable)}
- Payable: ${cur(stats.payable)}
- Total Items: ${stats.totalStock}
- Low Stock: ${stats.lowStockItems} items
- Stock Value: ${cur(stats.stockValue)}
`);
  }

  // Items section
  if (items.length > 0) {
    sections.push(language === 'bn' ? `
উপলব্ধ পণ্য (প্রথম ১৫টি):
${items.slice(0, 15).map(i => `- ${i.nameBn || i.name}: স্টক ${i.currentStock}, দাম ${cur(i.sellingPrice)}`).join('\n')}
` : `
Available Items (first 15):
${items.slice(0, 15).map(i => `- ${i.name}: Stock ${i.currentStock}, Price ${cur(i.sellingPrice)}`).join('\n')}
`);
  }

  // Low stock section
  if (lowStock.length > 0) {
    sections.push(language === 'bn' ? `
কম স্টকের পণ্য:
${lowStock.slice(0, 8).map(i => `- ${i.nameBn || i.name}: বর্তমান ${i.currentStock}, ন্যূনতম ${i.minStock}`).join('\n')}
` : `
Low Stock Items:
${lowStock.slice(0, 8).map(i => `- ${i.name}: Current ${i.currentStock}, Minimum ${i.minStock}`).join('\n')}
`);
  }

  // Parties section
  if (parties.length > 0) {
    const customers = parties.filter(p => p.type === 'customer' || p.type === 'both');
    const suppliers = parties.filter(p => p.type === 'supplier' || p.type === 'both');
    const receivablesList = customers.filter(p => p.currentBalance > 0).slice(0, 6);
    
    sections.push(language === 'bn' ? `
গ্রাহক: ${customers.length}জন
সাপ্লায়ার: ${suppliers.length}জন
গ্রাহকদের মধ্যে বকেয়া:
${receivablesList.length > 0 
  ? receivablesList.map(p => `- ${p.name}: ${cur(p.currentBalance)}`).join('\n')
  : '- কোন বকেয়া নেই'}
` : `
Customers: ${customers.length}
Suppliers: ${suppliers.length}
Customer Receivables:
${receivablesList.length > 0 
  ? receivablesList.map(p => `- ${p.name}: ${cur(p.currentBalance)}`).join('\n')
  : '- No outstanding'}
`);
  }

  // Recent sales
  if (sales.length > 0) {
    sections.push(language === 'bn' ? `
সাম্প্রতিক বিক্রি (গত ৫টি):
${sales.slice(0, 5).map(s => `- ${s.invoiceNo}: ${cur(s.total)} (${s.items?.map(i => `${i.itemName} x${i.quantity}`).join(', ') || 'N/A'})`).join('\n')}
` : `
Recent Sales (last 5):
${sales.slice(0, 5).map(s => `- ${s.invoiceNo}: ${cur(s.total)} (${s.items?.map(i => `${i.itemName} x${i.quantity}`).join(', ') || 'N/A'})`).join('\n')}
`);
  }

  // Expense categories
  if (expenseCategories.length > 0) {
    sections.push(language === 'bn' ? `
খরচের ক্যাটাগরি:
${expenseCategories.slice(0, 8).map(c => `- ${c.nameBn || c.name}`).join('\n')}
` : `
Expense Categories:
${expenseCategories.slice(0, 8).map(c => `- ${c.name}`).join('\n')}
`);
  }

  return sections.join('\n');
}

// ============================================================
// TABLE GENERATION
// ============================================================

function buildTablesForQuery(
  query: string,
  items: Item[],
  parties: Party[],
  sales: Sale[],
  lowStock: LowStockItem[],
  language: 'en' | 'bn'
): Array<{ headers: string[]; rows: string[][] }> | undefined {
  const lower = query.toLowerCase();
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  
  // Top selling items table
  if (lower.includes('top') || lower.includes('best') || lower.includes('সেরা') || 
      lower.includes('most') || lower.includes('সবচেয়ে')) {
    const itemSales = new Map<string, { name: string; qty: number; total: number }>();
    
    for (const sale of sales) {
      for (const item of sale.items || []) {
        const existing = itemSales.get(item.itemName) || { name: item.itemName, qty: 0, total: 0 };
        existing.qty += item.quantity;
        existing.total += item.total;
        itemSales.set(item.itemName, existing);
      }
    }
    
    const topItems = Array.from(itemSales.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
    
    if (topItems.length > 0) {
      tables.push(buildTable(
        language === 'bn' ? ['পণ্য', 'বিক্রি (টাকা)', 'পরিমাণ'] : ['Product', 'Sales', 'Qty'],
        topItems.map(i => ({ name: i.name, total: formatCurrency(i.total), qty: String(i.qty) })),
        { name: 'name', total: 'total', qty: 'qty' }
      ));
    }
  }
  
  // Low stock table
  if ((lower.includes('low') && (lower.includes('stock') || lower.includes('স্টক'))) ||
      lower.includes('কম স্টক') || lower.includes('shortage')) {
    if (lowStock.length > 0) {
      tables.push(buildTable(
        language === 'bn' ? ['পণ্য', 'বর্তমান', 'ন্যূনতম', 'দাম'] : ['Product', 'Current', 'Min', 'Price'],
        lowStock.slice(0, 10).map(i => ({
          name: i.nameBn || i.name,
          current: String(i.currentStock),
          min: String(i.minStock),
          price: formatCurrency(i.sellingPrice),
        })),
        { name: 'name', current: 'current', min: 'min', price: 'price' }
      ));
    }
  }
  
  // Receivables table
  if (lower.includes('receivable') || lower.includes('পাওনা') || lower.includes('due') || 
      lower.includes('বকেয়া') || lower.includes('outstanding') || lower.includes('collect')) {
    const receivables = parties.filter(p => p.currentBalance > 0).slice(0, 10);
    if (receivables.length > 0) {
      tables.push(buildTable(
        language === 'bn' ? ['গ্রাহক', 'বকেয়া'] : ['Customer', 'Outstanding'],
        receivables.map(p => ({
          name: p.name,
          balance: formatCurrency(p.currentBalance),
        })),
        { name: 'name', balance: 'balance' }
      ));
    }
  }
  
  // Payables table
  if (lower.includes('payable') || lower.includes('দেনা') || lower.includes('owe') || 
      lower.includes('supplier pay')) {
    const payables = parties.filter(p => p.currentBalance < 0).slice(0, 10);
    if (payables.length > 0) {
      tables.push(buildTable(
        language === 'bn' ? ['সাপ্লায়ার', 'দেনা'] : ['Supplier', 'Amount'],
        payables.map(p => ({
          name: p.name,
          balance: formatCurrency(Math.abs(p.currentBalance)),
        })),
        { name: 'name', balance: 'balance' }
      ));
    }
  }
  
  // Sales summary table
  if ((lower.includes('sales') || lower.includes('বিক্রি')) && 
      (lower.includes('summary') || lower.includes('সারসংক্ষেপ') || lower.includes('breakdown'))) {
    if (sales.length > 0) {
      tables.push(buildTable(
        language === 'bn' ? ['তারিখ', 'ইনভয়েস', 'মোট', 'মুনাফা'] : ['Date', 'Invoice', 'Total', 'Profit'],
        sales.slice(0, 10).map(s => ({
          date: new Date(s.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US'),
          invoice: s.invoiceNo,
          total: formatCurrency(s.total),
          profit: formatCurrency(s.profit),
        })),
        { date: 'date', invoice: 'invoice', total: 'total', profit: 'profit' }
      ));
    }
  }
  
  return tables.length > 0 ? tables : undefined;
}

// ============================================================
// ACTION EXECUTOR
// ============================================================

async function executeAction(
  erpClient: ERPApiClient,
  actionType: ActionType,
  parameters: Record<string, unknown>,
  language: 'en' | 'bn'
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (actionType) {
      case 'create_sale': {
        // Validate required parameters
        if (!parameters.itemId) {
          return {
            success: false,
            message: language === 'bn' ? 'পণ্য আইডি প্রয়োজন' : 'Item ID is required',
          };
        }
        
        const result = await erpClient.createSale({
          partyId: parameters.partyId as string | undefined,
          items: [{
            itemId: parameters.itemId as string,
            quantity: (parameters.quantity as number) || 1,
            unitPrice: parameters.unitPrice as number | undefined,
          }],
          paymentMethod: (parameters.paymentMethod as 'cash' | 'credit') || 'cash',
          paidAmount: parameters.paidAmount as number | undefined,
          notes: parameters.notes as string | undefined,
        });
        
        if (result.success && result.data) {
          const sale = result.data;
          return {
            success: true,
            message: language === 'bn' 
              ? `বিক্রি সফল! ইনভয়েস: ${sale.invoiceNo}, মোট: ${formatCurrency(sale.total)}`
              : `Sale created! Invoice: ${sale.invoiceNo}, Total: ${formatCurrency(sale.total)}`,
            data: sale,
          };
        }
        return { 
          success: false, 
          message: result.error?.message || (language === 'bn' ? 'বিক্রি তৈরি ব্যর্থ' : 'Failed to create sale') 
        };
      }
      
      case 'create_expense': {
        if (!parameters.amount || !parameters.expenseCategoryId) {
          return {
            success: false,
            message: language === 'bn' ? 'খরচের পরিমাণ ও ক্যাটাগরি প্রয়োজন' : 'Amount and category are required',
          };
        }
        
        const result = await erpClient.createExpense({
          categoryId: parameters.expenseCategoryId as string,
          amount: parameters.amount as number,
          description: (parameters.description as string) || '',
          accountId: parameters.accountId as string | undefined,
        });
        
        if (result.success && result.data) {
          return {
            success: true,
            message: language === 'bn'
              ? `খরচ সফলভাবে রেকর্ড হয়েছে: ${formatCurrency(parameters.amount as number)}`
              : `Expense recorded: ${formatCurrency(parameters.amount as number)}`,
            data: result.data,
          };
        }
        return { 
          success: false, 
          message: result.error?.message || (language === 'bn' ? 'খরচ রেকর্ড ব্যর্থ' : 'Failed to record expense') 
        };
      }
      
      case 'create_payment': {
        if (!parameters.partyId || !parameters.amount) {
          return {
            success: false,
            message: language === 'bn' ? 'গ্রাহক ও পরিমাণ প্রয়োজন' : 'Party and amount are required',
          };
        }
        
        const result = await erpClient.createPayment({
          partyId: parameters.partyId as string,
          type: (parameters.paymentType as 'received' | 'paid') || 'received',
          amount: parameters.amount as number,
          mode: (parameters.paymentMethod as 'cash' | 'card' | 'mobile_banking') || 'cash',
          notes: parameters.notes as string | undefined,
        });
        
        if (result.success && result.data) {
          return {
            success: true,
            message: language === 'bn'
              ? `পেমেন্ট সফল: ${formatCurrency(parameters.amount as number)}`
              : `Payment recorded: ${formatCurrency(parameters.amount as number)}`,
            data: result.data,
          };
        }
        return { 
          success: false, 
          message: result.error?.message || (language === 'bn' ? 'পেমেন্ট রেকর্ড ব্যর্থ' : 'Failed to record payment') 
        };
      }
      
      case 'create_party': {
        if (!parameters.partyName) {
          return {
            success: false,
            message: language === 'bn' ? 'নাম প্রয়োজন' : 'Name is required',
          };
        }
        
        const result = await erpClient.createParty({
          name: parameters.partyName as string,
          type: (parameters.partyType as 'customer' | 'supplier') || 'customer',
          phone: parameters.phone as string | undefined,
          address: parameters.address as string | undefined,
        });
        
        if (result.success && result.data) {
          const typeName = parameters.partyType === 'supplier' 
            ? (language === 'bn' ? 'সাপ্লায়ার' : 'supplier')
            : (language === 'bn' ? 'গ্রাহক' : 'customer');
          return {
            success: true,
            message: language === 'bn'
              ? `নতুন ${typeName} "${parameters.partyName}" যোগ হয়েছে`
              : `New ${typeName} "${parameters.partyName}" added successfully`,
            data: result.data,
          };
        }
        return { 
          success: false, 
          message: result.error?.message || (language === 'bn' ? 'পার্টি তৈরি ব্যর্থ' : 'Failed to create party') 
        };
      }
      
      case 'create_item': {
        if (!parameters.itemName) {
          return {
            success: false,
            message: language === 'bn' ? 'পণ্যের নাম প্রয়োজন' : 'Item name is required',
          };
        }
        
        const result = await erpClient.createItem({
          name: parameters.itemName as string,
          sellingPrice: (parameters.sellingPrice as number) || 0,
          costPrice: (parameters.costPrice as number) || 0,
          currentStock: (parameters.currentStock as number) || 0,
          unit: (parameters.unit as string) || 'pcs',
        });
        
        if (result.success && result.data) {
          return {
            success: true,
            message: language === 'bn'
              ? `নতুন পণ্য "${parameters.itemName}" যোগ হয়েছে`
              : `New item "${parameters.itemName}" added successfully`,
            data: result.data,
          };
        }
        return { 
          success: false, 
          message: result.error?.message || (language === 'bn' ? 'পণ্য তৈরি ব্যর্থ' : 'Failed to create item') 
        };
      }
      
      default:
        return { 
          success: false, 
          message: language === 'bn' ? 'অজানা কাজ' : 'Unknown action type' 
        };
    }
  } catch (error) {
    logSafeError('Action execution', error);
    return { 
      success: false, 
      message: language === 'bn' ? 'কাজ সম্পাদনে সমস্যা হয়েছে' : 'Failed to execute action' 
    };
  }
}

// ============================================================
// MAIN POST HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Get businessId from header (preferred) or body
    const headerBusinessId = request.headers.get('x-business-id');

    // Parse request body safely
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        buildSafeErrorResponse('missing_message', 'en'),
        { status: 400 }
      );
    }

    // Validate and sanitize input
    // Accept both 'message' and 'query' as the message input
    // Accept businessId from header (preferred) or body
    const validation = validateInput({
      businessId: headerBusinessId || body.businessId as string | undefined,
      userId: body.userId as string | undefined,
      message: (body.message || body.query) as string | undefined,
      sessionId: body.sessionId as string | undefined,
      confirm: body.confirm as boolean | undefined,
      language: body.language as string | undefined,
    });

    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    const { businessId, userId, message, sessionId, confirm, language } = validation.sanitized;
    
    // Rate limiting
    const rateLimitKey = `${businessId}:${userId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        buildSafeErrorResponse('unknown_error', language),
        { status: 429 }
      );
    }
    
    // Initialize ERP Client
    const erpClient = createERPClient(businessId, userId);
    
    // ============================================================
    // HANDLE CONFIRMATION FLOW
    // ============================================================
    
    const pendingAction = pendingActions.get(sessionId);
    
    if (confirm) {
      // User is trying to confirm an action
      if (!pendingAction) {
        return NextResponse.json(
          buildSafeErrorResponse('no_pending_action', language)
        );
      }
      
      // Security: Verify action belongs to this business
      if (pendingAction.businessId !== businessId) {
        logSafeError('Cross-business action attempt', { sessionId, businessId });
        pendingActions.delete(sessionId);
        return NextResponse.json(
          buildSafeErrorResponse('cross_business_denied', language)
        );
      }
      
      // Check if action expired
      if (pendingAction.expiresAt < Date.now()) {
        pendingActions.delete(sessionId);
        return NextResponse.json(
          buildSafeErrorResponse('action_expired', language)
        );
      }
      
      // Execute the action
      const result = await executeAction(erpClient, pendingAction.type, pendingAction.parameters, language);
      pendingActions.delete(sessionId);
      
      return NextResponse.json(
        wrapApiResponse(buildResponse(
          result.message,
          result.success ? pendingAction.type : 'none',
          result.data || {}
        ))
      );
    }
    
    // Clear expired or cancelled pending action
    if (pendingAction) {
      const userDeclined = message.toLowerCase() === 'no' || 
                          message.toLowerCase() === 'না' ||
                          message.toLowerCase() === 'cancel' ||
                          message.toLowerCase() === 'বাতিল';
      
      if (userDeclined || pendingAction.expiresAt < Date.now()) {
        pendingActions.delete(sessionId);
      }
    }
    
    // ============================================================
    // FETCH CONTEXT DATA FROM ERP APIs
    // ============================================================
    
    let stats: DashboardStats | null = null;
    let items: Item[] = [];
    let parties: Party[] = [];
    let sales: Sale[] = [];
    let expenseCategories: ExpenseCategory[] = [];
    let lowStock: LowStockItem[] = [];
    
    try {
      const [statsResult, itemsResult, partiesResult, salesResult, expenseCatsResult, lowStockResult] = await Promise.all([
        erpClient.getDashboardStats(),
        erpClient.getItems(undefined, 50),
        erpClient.getParties(),
        erpClient.getSales({ period: 'last_30_days' }),
        erpClient.getExpenseCategories(),
        erpClient.getLowStockItems(),
      ]);
      
      items = itemsResult.success ? itemsResult.data || [] : [];
      parties = partiesResult.success ? partiesResult.data || [] : [];
      sales = salesResult.success ? salesResult.data || [] : [];
      expenseCategories = expenseCatsResult.success ? expenseCatsResult.data || [] : [];
      lowStock = lowStockResult.success ? lowStockResult.data || [] : [];
      stats = statsResult.success ? statsResult.data : null;
    } catch (erpError) {
      logSafeError('ERP API fetch', erpError);
      return NextResponse.json(
        buildSafeErrorResponse('erp_unavailable', language)
      );
    }
    
    // ============================================================
    // PARSE INTENT
    // ============================================================
    
    const intentResult = parseIntent(message, { items, parties, expenseCategories });
    
    // ============================================================
    // HANDLE ACTION INTENTS
    // ============================================================
    
    if (intentResult.intent === 'create_sale' || 
        intentResult.intent === 'create_expense' || 
        intentResult.intent === 'create_payment' ||
        intentResult.intent === 'create_party' ||
        intentResult.intent === 'create_item') {
      
      // Check for missing required fields
      if (intentResult.missingFields.length > 0) {
        return NextResponse.json(
          wrapApiResponse(buildClarificationResponse(
            intentResult.clarifyingQuestion || 'Please provide more details.',
            intentResult.clarifyingQuestionBn || 'আরো তথ্য দিন।',
            intentResult.missingFields,
            language
          ))
        );
      }
      
      const actionType = intentResult.intent as ActionType;
      const params: Record<string, unknown> = { ...intentResult.entities };
      
      // Additional validation for sale
      if (intentResult.intent === 'create_sale') {
        if (!intentResult.entities.itemId && intentResult.entities.itemName) {
          // Try to find item
          const itemSearch = await erpClient.getItems(intentResult.entities.itemName);
          if (itemSearch.success && itemSearch.data && itemSearch.data.length > 0) {
            params.itemId = itemSearch.data[0].id;
            params.itemName = itemSearch.data[0].name;
            params.unitPrice = itemSearch.data[0].sellingPrice;
          } else {
            return NextResponse.json(
              wrapApiResponse(buildClarificationResponse(
                `Item "${intentResult.entities.itemName}" not found. Available: ${items.slice(0, 5).map(i => i.name).join(', ')}...`,
                `পণ্য "${intentResult.entities.itemName}" পাওয়া যায়নি। উপলব্ধ: ${items.slice(0, 5).map(i => i.nameBn || i.name).join(', ')}...`,
                ['itemId'],
                language
              ))
            );
          }
        }
        
        // Set payment amounts
        if (!params.paidAmount && params.unitPrice) {
          const total = (params.quantity as number || 1) * (params.unitPrice as number);
          params.paidAmount = params.paymentMethod === 'credit' ? 0 : total;
        }
      }
      
      // Additional validation for expense
      if (intentResult.intent === 'create_expense') {
        if (!params.expenseCategoryId && expenseCategories.length > 0) {
          // Default to first category
          params.expenseCategoryId = expenseCategories[0].id;
          params.expenseCategory = expenseCategories[0].name;
        }
      }
      
      // Store pending action with security context
      pendingActions.set(sessionId, {
        type: actionType,
        parameters: params,
        timestamp: Date.now(),
        businessId,
        expiresAt: Date.now() + PENDING_ACTION_TTL_MS,
      });
      
      // Return confirmation request
      const summary = language === 'bn' 
        ? intentResult.clarifyingQuestionBn || 'এই কাজটি নিশ্চিত করতে চান?'
        : intentResult.clarifyingQuestion || 'Do you want to confirm this action?';
      
      return NextResponse.json(
        wrapApiResponse(buildConfirmationResponse(summary, summary, actionType, params, language))
      );
    }
    
    // ============================================================
    // HANDLE QUERY INTENT
    // ============================================================
    
    if (intentResult.intent === 'query') {
      const contextString = formatContextForLLM(stats, items, parties, sales, expenseCategories, lowStock, language);
      const systemPrompt = buildSystemPrompt(contextString, language, 'json');
      
      let llmResponse: string;
      try {
        llmResponse = await generateWithFallback(systemPrompt, message, language);
      } catch (llmError) {
        logSafeError('LLM generation', llmError);
        
        // Use smart fallback with context data
        const fallbackAnswer = generateSmartFallback(message, {
          todaySales: stats?.todaySales || 0,
          todayProfit: stats?.todayProfit || 0,
          todayExpenses: stats?.todayExpenses || 0,
          receivable: stats?.receivable || 0,
          payable: stats?.payable || 0,
          totalItems: stats?.totalStock || 0,
          lowStockItems: stats?.lowStockItems || 0,
          stockValue: stats?.stockValue || 0,
        }, language === 'bn');
        
        return NextResponse.json(
          wrapApiResponse(buildResponse(fallbackAnswer, 'query', { period: intentResult.entities.period }))
        );
      }
      
      // Validate and repair LLM response
      const validatedResponse = repairAIResponse(llmResponse, 'Query processed.', 'query');
      
      // Add tables if relevant
      const tables = buildTablesForQuery(message, items, parties, sales, lowStock, language);
      if (tables) {
        validatedResponse.tables = tables;
      }
      
      return NextResponse.json(wrapApiResponse(validatedResponse));
    }
    
    // ============================================================
    // HANDLE INFORMATIVE INTENT
    // ============================================================
    
    const contextString = formatContextForLLM(stats, items, parties, sales, expenseCategories, lowStock, language);
    const systemPrompt = buildSystemPrompt(contextString, language, 'json');
    
    let llmResponse: string;
    try {
      llmResponse = await generateWithFallback(systemPrompt, message, language);
    } catch (llmError) {
      logSafeError('LLM generation', llmError);
      return NextResponse.json(
        wrapApiResponse(buildResponse(
          language === 'bn' 
            ? 'আমি আপনার প্রশ্ন বুঝতে পারিনি। আরো তথ্য দিন।'
            : 'I could not understand your question. Please provide more details.',
          'none',
          {}
        ))
      );
    }
    
    const validatedResponse = repairAIResponse(llmResponse, 'Message processed.', 'none');
    return NextResponse.json(wrapApiResponse(validatedResponse));
    
  } catch (error) {
    logSafeError('AI Chat handler', error);
    return NextResponse.json(
      buildSafeErrorResponse('unknown_error', 'en'),
      { status: 500 }
    );
  }
}
