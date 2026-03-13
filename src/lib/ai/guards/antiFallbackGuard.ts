// Anti-Fallback Guard - Blocks problematic AI response patterns
// PART OF PHASE 8 ZERO-TRUST AUDIT
// 
// This guard prevents AI from:
// - Apologizing instead of providing answers
// - Claiming inability instead of using tools
// - Using generic fallback responses
// - Providing advisory responses without tool execution

/**
 * Patterns that indicate problematic AI fallback responses
 * These should be BLOCKED and replaced with tool-driven responses
 */
export const BLOCKED_FALLBACK_PATTERNS = [
  // Apology patterns - HIGH RISK
  { pattern: /sorry[,.]/i, risk: 'HIGH', category: 'apology' },
  { pattern: /i apologize/i, risk: 'HIGH', category: 'apology' },
  { pattern: /i'm sorry/i, risk: 'HIGH', category: 'apology' },
  { pattern: /i am sorry/i, risk: 'HIGH', category: 'apology' },
  { pattern: /দুঃখিত/i, risk: 'HIGH', category: 'apology' }, // Bengali "sorry"
  
  // Ability denial patterns - HIGH RISK
  { pattern: /i cannot/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /i can't/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /i could not/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /i couldn't/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /i am unable/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /i'm unable/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /unable to/i, risk: 'HIGH', category: 'ability_denial' },
  { pattern: /আমি পারছি না/i, risk: 'HIGH', category: 'ability_denial' }, // Bengali "I cannot"
  
  // Knowledge denial patterns - HIGH RISK
  { pattern: /i don't know/i, risk: 'HIGH', category: 'knowledge_denial' },
  { pattern: /i do not know/i, risk: 'HIGH', category: 'knowledge_denial' },
  { pattern: /i'm not sure/i, risk: 'HIGH', category: 'knowledge_denial' },
  { pattern: /i am not sure/i, risk: 'HIGH', category: 'knowledge_denial' },
  { pattern: /আমি জানি না/i, risk: 'HIGH', category: 'knowledge_denial' }, // Bengali "I don't know"
  
  // Advisory patterns - MEDIUM RISK
  { pattern: /you would need to/i, risk: 'MEDIUM', category: 'advisory' },
  { pattern: /you should/i, risk: 'MEDIUM', category: 'advisory' },
  { pattern: /i suggest/i, risk: 'MEDIUM', category: 'advisory' },
  { pattern: /i recommend/i, risk: 'MEDIUM', category: 'advisory' },
  { pattern: /please try/i, risk: 'MEDIUM', category: 'advisory' },
  { pattern: /try asking/i, risk: 'MEDIUM', category: 'advisory' },
  
  // Generic fallback patterns - MEDIUM RISK
  { pattern: /please try again/i, risk: 'MEDIUM', category: 'generic_fallback' },
  { pattern: /try again later/i, risk: 'MEDIUM', category: 'generic_fallback' },
  { pattern: /an error occurred/i, risk: 'MEDIUM', category: 'generic_fallback' },
  { pattern: /let me check/i, risk: 'MEDIUM', category: 'generic_fallback' },
  { pattern: /unfortunately/i, risk: 'MEDIUM', category: 'generic_fallback' },
];

/**
 * Result of fallback pattern detection
 */
export interface FallbackDetectionResult {
  detected: boolean;
  patterns: Array<{
    pattern: string;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    match: string;
  }>;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  shouldBlock: boolean;
}

/**
 * Detect problematic fallback patterns in AI response
 */
export function detectFallbackPatterns(response: string): FallbackDetectionResult {
  const detectedPatterns: FallbackDetectionResult['patterns'] = [];
  let highestRisk: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
  
  for (const { pattern, risk, category } of BLOCKED_FALLBACK_PATTERNS) {
    const match = response.match(pattern);
    if (match) {
      detectedPatterns.push({
        pattern: pattern.source,
        risk: risk as 'HIGH' | 'MEDIUM',
        category,
        match: match[0],
      });
      
      // Update highest risk level
      if (risk === 'HIGH' && highestRisk !== 'HIGH') {
        highestRisk = 'HIGH';
      } else if (risk === 'MEDIUM' && highestRisk === 'NONE') {
        highestRisk = 'MEDIUM';
      }
    }
  }
  
  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    riskLevel: highestRisk,
    shouldBlock: highestRisk === 'HIGH',
  };
}

/**
 * Validate AI response for fallback patterns
 * Returns blocked status and suggested replacement
 */
export function validateNoFallback(
  response: string,
  context?: { intent?: string; language?: 'en' | 'bn' }
): {
  valid: boolean;
  blocked: boolean;
  detection: FallbackDetectionResult;
  suggestedReplacement?: string;
} {
  const detection = detectFallbackPatterns(response);
  
  if (!detection.detected) {
    return { valid: true, blocked: false, detection };
  }
  
  // Generate suggested replacement based on context
  let suggestedReplacement: string | undefined;
  
  if (detection.shouldBlock) {
    const language = context?.language || 'en';
    
    // Provide tool-driven alternatives
    if (context?.intent === 'query' || response.includes('cannot') || response.includes('could not')) {
      suggestedReplacement = language === 'bn'
        ? 'আপনার প্রশ্নের উত্তর দিতে ডেটা লোড করছি। অনুগ্রহ করে একটু অপেক্ষা করুন।'
        : 'Let me fetch the data to answer your question. Please wait a moment.';
    } else if (detection.patterns.some(p => p.category === 'apology')) {
      suggestedReplacement = language === 'bn'
        ? 'আমি এই বিষয়ে সাহায্য করতে পারি। আপনার প্রশ্ন কী?'
        : 'I can help with this. What is your question?';
    } else if (detection.patterns.some(p => p.category === 'knowledge_denial')) {
      suggestedReplacement = language === 'bn'
        ? 'আমি আপনার জন্য তথ্য খুঁজে বের করছি।'
        : 'Let me look up that information for you.';
    }
  }
  
  return {
    valid: !detection.shouldBlock,
    blocked: detection.shouldBlock,
    detection,
    suggestedReplacement,
  };
}

/**
 * Known safe fallback messages that are acceptable
 * These are system-level error messages, not AI responses
 */
export const SAFE_FALLBACK_MESSAGES = [
  // System error messages (not AI responses)
  'Session expired. Please log in again.',
  'Service temporarily unavailable. Please try again later.',
  'Network error. Please check your connection.',
  'Invalid session. Please try again.',
  'Action expired. Please try again.',
];

/**
 * Check if a message is a known safe fallback
 */
export function isSafeFallback(message: string): boolean {
  return SAFE_FALLBACK_MESSAGES.some(safe => 
    message.toLowerCase().includes(safe.toLowerCase())
  );
}

/**
 * Sanitize AI response by removing or replacing fallback patterns
 */
export function sanitizeFallbackResponse(
  response: string,
  options?: {
    language?: 'en' | 'bn';
    intent?: string;
    removeOnly?: boolean;
  }
): string {
  const detection = detectFallbackPatterns(response);
  
  if (!detection.detected) {
    return response;
  }
  
  // If only removing, strip out the problematic parts
  if (options?.removeOnly) {
    let sanitized = response;
    for (const { pattern } of detection.patterns) {
      sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '');
    }
    return sanitized.trim();
  }
  
  // Otherwise, use suggested replacement
  const validation = validateNoFallback(response, options);
  return validation.suggestedReplacement || response;
}

/**
 * Audit log entry for fallback detection
 */
export interface FallbackAuditEntry {
  timestamp: number;
  response: string;
  detection: FallbackDetectionResult;
  action: 'blocked' | 'warned' | 'passed';
  sessionId?: string;
  intent?: string;
}

/**
 * Fallback audit log for tracking violations
 */
export class FallbackAuditLog {
  private entries: FallbackAuditEntry[] = [];
  private maxEntries: number = 1000;
  
  log(entry: Omit<FallbackAuditEntry, 'timestamp'>): void {
    this.entries.push({
      ...entry,
      timestamp: Date.now(),
    });
    
    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }
  
  getEntries(options?: {
    riskLevel?: 'HIGH' | 'MEDIUM';
    action?: 'blocked' | 'warned' | 'passed';
    limit?: number;
  }): FallbackAuditEntry[] {
    let filtered = [...this.entries];
    
    if (options?.riskLevel) {
      filtered = filtered.filter(e => e.detection.riskLevel === options.riskLevel);
    }
    
    if (options?.action) {
      filtered = filtered.filter(e => e.action === options.action);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }
  
  getStats(): {
    total: number;
    blocked: number;
    warned: number;
    highRisk: number;
    mediumRisk: number;
  } {
    return {
      total: this.entries.length,
      blocked: this.entries.filter(e => e.action === 'blocked').length,
      warned: this.entries.filter(e => e.action === 'warned').length,
      highRisk: this.entries.filter(e => e.detection.riskLevel === 'HIGH').length,
      mediumRisk: this.entries.filter(e => e.detection.riskLevel === 'MEDIUM').length,
    };
  }
}

// Global audit log instance
export const fallbackAuditLog = new FallbackAuditLog();
