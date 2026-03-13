// Response Validator - Ensures JSON schema compliance

import type { AIChatResponse, ActionType } from './types';

const VALID_ACTION_TYPES: ActionType[] = [
  'query',
  'create_sale',
  'create_expense',
  'create_payment',
  'create_party',
  'create_item',
  'need_clarification',
  'confirm_action',
  'none',
];

export function validateActionType(type: unknown): type is ActionType {
  return typeof type === 'string' && VALID_ACTION_TYPES.includes(type as ActionType);
}

export function validateTable(table: unknown): { headers: string[]; rows: string[][] } | null {
  if (!table || typeof table !== 'object') return null;
  
  const t = table as Record<string, unknown>;
  
  if (!Array.isArray(t.headers) || !Array.isArray(t.rows)) return null;
  
  // Validate headers are strings
  const headers = t.headers.map(h => String(h));
  
  // Validate rows are arrays of strings
  const rows = t.rows.map(row => {
    if (!Array.isArray(row)) return [];
    return row.map(cell => String(cell));
  });
  
  return { headers, rows };
}

export function validateTables(tables: unknown): Array<{ headers: string[]; rows: string[][] }> | undefined {
  if (!tables || !Array.isArray(tables)) return undefined;
  
  const validTables: Array<{ headers: string[]; rows: string[][] }> = [];
  
  for (const table of tables) {
    const validated = validateTable(table);
    if (validated) {
      validTables.push(validated);
    }
  }
  
  return validTables.length > 0 ? validTables : undefined;
}

export function validateAIResponse(response: unknown): AIChatResponse | null {
  if (!response || typeof response !== 'object') return null;
  
  const r = response as Record<string, unknown>;
  
  // Validate answer
  if (typeof r.answer !== 'string' || r.answer.length === 0) {
    return null;
  }
  
  // Validate action
  if (!r.action || typeof r.action !== 'object') {
    return null;
  }
  
  const action = r.action as Record<string, unknown>;
  
  if (!validateActionType(action.type)) {
    return null;
  }
  
  const validatedResponse: AIChatResponse = {
    answer: r.answer,
    action: {
      type: action.type as ActionType,
      parameters: (action.parameters as Record<string, unknown>) || {},
    },
    tables: validateTables(r.tables),
  };
  
  return validatedResponse;
}

// Repair partially invalid JSON response
export function repairAIResponse(
  rawResponse: string,
  fallbackAnswer: string,
  fallbackAction: ActionType = 'none'
): AIChatResponse {
  // Try direct parse first
  try {
    const parsed = JSON.parse(rawResponse);
    const validated = validateAIResponse(parsed);
    if (validated) return validated;
  } catch {
    // Continue to repair attempts
  }
  
  // Try to extract JSON from markdown code blocks
  const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      const validated = validateAIResponse(parsed);
      if (validated) return validated;
    } catch {
      // Continue
    }
  }
  
  // Try to find JSON object in response
  const jsonObjectMatch = rawResponse.match(/\{[\s\S]*"answer"[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      const parsed = JSON.parse(jsonObjectMatch[0]);
      const validated = validateAIResponse(parsed);
      if (validated) return validated;
    } catch {
      // Continue
    }
  }
  
  // Return fallback response
  return {
    answer: fallbackAnswer,
    action: {
      type: fallbackAction,
      parameters: {},
    },
  };
}

// Build response JSON with proper structure
export function buildResponse(
  answer: string,
  actionType: ActionType = 'none',
  parameters: Record<string, unknown> = {},
  tables?: Array<{ headers: string[]; rows: string[][] }>
): AIChatResponse {
  return {
    answer,
    action: {
      type: actionType,
      parameters,
    },
    tables,
  };
}

// Wrap response for API (frontend expects { success: true, data: {...} })
export function wrapApiResponse(response: AIChatResponse): { success: true; data: AIChatResponse } {
  return {
    success: true,
    data: response,
  };
}

// Build clarification response
export function buildClarificationResponse(
  question: string,
  questionBn: string,
  missingFields: string[],
  language: 'en' | 'bn'
): AIChatResponse {
  return {
    answer: language === 'bn' ? questionBn : question,
    action: {
      type: 'need_clarification',
      parameters: {
        missingFields,
      },
    },
  };
}

// Build confirmation response
export function buildConfirmationResponse(
  summary: string,
  summaryBn: string,
  actionType: ActionType,
  parameters: Record<string, unknown>,
  language: 'en' | 'bn'
): AIChatResponse {
  return {
    answer: language === 'bn' ? summaryBn : summary,
    action: {
      type: 'confirm_action',
      parameters: {
        pendingAction: actionType,
        ...parameters,
      },
    },
  };
}

// Build table from data
export function buildTable(
  headers: string[],
  rows: Array<Record<string, unknown>>,
  fieldMapping: Record<string, string>
): { headers: string[]; rows: string[][] } {
  const mappedRows = rows.map(row => 
    Object.keys(fieldMapping).map(field => String(row[field] ?? ''))
  );
  
  return { headers, rows: mappedRows };
}

// Format currency for tables
export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('bn-BD')}`;
}

// Format number for tables
export function formatNumber(num: number): string {
  return num.toLocaleString('bn-BD');
}

// Format date for tables
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('bn-BD');
}
