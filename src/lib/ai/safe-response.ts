// Safe Response Utilities
// Ensures no internal paths or sensitive data exposed in errors

import type { AIChatResponse, ActionType } from './types';

// Safe error messages - no internal paths exposed
const SAFE_ERROR_MESSAGES: Record<string, { en: string; bn: string }> = {
  missing_business_id: {
    en: 'Session expired. Please log in again.',
    bn: 'সেশন মেয়াদোত্তীর্ণ। আবার লগইন করুন।',
  },
  missing_message: {
    en: 'Please enter a message.',
    bn: 'একটি বার্তা লিখুন।',
  },
  empty_message: {
    en: 'Message cannot be empty.',
    bn: 'বার্তা খালি হতে পারে না।',
  },
  invalid_session: {
    en: 'Invalid session. Please try again.',
    bn: 'অবৈধ সেশন। আবার চেষ্টা করুন।',
  },
  no_pending_action: {
    en: 'No pending action to confirm.',
    bn: 'নিশ্চিত করার জন্য কোন কাজ নেই।',
  },
  action_expired: {
    en: 'Action expired. Please try again.',
    bn: 'কাজের মেয়াদ শেষ। আবার চেষ্টা করুন।',
  },
  erp_unavailable: {
    en: 'Service temporarily unavailable. Please try again later.',
    bn: 'সার্ভিস সাময়িকভাবে ব্যস্ত। পরে আবার চেষ্টা করুন।',
  },
  llm_unavailable: {
    en: 'AI assistant is temporarily unavailable. Please try again.',
    bn: 'AI সহকারী সাময়িকভাবে অনুপলব্ধ। আবার চেষ্টা করুন।',
  },
  unknown_error: {
    en: 'An unexpected error occurred. Please try again.',
    bn: 'অপ্রত্যাশিত ত্রুটি হয়েছে। আবার চেষ্টা করুন।',
  },
  cross_business_denied: {
    en: 'Access denied.',
    bn: 'অ্যাক্সেস প্রত্যাখ্যাত।',
  },
};

export function buildSafeErrorResponse(
  errorKey: string,
  language: 'en' | 'bn',
  missingFields?: string[]
): AIChatResponse {
  const messages = SAFE_ERROR_MESSAGES[errorKey] || SAFE_ERROR_MESSAGES.unknown_error;
  const answer = language === 'bn' ? messages.bn : messages.en;

  return {
    answer,
    action: {
      type: 'need_clarification',
      parameters: {
        missingFields: missingFields || [],
        errorKey,
      },
    },
  };
}

// Sanitize error for logging (never exposed to user)
export function logSafeError(context: string, error: unknown): void {
  // Only log to server, never expose to client
  if (process.env.NODE_ENV === 'development') {
    console.error(`[AI Error] ${context}:`, error);
  } else {
    // In production, log minimal info
    console.error(`[AI Error] ${context}`);
  }
}

// Validate and sanitize input
export function validateInput(input: {
  businessId?: string;
  userId?: string;
  message?: string;
  sessionId?: string;
  confirm?: boolean;
  language?: string;
}): { valid: boolean; error?: AIChatResponse; sanitized?: {
  businessId: string;
  userId: string;
  message: string;
  sessionId: string;
  confirm: boolean;
  language: 'en' | 'bn';
} } {
  const language: 'en' | 'bn' = input.language === 'bn' ? 'bn' : 'en';

  // Validate businessId - REQUIRED
  if (!input.businessId || typeof input.businessId !== 'string' || input.businessId.trim() === '') {
    return {
      valid: false,
      error: buildSafeErrorResponse('missing_business_id', language, ['businessId']),
    };
  }

  // Validate message - REQUIRED
  if (input.message === undefined || input.message === null) {
    return {
      valid: false,
      error: buildSafeErrorResponse('missing_message', language, ['message']),
    };
  }

  // Validate message is not empty
  const trimmedMessage = typeof input.message === 'string' ? input.message.trim() : '';
  if (trimmedMessage === '') {
    return {
      valid: false,
      error: buildSafeErrorResponse('empty_message', language, ['message']),
    };
  }

  // Sanitize and return
  return {
    valid: true,
    sanitized: {
      businessId: input.businessId.trim(),
      userId: (input.userId && typeof input.userId === 'string' ? input.userId.trim() : 'system'),
      message: trimmedMessage,
      sessionId: (input.sessionId && typeof input.sessionId === 'string' ? input.sessionId.trim() : input.businessId!.trim()),
      confirm: input.confirm === true,
      language,
    },
  };
}

// Rate limiting helper (simple in-memory, use Redis in production)
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps.get(identifier) || [];
  
  // Filter to only timestamps within window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  requestTimestamps.set(identifier, recentTimestamps);
  
  return true; // Allowed
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestTimestamps.entries()) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      requestTimestamps.delete(key);
    } else {
      requestTimestamps.set(key, recent);
    }
  }
}, 60 * 1000); // Clean every minute
