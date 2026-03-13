// Ollama Client - Stream Collector
// Calls local LLM and collects streaming response

import type { OllamaRequest, OllamaStreamResponse } from './types';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || OLLAMA_BASE_URL;
    this.model = model || OLLAMA_MODEL;
  }

  /**
   * Generate response from Ollama with streaming
   * Collects all tokens and returns complete response
   */
  async generate(prompt: string, options?: { temperature?: number; top_p?: number }): Promise<string> {
    const requestBody: OllamaRequest = {
      model: this.model,
      prompt,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      // Collect streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed: OllamaStreamResponse = JSON.parse(line);
              fullResponse += parsed.response || '';
              
              // If done, we can break early
              if (parsed.done) {
                break;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn('Failed to parse Ollama stream line:', line);
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw error;
    }
  }

  /**
   * Generate with JSON output enforcement
   */
  async generateJSON(prompt: string): Promise<Record<string, unknown>> {
    // Add JSON enforcement to prompt
    const jsonPrompt = `${prompt}

IMPORTANT: Your response MUST be valid JSON only. No markdown, no code blocks, just pure JSON.`;

    const response = await this.generate(jsonPrompt);
    
    // Try to parse as JSON
    try {
      // Clean response - remove potential markdown code blocks
      let cleaned = response.trim();
      
      // Remove markdown code blocks if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', response);
      throw new Error('LLM did not return valid JSON');
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return (data.models || []).map((m: { name: string }) => m.name);
    } catch {
      return [];
    }
  }
}

// Singleton instance
let ollamaClient: OllamaClient | null = null;

export function getOllamaClient(): OllamaClient {
  if (!ollamaClient) {
    ollamaClient = new OllamaClient();
  }
  return ollamaClient;
}

// Alternative: Use z-ai-web-dev-sdk LLM skill if Ollama unavailable
export async function generateWithFallback(
  systemPrompt: string,
  userMessage: string,
  isBangla: boolean
): Promise<string> {
  // Try Ollama first
  const client = getOllamaClient();
  const available = await client.isAvailable();
  
  if (available) {
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
    return client.generate(fullPrompt);
  }
  
  // Fallback to z-ai-web-dev-sdk
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      thinking: { type: 'disabled' }
    });
    
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('LLM unavailable, using smart fallback:', error);
    // Return a JSON response that will be processed by the response validator
    // The response validator will handle the fallback
    throw new Error('No LLM available');
  }
}

// Smart fallback generator - creates response from context without LLM
export function generateSmartFallback(
  userMessage: string,
  context: {
    todaySales?: number;
    todayProfit?: number;
    todayExpenses?: number;
    receivable?: number;
    payable?: number;
    totalItems?: number;
    lowStockItems?: number;
    stockValue?: number;
  },
  isBangla: boolean
): string {
  const lower = userMessage.toLowerCase();
  
  // Format currency
  const cur = (n: number = 0) => `৳${n.toLocaleString('bn-BD')}`;
  
  // Greeting responses
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('হ্যালো') || lower.includes('আসসালামু')) {
    return isBangla 
      ? `হ্যালো! আমি আপনার AI সহকারী। আপনার ব্যবসার তথ্য জানতে আমাকে কিছু জিজ্ঞাসা করুন।`
      : `Hello! I'm your AI assistant. Ask me anything about your business.`;
  }
  
  // Sales query
  if (lower.includes('sale') || lower.includes('বিক্রি') || lower.includes('revenue')) {
    return isBangla
      ? `আজকের বিক্রি: ${cur(context.todaySales)}, মুনাফা: ${cur(context.todayProfit)}।`
      : `Today's sales: ${cur(context.todaySales)}, Profit: ${cur(context.todayProfit)}.`;
  }
  
  // Profit query
  if (lower.includes('profit') || lower.includes('লাভ') || lower.includes('মুনাফা')) {
    return isBangla
      ? `আজকের মুনাফা: ${cur(context.todayProfit)}।`
      : `Today's profit: ${cur(context.todayProfit)}.`;
  }
  
  // Expense query
  if (lower.includes('expense') || lower.includes('খরচ')) {
    return isBangla
      ? `আজকের খরচ: ${cur(context.todayExpenses)}।`
      : `Today's expenses: ${cur(context.todayExpenses)}.`;
  }
  
  // Receivable/due query
  if (lower.includes('receivable') || lower.includes('পাওনা') || lower.includes('due') || lower.includes('বকেয়া')) {
    return isBangla
      ? `গ্রাহকদের পাওনা: ${cur(context.receivable)}।`
      : `Customer receivables: ${cur(context.receivable)}.`;
  }
  
  // Payable query
  if (lower.includes('payable') || lower.includes('দেনা') || lower.includes('owe')) {
    return isBangla
      ? `সাপ্লায়ারদের দেনা: ${cur(context.payable)}।`
      : `Supplier payables: ${cur(context.payable)}.`;
  }
  
  // Stock/inventory query
  if (lower.includes('stock') || lower.includes('স্টক') || lower.includes('inventory')) {
    return isBangla
      ? `মোট পণ্য: ${context.totalItems}টি, কম স্টক: ${context.lowStockItems}টি, স্টক মূল্য: ${cur(context.stockValue)}।`
      : `Total items: ${context.totalItems}, Low stock: ${context.lowStockItems} items, Stock value: ${cur(context.stockValue)}.`;
  }
  
  // Purchase query
  if (lower.includes('purchased') || lower.includes('purchase') || lower.includes('কিনেছি') || lower.includes('ক্রয়')) {
    return isBangla
      ? `ক্রয় রেকর্ড করতে হলে পণ্যের নাম, সাপ্লায়ারের নাম এবং পরিমাণ উল্লেখ করুন। উদাহরণ: "৫০ কেজি চাল কিনেছি রহিম এন্টারপ্রাইজ থেকে ৫০০০ টাকায়"`
      : `To record a purchase, please provide the item name, supplier name, quantity and amount. Example: "purchased 50 kg rice from Rahim Enterprise for 5000 taka"`;
  }
  
  // Summary query
  if (lower.includes('summary') || lower.includes('সারসংক্ষেপ') || lower.includes('overview') || lower.includes('report')) {
    return isBangla
      ? `সারসংক্ষেপ: বিক্রি ${cur(context.todaySales)}, মুনাফা ${cur(context.todayProfit)}, খরচ ${cur(context.todayExpenses)}, পাওনা ${cur(context.receivable)}, দেনা ${cur(context.payable)}।`
      : `Summary: Sales ${cur(context.todaySales)}, Profit ${cur(context.todayProfit)}, Expenses ${cur(context.todayExpenses)}, Receivable ${cur(context.receivable)}, Payable ${cur(context.payable)}.`;
  }
  
  // Default response
  return isBangla
    ? `আমি আপনার প্রশ্ন বুঝতে পারিনি। বিক্রি, মুনাফা, খরচ, স্টক বা বকেয়া সম্পর্কে জিজ্ঞাসা করুন।`
    : `I didn't understand your question. Ask about sales, profit, expenses, stock, or receivables.`;
}
