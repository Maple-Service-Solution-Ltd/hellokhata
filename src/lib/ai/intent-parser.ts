// Intent and Entity Parser Module
// Extracts intent and entities from natural language queries
// PRODUCTION-READY with comprehensive entity extraction

import type { IntentResult, ExtractedEntities, Item, Party, ExpenseCategory } from './types';

// ===== DATE PARSING =====

function parseRelativeDate(text: string): { period?: ExtractedEntities['period']; date?: string; startDate?: string; endDate?: string } {
  const lower = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Today
  if (lower.includes('today') || lower.includes('আজ') || lower.includes('আজকে')) {
    return { period: 'today', date: today.toISOString().split('T')[0] };
  }
  
  // Yesterday
  if (lower.includes('yesterday') || lower.includes('গতকাল') || lower.includes('গত কাল')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { period: 'yesterday', date: yesterday.toISOString().split('T')[0] };
  }
  
  // Last week / This week
  if (lower.includes('last week') || lower.includes('গত সপ্তাহ') || lower.includes('গত সপ্তা')) {
    return { period: 'this_week' };
  }
  if (lower.includes('this week') || lower.includes('এই সপ্তাহ')) {
    return { period: 'this_week' };
  }
  
  // Last 7 days
  if (lower.includes('last 7 days') || lower.includes('last seven days') || 
      lower.includes('গত ৭ দিন') || lower.includes('গত সাত দিন') ||
      lower.includes('past 7 days') || lower.includes('past week')) {
    return { period: 'last_7_days' };
  }
  
  // Last 30 days / This month
  if (lower.includes('last 30 days') || lower.includes('last thirty days') || 
      lower.includes('গত ৩০ দিন') || lower.includes('past 30 days') ||
      lower.includes('past month')) {
    return { period: 'last_30_days' };
  }
  
  // This month
  if (lower.includes('this month') || lower.includes('এই মাস') || 
      lower.includes('চলতি মাস') || lower.includes('current month')) {
    return { period: 'this_month' };
  }
  
  // Last month
  if (lower.includes('last month') || lower.includes('গত মাস') || lower.includes('previous month')) {
    return { period: 'this_month' }; // Will need to adjust in API call
  }
  
  // Custom date range: "from X to Y" or "between X and Y"
  const dateRangeMatch = lower.match(/(?:from|between)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:to|and)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateRangeMatch) {
    try {
      const startDate = parseDate(dateRangeMatch[1]);
      const endDate = parseDate(dateRangeMatch[2]);
      if (startDate && endDate) {
        return { period: 'custom', startDate, endDate };
      }
    } catch {
      // Invalid date format, continue
    }
  }
  
  // Single date: "on 15/01/2024" or "date 15-01-2024"
  const singleDateMatch = lower.match(/(?:on|date|তারিখ)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (singleDateMatch) {
    try {
      const date = parseDate(singleDateMatch[1]);
      if (date) {
        return { period: 'custom', date, startDate: date, endDate: date };
      }
    } catch {
      // Invalid date format, continue
    }
  }
  
  // Bengali date patterns
  const bnDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (bnDateMatch && (lower.includes('তারিখ') || lower.includes('date'))) {
    try {
      const date = `${bnDateMatch[3].length === 2 ? '20' + bnDateMatch[3] : bnDateMatch[3]}-${bnDateMatch[2].padStart(2, '0')}-${bnDateMatch[1].padStart(2, '0')}`;
      return { period: 'custom', date, startDate: date, endDate: date };
    } catch {
      // Invalid date format
    }
  }
  
  // Default: no specific period detected, will default to today in API
  return {};
}

// Parse various date formats
function parseDate(dateStr: string): string | null {
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // MM/DD/YYYY (US format)
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY-MM-DD (ISO)
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day: string, month: string, year: string;
      
      if (format === formats[2]) {
        // ISO format: YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

// ===== AMOUNT EXTRACTION =====

function extractAmount(text: string): number | undefined {
  // Match patterns like "500", "৳500", "500 taka", "500 টাকা", "500 tk"
  const patterns = [
    /৳\s*(\d+(?:,\d+)*(?:\.\d+)?)/,                                           // ৳500
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:taka|tk|টাকা)/i,                          // 500 taka
    /(?:taka|tk|টাকা)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,                          // taka 500
    /(?:amount|খরচ|ব্যয়|মূল্য)[:\s]*(\d+(?:,\d+)*(?:\.\d+)?)/i,              // amount: 500
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:টাকা|taka|tk)\b/i,                        // 500 টাকা
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  
  // Fallback: find any standalone number that could be an amount
  const standaloneNumbers = text.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\b/g);
  if (standaloneNumbers) {
    for (const numStr of standaloneNumbers) {
      const num = parseFloat(numStr.replace(/,/g, ''));
      // Only consider amounts > 10 (to avoid quantities)
      if (!isNaN(num) && num > 10) {
        return num;
      }
    }
  }
  
  return undefined;
}

// ===== QUANTITY EXTRACTION =====

function extractQuantity(text: string): number | undefined {
  const patterns = [
    /(\d+)\s*(?:pcs?|pieces?|পিস|টুকরা|টি|টা)/i,
    /(\d+)\s*x\s*(?=\d|\w)/i,  // "2x" pattern
    /\b(\d+)\s+(?:pack|packet|box|bag|kg|কেজি|লিটার|liter)/i,
    /(?:sold|বিক্রি|sell)\s+(\d+)\s*/i,
    /quantity[:\s]*(\d+)/i,
    /পরিমাণ[:\s]*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const qty = parseInt(match[1]);
      if (!isNaN(qty) && qty > 0) {
        return qty;
      }
    }
  }
  
  // Default quantity
  return 1;
}

// ===== PAYMENT METHOD EXTRACTION =====

function extractPaymentMethod(text: string): ExtractedEntities['paymentMethod'] {
  const lower = text.toLowerCase();
  
  // Credit/Due
  if (lower.includes('due') || lower.includes('credit') || 
      lower.includes('বাকি') || lower.includes('বকেয়া') || 
      lower.includes('ধার') || lower.includes('বাকিতে') ||
      lower.includes('ondho') || lower.includes('বাকি থাকল')) {
    return 'credit';
  }
  
  // Card
  if (lower.includes('card') || lower.includes('কার্ড') || 
      lower.includes('credit card') || lower.includes('debit card')) {
    return 'card';
  }
  
  // Mobile Banking
  if (lower.includes('bkash') || lower.includes('বিকাশ') ||
      lower.includes('nagad') || lower.includes('নগদ') ||
      lower.includes('rocket') || lower.includes('রকেট') ||
      lower.includes('mobile') || lower.includes('মোবাইল') ||
      lower.includes('mobile banking') || lower.includes('মোবাইল ব্যাংকিং')) {
    return 'mobile_banking';
  }
  
  // Explicit cash
  if (lower.includes('cash') || lower.includes('নগদ') || 
      lower.includes('ক্যাশ') || lower.includes('টাকায়')) {
    return 'cash';
  }
  
  // Default to cash
  return 'cash';
}

// ===== INVOICE REFERENCE EXTRACTION =====

function extractInvoiceRef(text: string): string | undefined {
  const patterns = [
    /invoice[:\s]*#?([A-Z0-9\-]+)/i,
    /inv[:\s]*#?([A-Z0-9\-]+)/i,
    /bill[:\s]*#?([A-Z0-9\-]+)/i,
    /#([A-Z]{2,3}\d{3,})/i,  // e.g., #INV001
    /(?:invoice|bill|ইনভয়েস)[:\s]*([A-Z0-9\-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  return undefined;
}

// ===== ITEM MATCHING =====

function findMatchingItem(text: string, items: Item[]): { id: string; name: string; sellingPrice: number } | null {
  const lower = text.toLowerCase().trim();
  
  if (!lower || lower.length < 2) return null;
  
  // Score each item by match quality
  const scoredItems: Array<{ item: Item; score: number }> = [];
  
  for (const item of items) {
    const itemNameLower = item.name.toLowerCase();
    const itemNameBnLower = item.nameBn?.toLowerCase() || '';
    
    let score = 0;
    
    // Exact match - highest score
    if (itemNameLower === lower || itemNameBnLower === lower) {
      score = 100;
    }
    // Starts with - high score
    else if (itemNameLower.startsWith(lower) || itemNameBnLower.startsWith(lower)) {
      score = 80;
    }
    // Contains - medium score
    else if (itemNameLower.includes(lower) || itemNameBnLower.includes(lower)) {
      score = 60;
    }
    // Partial word match
    else {
      const words = lower.split(/\s+/);
      for (const word of words) {
        if (word.length > 2) {
          if (itemNameLower.includes(word)) {
            score = Math.max(score, 40);
          }
          if (itemNameBnLower.includes(word)) {
            score = Math.max(score, 40);
          }
        }
      }
    }
    
    if (score > 0) {
      scoredItems.push({ item, score });
    }
  }
  
  // Sort by score and return best match
  scoredItems.sort((a, b) => b.score - a.score);
  
  if (scoredItems.length > 0 && scoredItems[0].score >= 40) {
    return {
      id: scoredItems[0].item.id,
      name: scoredItems[0].item.name,
      sellingPrice: scoredItems[0].item.sellingPrice,
    };
  }
  
  return null;
}

// ===== PARTY MATCHING =====

function findMatchingParty(text: string, parties: Party[]): { id: string; name: string } | null {
  const lower = text.toLowerCase().trim();
  
  if (!lower || lower.length < 2) return null;
  
  // Score each party by match quality
  const scoredParties: Array<{ party: Party; score: number }> = [];
  
  for (const party of parties) {
    const partyNameLower = party.name.toLowerCase();
    
    let score = 0;
    
    // Exact match
    if (partyNameLower === lower) {
      score = 100;
    }
    // Starts with
    else if (partyNameLower.startsWith(lower)) {
      score = 80;
    }
    // Contains
    else if (partyNameLower.includes(lower)) {
      score = 60;
    }
    // Partial match
    else {
      const words = lower.split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && partyNameLower.includes(word)) {
          score = Math.max(score, 40);
        }
      }
    }
    
    if (score > 0) {
      scoredParties.push({ party, score });
    }
  }
  
  scoredParties.sort((a, b) => b.score - a.score);
  
  if (scoredParties.length > 0 && scoredParties[0].score >= 40) {
    return {
      id: scoredParties[0].party.id,
      name: scoredParties[0].party.name,
    };
  }
  
  return null;
}

// ===== EXPENSE CATEGORY MATCHING =====

function findMatchingCategory(text: string, categories: ExpenseCategory[]): { id: string; name: string } | null {
  const lower = text.toLowerCase().trim();
  
  for (const cat of categories) {
    if (cat.name.toLowerCase().includes(lower) || 
        lower.includes(cat.name.toLowerCase()) ||
        cat.nameBn?.includes(lower) || 
        lower.includes(cat.nameBn || '')) {
      return { id: cat.id, name: cat.name };
    }
  }
  
  return null;
}

// ===== MAIN INTENT PARSER =====

export function parseIntent(
  message: string,
  context: {
    items: Item[];
    parties: Party[];
    expenseCategories: ExpenseCategory[];
  }
): IntentResult {
  const lower = message.toLowerCase();
  const entities: ExtractedEntities = {};
  const missingFields: string[] = [];
  
  // ===== EXTRACT COMMON ENTITIES =====
  
  // Date/period
  const dateInfo = parseRelativeDate(message);
  entities.period = dateInfo.period;
  entities.date = dateInfo.date;
  entities.startDate = dateInfo.startDate;
  entities.endDate = dateInfo.endDate;
  
  // Invoice reference
  entities.invoiceNo = extractInvoiceRef(message);
  entities.invoiceRef = entities.invoiceNo;
  
  // ===== SALES INTENT =====
  const salePatterns = [
    // English patterns
    /(?:i\s+)?sold?\s+(\d+)?\s*(?:x\s*)?(.+?)\s+to\s+(.+?)(?:\s+(?:in\s+)?(due|credit|cash|bkash|card))?$/i,
    /sell\s+(\d+)?\s*(?:x\s*)?(.+?)\s+to\s+(.+)/i,
    /(?:record|create|add)\s+(?:a\s+)?(?:new\s+)?sale\s+(?:of\s+)?(.+)/i,
    /new\s+sale\s+(?:of\s+)?(.+)/i,
    // Bengali patterns
    /বিক্রি?\s*করলাম?\s+(\d+)?\s*(.+?)\s+(.+?)এ?র?\s*কাছে/i,
    /নতুন?\s*বিক্রি?\s*(.+)/i,
    /(.+?)\s+বিক্রি?\s*করলাম?\s+(\d+)?\s*(?:টি|পিস)?\s*(.+?)এ?র?\s*কাছে/i,
  ];
  
  for (const pattern of salePatterns) {
    const match = message.match(pattern);
    if (match) {
      let qty = 1;
      let itemName = '';
      let partyName = '';
      
      // Extract based on pattern match groups
      if (pattern === salePatterns[0] || pattern === salePatterns[1]) {
        if (match[1] && !isNaN(parseInt(match[1]))) {
          qty = parseInt(match[1]);
          itemName = match[2]?.trim() || '';
          partyName = match[3]?.trim() || '';
        } else {
          itemName = match[1]?.trim() || '';
          partyName = match[2]?.trim() || '';
        }
      } else if (pattern === salePatterns[6]) {
        // Bengali pattern: item first
        itemName = match[1]?.trim() || '';
        qty = match[2] ? parseInt(match[2]) : 1;
        partyName = match[3]?.trim() || '';
      } else {
        itemName = match[1]?.trim() || '';
      }
      
      // Clean up extracted names
      itemName = itemName.replace(/^(?:of|a|an|the)\s+/i, '').trim();
      partyName = partyName.replace(/\s+(?:in|for|with|due|credit|cash)$/i, '').trim();
      
      // Find item
      if (itemName) {
        const foundItem = findMatchingItem(itemName, context.items);
        if (foundItem) {
          entities.itemName = foundItem.name;
          entities.itemId = foundItem.id;
          entities.unitPrice = foundItem.sellingPrice;
        } else {
          entities.itemName = itemName;
          missingFields.push('itemId');
        }
      } else {
        missingFields.push('itemName');
      }
      
      // Find party (optional for sales)
      if (partyName) {
        const foundParty = findMatchingParty(partyName, context.parties);
        if (foundParty) {
          entities.partyName = foundParty.name;
          entities.partyId = foundParty.id;
        } else {
          entities.partyName = partyName;
          // Party not found is not a missing field - can create new
        }
      }
      
      // Extract quantity
      entities.quantity = extractQuantity(message) || qty;
      
      // Payment method
      entities.paymentMethod = extractPaymentMethod(message);
      
      // Calculate paid amount based on payment method
      if (entities.paymentMethod === 'credit') {
        entities.paidAmount = 0;
      } else if (entities.unitPrice && entities.quantity) {
        entities.paidAmount = entities.unitPrice * entities.quantity;
      }
      
      const confirmationText = language => {
        const en = `Confirm sale: ${entities.quantity}x ${entities.itemName || 'item'} to ${entities.partyName || 'walk-in customer'} for ${entities.paymentMethod === 'credit' ? 'credit' : 'cash'}?`;
        const bn = `নিশ্চিত করুন: ${entities.quantity}x ${entities.itemName || 'পণ্য'} ${entities.partyName || 'হাটে কাস্টমার'} কে ${entities.paymentMethod === 'credit' ? 'বাকিতে' : 'নগদে'} বিক্রি?`;
        return language === 'bn' ? bn : en;
      };
      
      return {
        intent: 'create_sale',
        entities,
        confidence: 0.9,
        missingFields,
        clarifyingQuestion: missingFields.length > 0 
          ? `Which item would you like to sell? Available: ${context.items.slice(0, 5).map(i => i.name).join(', ')}...`
          : confirmationText('en'),
        clarifyingQuestionBn: missingFields.length > 0
          ? `কোন পণ্য বিক্রি করতে চান? উপলব্ধ: ${context.items.slice(0, 5).map(i => i.nameBn || i.name).join(', ')}...`
          : confirmationText('bn'),
      };
    }
  }
  
  // ===== EXPENSE INTENT =====
  const expensePatterns = [
    /(?:i\s+)?(?:spent|expense|paid)\s+(?:৳?\s*(\d+(?:,\d+)*))?\s*(?:taka\s+)?(?:on\s+)?(?:for\s+)?(.+)?$/i,
    /add\s+(?:an?\s+)?expense\s+(?:of\s+)?(?:৳?\s*(\d+(?:,\d+)*))?\s*(.+)?$/i,
    /record\s+(?:an?\s+)?expense\s+(?:of\s+)?(?:৳?\s*(\d+(?:,\d+)*))?\s*(.+)?$/i,
    /খরচ?\s*(?:করলাম|হয়েছে)\s*(?:৳?\s*(\d+(?:,\d+)*))?\s*(.+)?$/i,
    /(.+?)এর\s*জন্য\s*(\d+(?:,\d+)*)\s*টাকা?\s*খরচ/i,  // Bengali: item first
  ];
  
  for (const pattern of expensePatterns) {
    const match = message.match(pattern);
    if (match) {
      let amount: number | undefined;
      let description = '';
      
      if (pattern === expensePatterns[4]) {
        // Bengali pattern: description first, then amount
        description = match[1]?.trim() || '';
        amount = match[2] ? parseFloat(match[2].replace(/,/g, '')) : undefined;
      } else {
        amount = match[1] ? parseFloat(match[1].replace(/,/g, '')) : extractAmount(message);
        description = match[2]?.trim() || '';
      }
      
      entities.amount = amount;
      entities.description = description;
      
      // Try to find category
      if (description) {
        const foundCat = findMatchingCategory(description, context.expenseCategories);
        if (foundCat) {
          entities.expenseCategory = foundCat.name;
          entities.expenseCategoryId = foundCat.id;
        }
      }
      
      if (!amount) {
        missingFields.push('amount');
      }
      if (!description) {
        missingFields.push('description');
      }
      
      return {
        intent: 'create_expense',
        entities,
        confidence: 0.85,
        missingFields,
        clarifyingQuestion: missingFields.includes('amount')
          ? 'How much did you spend?'
          : missingFields.includes('description')
          ? 'What was the expense for?'
          : `Confirm expense: ৳${amount} for "${description}"?`,
        clarifyingQuestionBn: missingFields.includes('amount')
          ? 'কত টাকা খরচ হয়েছে?'
          : missingFields.includes('description')
          ? 'খরচ কিসের জন্য?'
          : `নিশ্চিত করুন: ৳${amount} খরচ "${description}" এর জন্য?`,
      };
    }
  }
  
  // ===== PAYMENT INTENT =====
  const paymentPatterns = [
    /(?:i\s+)?(?:received|collected|got)\s+(?:payment\s+)?(?:of\s+)?(?:৳?\s*(\d+(?:,\d+)*))?\s*(?:from\s+)?(.+)?$/i,
    /payment\s+(?:received?\s+)?(?:from\s+)?(.+?)(?:\s+of\s+)?(?:৳?\s*(\d+(?:,\d+)*))?$/i,
    /record\s+(?:a\s+)?payment\s+(?:from\s+)?(.+?)(?:\s+of\s+)?(?:৳?\s*(\d+(?:,\d+)*))?$/i,
    /পেয়েছি|পাওয়া|সংগ্রহ?\s*(?:৳?\s*(\d+(?:,\d+)*))?\s*(.+)?$/i,
    /(.+?)থেকে\s*(\d+(?:,\d+)*)\s*টাকা?\s*পেয়েছি/i,  // Bengali: party first, then amount
  ];
  
  for (const pattern of paymentPatterns) {
    const match = message.match(pattern);
    if (match) {
      let amount: number | undefined;
      let partyName = '';
      
      if (pattern === paymentPatterns[4]) {
        // Bengali pattern
        partyName = match[1]?.trim() || '';
        amount = match[2] ? parseFloat(match[2].replace(/,/g, '')) : undefined;
      } else {
        amount = match[1] && !isNaN(parseInt(match[1].replace(/,/g, ''))) 
          ? parseFloat(match[1].replace(/,/g, ''))
          : (match[2] ? parseFloat(match[2].replace(/,/g, '')) : extractAmount(message));
        partyName = match[1] && isNaN(parseInt(match[1].replace(/,/g, ''))) 
          ? match[1]?.trim() || ''
          : match[2]?.trim() || '';
      }
      
      entities.amount = amount;
      entities.paymentType = 'received';
      
      if (partyName) {
        const foundParty = findMatchingParty(partyName, context.parties);
        if (foundParty) {
          entities.partyName = foundParty.name;
          entities.partyId = foundParty.id;
        } else {
          entities.partyName = partyName;
          missingFields.push('partyId');
        }
      } else {
        missingFields.push('partyId');
      }
      
      if (!amount) {
        missingFields.push('amount');
      }
      
      // Payment method
      entities.paymentMethod = extractPaymentMethod(message);
      if (entities.paymentMethod === 'credit') {
        entities.paymentMethod = 'cash'; // Payment received can't be credit
      }
      
      return {
        intent: 'create_payment',
        entities,
        confidence: 0.85,
        missingFields,
        clarifyingQuestion: missingFields.includes('amount')
          ? `How much did ${entities.partyName || 'the customer'} pay?`
          : missingFields.includes('partyId')
          ? 'Who made the payment?'
          : `Confirm: Received ৳${amount} from ${entities.partyName}?`,
        clarifyingQuestionBn: missingFields.includes('amount')
          ? `${entities.partyName || 'কাস্টমার'} কত টাকা দিয়েছে?`
          : missingFields.includes('partyId')
          ? 'কে পেমেন্ট দিয়েছে?'
          : `নিশ্চিত করুন: ${entities.partyName} থেকে ৳${amount} পেয়েছেন?`,
      };
    }
  }
  
  // ===== CREATE PARTY (CUSTOMER/SUPPLIER) INTENT =====
  const createPartyPatterns = [
    // English patterns for customer
    /(?:add|create|new)\s+(?:a\s+)?(?:new\s+)?customer\s+(?:named?\s+)?(.+)$/i,
    /(?:add|create)\s+(?:customer|party)\s+(.+)$/i,
    // English patterns for supplier
    /(?:add|create|new)\s+(?:a\s+)?(?:new\s+)?supplier\s+(?:named?\s+)?(.+)$/i,
    // Generic party patterns
    /(?:add|create)\s+(?:new\s+)?party\s+(.+)$/i,
    // Bengali patterns for customer
    /নতুন\s*গ্রাহক\s*(.+)/i,
    /গ্রাহক\s*যোগ\s*কর\s*(.+)/i,
    /(?:add|create)\s+(.+)\s+as\s+(?:a\s+)?(?:customer|supplier)/i,
    // Bengali patterns for supplier
    /নতুন\s*সাপ্লায়ার\s*(.+)/i,
    /সাপ্লায়ার\s*যোগ\s*কর\s*(.+)/i,
  ];
  
  for (const pattern of createPartyPatterns) {
    const match = message.match(pattern);
    if (match) {
      const partyName = match[1]?.trim() || '';
      
      // Determine party type from pattern
      const patternStr = pattern.source.toLowerCase();
      if (patternStr.includes('supplier') || patternStr.includes('সাপ্লায়ার')) {
        entities.partyType = 'supplier';
      } else {
        entities.partyType = 'customer';
      }
      
      if (partyName) {
        entities.partyName = partyName;
        
        // Check if party already exists
        const existingParty = findMatchingParty(partyName, context.parties);
        if (existingParty) {
          entities.partyId = existingParty.id;
          return {
            intent: 'query',
            entities,
            confidence: 0.9,
            missingFields: [],
            clarifyingQuestion: `${partyName} already exists in your contacts. Did you want to do something else?`,
            clarifyingQuestionBn: `${partyName} ইতিমধ্যে আপনার কন্টাক্টে আছে। অন্য কিছু করতে চান?`,
          };
        }
      } else {
        missingFields.push('partyName');
      }
      
      const confirmationText = (lang: string) => {
        const typeName = entities.partyType === 'supplier' 
          ? (lang === 'bn' ? 'সাপ্লায়ার' : 'supplier')
          : (lang === 'bn' ? 'গ্রাহক' : 'customer');
        return lang === 'bn'
          ? `নতুন ${typeName} হিসেবে "${partyName}" যোগ করতে চান?`
          : `Add "${partyName}" as a new ${typeName}?`;
      };
      
      return {
        intent: 'create_party',
        entities,
        confidence: 0.9,
        missingFields,
        clarifyingQuestion: missingFields.length > 0
          ? 'What is the name of the customer or supplier?'
          : confirmationText('en'),
        clarifyingQuestionBn: missingFields.length > 0
          ? 'গ্রাহক বা সাপ্লায়ারের নাম কী?'
          : confirmationText('bn'),
      };
    }
  }
  
  // ===== CREATE ITEM INTENT =====
  const createItemPatterns = [
    /(?:add|create|new)\s+(?:a\s+)?(?:new\s+)?(?:item|product)\s+(?:named?\s+)?(.+)$/i,
    /(?:add|create)\s+(?:item|product)\s+(.+)$/i,
    /নতুন\s*পণ্য\s*(.+)/i,
    /পণ্য\s*যোগ\s*কর\s*(.+)/i,
  ];
  
  for (const pattern of createItemPatterns) {
    const match = message.match(pattern);
    if (match) {
      const itemName = match[1]?.trim() || '';
      
      if (itemName) {
        entities.itemName = itemName;
      } else {
        missingFields.push('itemName');
      }
      
      // Try to extract price if mentioned
      entities.sellingPrice = extractAmount(message);
      if (entities.sellingPrice) {
        entities.unitPrice = entities.sellingPrice;
      }
      
      return {
        intent: 'create_item',
        entities,
        confidence: 0.9,
        missingFields,
        clarifyingQuestion: missingFields.length > 0
          ? 'What is the name of the item?'
          : `Add "${itemName}" as a new item?`,
        clarifyingQuestionBn: missingFields.length > 0
          ? 'পণ্যের নাম কী?'
          : `"${itemName}" নতুন পণ্য হিসেবে যোগ করতে চান?`,
      };
    }
  }
  
  // ===== QUERY INTENT =====
  
  // Invoice lookup
  if (entities.invoiceNo) {
    return {
      intent: 'query',
      entities: { ...entities, invoiceRef: entities.invoiceNo },
      confidence: 0.95,
      missingFields: [],
    };
  }
  
  // Sales queries
  if (lower.includes('sale') || lower.includes('বিক্রি') || lower.includes('বিক্রয়') ||
      lower.includes('revenue') || lower.includes('আয়')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Profit queries
  if (lower.includes('profit') || lower.includes('লাভ') || lower.includes('মুনাফা') || 
      lower.includes('income') || lower.includes('earning')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Expense queries
  if (lower.includes('expense') || lower.includes('খরচ') || lower.includes('expenditure') ||
      lower.includes('spending')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Stock/Inventory queries
  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('স্টক') || 
      lower.includes('মজুদ') || lower.includes('পণ্য') || lower.includes('items')) {
    if (lower.includes('low') || lower.includes('কম') || lower.includes('নিচে') ||
        lower.includes('shortage') || lower.includes('কমি')) {
      entities.itemName = 'low_stock';
    }
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Receivable queries
  if (lower.includes('receivable') || lower.includes('পাওনা') || lower.includes('due') || 
      lower.includes('বকেয়া') || lower.includes('outstanding') || lower.includes('collect')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Payable queries
  if (lower.includes('payable') || lower.includes('দেনা') || lower.includes('owe') || 
      lower.includes('supplier') || lower.includes('pay supplier')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Top selling queries
  if ((lower.includes('top') || lower.includes('best') || lower.includes('সেরা') || 
       lower.includes('সবচেয়ে') || lower.includes('most')) &&
      (lower.includes('selling') || lower.includes('sold') || lower.includes('বিক্রি') ||
       lower.includes('popular'))) {
    return {
      intent: 'query',
      entities: { ...entities, itemName: 'top_selling' },
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Summary/dashboard queries
  if (lower.includes('summary') || lower.includes('overview') || lower.includes('সারসংক্ষেপ') || 
      lower.includes('হালনাগাদ') || lower.includes('status') || lower.includes('report') ||
      lower.includes('report') || lower.includes('রিপোর্ট') || lower.includes('how is business')) {
    return {
      intent: 'query',
      entities,
      confidence: 0.9,
      missingFields: [],
    };
  }
  
  // Customer queries
  if (lower.includes('customer') || lower.includes('গ্রাহক') || lower.includes('কাস্টমার')) {
    entities.partyType = 'customer';
    return {
      intent: 'query',
      entities,
      confidence: 0.85,
      missingFields: [],
    };
  }
  
  // Supplier queries  
  if (lower.includes('supplier') || lower.includes('সাপ্লায়ার') || lower.includes('পাইকারি')) {
    entities.partyType = 'supplier';
    return {
      intent: 'query',
      entities,
      confidence: 0.85,
      missingFields: [],
    };
  }
  
  // Default to informative
  return {
    intent: 'informative',
    entities,
    confidence: 0.5,
    missingFields: [],
  };
}
