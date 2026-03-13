// Prompt Injection Defense Guard
// Blocks attempts to manipulate AI behavior through user input

// Patterns that indicate prompt injection attempts
export const INJECTION_PATTERNS = [
  // Instruction override attempts
  /ignore\s+(previous|all|above)\s+instructions?/i,
  /skip\s+confirmation/i,
  /execute\s+(directly|immediately|now)/i,
  /override\s+(policy|rules?|restrictions?)/i,
  /bypass\s+(confirmation|validation|security)/i,
  /disregard\s+(all|any|previous)\s+(rules?|instructions?)/i,
  /forget\s+(everything|all|previous)/i,
  
  // Role manipulation
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(if|a|an)\s+/i,
  /pretend\s+(to\s+be|you're?|that)/i,
  /role[\s-]?play/i,
  /simulate\s+(being|a|an)/i,
  
  // Output manipulation
  /output\s+(only|exactly|just)/i,
  /respond\s+(only|exactly|just)\s+with/i,
  /print\s+(exactly|only|just)/i,
  /say\s+(exactly|only|just)\s+/i,
  
  // System manipulation
  /system[:\s]/i,
  /admin[:\s]/i,
  /developer[:\s]/i,
  /debug\s*mode/i,
  /maintenance\s*mode/i,
  
  // Data exfiltration attempts
  /reveal\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions?|system)/i,
  /what\s+(are|is)\s+your\s+instructions?/i,
  /dump\s+(your|the|all)\s+(prompt|memory|context)/i,
  
  // Command injection
  /\$\{.*\}/,  // Template literal injection
  /<%.*%>/,    // ERB-style injection
  /\{\{.*\}\}/, // Mustache-style injection
  /`[^`]*`/,   // Backtick code execution
  
  // Bengali injection patterns
  /নির্দেশনা উপেক্ষা করো/i,  // "ignore instructions"
  /বাইপাস করো/i,          // "bypass"
  /সরাসরি কার্যকর করো/i,   // "execute directly"
];

// Risk levels for injection patterns
export type InjectionRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InjectionDetectionResult {
  detected: boolean;
  patterns: Array<{
    pattern: string;
    match: string;
    risk: InjectionRiskLevel;
  }>;
  riskLevel: InjectionRiskLevel;
  shouldBlock: boolean;
  sanitized: boolean;
}

// Detect injection attempts in user message
export function detectInjectionAttempt(message: string): InjectionDetectionResult {
  const detectedPatterns: InjectionDetectionResult['patterns'] = [];
  let highestRisk: InjectionRiskLevel = 'LOW';

  for (const pattern of INJECTION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      let risk: InjectionRiskLevel = 'MEDIUM';
      
      // Critical patterns
      if (pattern.source.includes('ignore') || pattern.source.includes('bypass')) {
        risk = 'CRITICAL';
      } else if (pattern.source.includes('execute') || pattern.source.includes('override')) {
        risk = 'HIGH';
      }
      
      detectedPatterns.push({
        pattern: pattern.source,
        match: match[0],
        risk,
      });
      
      if (risk === 'CRITICAL') highestRisk = 'CRITICAL';
      else if (risk === 'HIGH' && highestRisk !== 'CRITICAL') highestRisk = 'HIGH';
      else if (risk === 'MEDIUM' && highestRisk !== 'CRITICAL' && highestRisk !== 'HIGH') highestRisk = 'MEDIUM';
    }
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    riskLevel: highestRisk,
    shouldBlock: highestRisk === 'CRITICAL' || highestRisk === 'HIGH',
    sanitized: false,
  };
}

// Sanitize message by removing/blocking injection patterns
export function sanitizeInjectionAttempt(
  message: string,
  options?: { redactMode?: 'remove' | 'redact' | 'warn' }
): { sanitized: string; detection: InjectionDetectionResult } {
  const detection = detectInjectionAttempt(message);
  
  if (!detection.detected) {
    return { sanitized: message, detection };
  }

  const mode = options?.redactMode || 'redact';
  let sanitized = message;

  for (const { pattern } of detection.patterns) {
    if (mode === 'remove') {
      sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '');
    } else if (mode === 'redact') {
      sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '[BLOCKED]');
    }
  }

  return {
    sanitized: sanitized.trim(),
    detection: { ...detection, sanitized: true },
  };
}

// Tool Argument Sanitization
export function sanitizeToolArguments(
  toolName: string,
  args: Record<string, unknown>
): { valid: boolean; sanitized: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    // Check for negative quantities (not allowed)
    if (key.toLowerCase().includes('quantity') && typeof value === 'number') {
      if (value < 0) {
        errors.push(`Negative quantity not allowed: ${key}=${value}`);
        continue;
      }
      if (value > 10000) {
        errors.push(`Quantity exceeds maximum: ${key}=${value} (max: 10000)`);
        continue;
      }
    }

    // Check for negative amounts
    if ((key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) && typeof value === 'number') {
      if (value < 0) {
        errors.push(`Negative amount not allowed: ${key}=${value}`);
        continue;
      }
      if (value > 100000000) { // 10 crore limit
        errors.push(`Amount exceeds maximum: ${key}=${value}`);
        continue;
      }
    }

    // Check for cross-tenant access attempts
    if (key.toLowerCase().includes('businessid') || key.toLowerCase().includes('userid')) {
      // These should come from session, not user input
      errors.push(`Cross-tenant access attempt: ${key} should not be in user input`);
      continue;
    }

    // Check for SQL injection in strings
    if (typeof value === 'string') {
      const sqlPatterns = [
        /('|")\s*;\s*(drop|delete|truncate|update|insert)/i,
        /union\s+select/i,
        /--\s*$/m,
        /\/\*.*\*\//s,
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          errors.push(`Potential SQL injection in ${key}`);
          continue;
        }
      }
    }

    // Pass through if valid
    sanitized[key] = value;
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}
