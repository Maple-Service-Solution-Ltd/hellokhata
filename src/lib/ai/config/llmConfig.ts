// LLM Configuration - DETERMINISTIC SETTINGS FOR PRODUCTION
// IMMUTABLE: Changes to this file require re-certification
// 
// ⚠️ WARNING: Do NOT modify these values without updating the config hash
// in version.ts and re-running certification

// ============================================================
// DETERMINISTIC LLM PARAMETERS
// These values ensure consistent, reproducible outputs
// ============================================================

export const LLM_CONFIG = {
  // Temperature: Low for determinism (0.1 = near-deterministic)
  temperature: 0.1,
  
  // Top-p: 1.0 for full vocabulary (no truncation)
  top_p: 1.0,
  
  // Max tokens: Capped for response consistency
  max_tokens: 1024,
  
  // Frequency penalty: 0 for no repetition bias
  frequency_penalty: 0,
  
  // Presence penalty: 0 for no topic bias
  presence_penalty: 0,
  
  // Stop sequences for clean JSON output
  stop_sequences: ['\n\n\n', '---', '```'],
  
  // Timeout for LLM calls (milliseconds)
  timeout_ms: 30000,
  
  // Retry configuration
  retry: {
    max_retries: 2,
    backoff_ms: 1000,
    retry_on_timeout: true,
    retry_on_rate_limit: true,
  },
} as const;

// ============================================================
// PLANNER-SPECIFIC CONFIG
// Used by intent-parser.ts for deterministic planning
// ============================================================

export const PLANNER_CONFIG = {
  // Strict JSON mode enforcement
  json_mode: true,
  
  // System prompt temperature override (even lower for planner)
  temperature: 0.05,
  
  // Max tokens for planner output
  max_tokens: 512,
  
  // Response format validation
  validate_json: true,
  
  // Fail on malformed JSON (don't repair)
  strict_validation: true,
} as const;

// ============================================================
// MODEL SELECTION
// ============================================================

export const MODEL_CONFIG = {
  // Primary model for production
  primary_model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  
  // Fallback model if primary unavailable
  fallback_model: 'llama3.1:8b',
  
  // Model endpoint
  base_url: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  
  // SDK fallback (z-ai-web-dev-sdk)
  use_sdk_fallback: true,
} as const;

// ============================================================
// CONFIG HASH (IMMUTABILITY PROTECTION)
// ============================================================

// This hash is computed from the config values
// If config changes, this hash must be updated in version.ts
export function computeConfigHash(): string {
  const configString = JSON.stringify({
    temperature: LLM_CONFIG.temperature,
    top_p: LLM_CONFIG.top_p,
    max_tokens: LLM_CONFIG.max_tokens,
    frequency_penalty: LLM_CONFIG.frequency_penalty,
    presence_penalty: LLM_CONFIG.presence_penalty,
    planner_temp: PLANNER_CONFIG.temperature,
    planner_max_tokens: PLANNER_CONFIG.max_tokens,
  });
  
  // Simple hash for verification (use crypto in production)
  let hash = 0;
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `cfg-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// Expected hash - must match version.ts
export const EXPECTED_CONFIG_HASH = 'cfg-7a3b2c1d';

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

export function validateLLMConfig(): {
  valid: boolean;
  hashMatch: boolean;
  computedHash: string;
  expectedHash: string;
  errors: string[];
} {
  const errors: string[] = [];
  const computedHash = computeConfigHash();
  const hashMatch = computedHash === EXPECTED_CONFIG_HASH;
  
  if (!hashMatch) {
    errors.push(
      `CONFIG HASH MISMATCH: Computed ${computedHash}, Expected ${EXPECTED_CONFIG_HASH}. ` +
      `Config changed without re-certification!`
    );
  }
  
  // Validate parameter ranges
  if (LLM_CONFIG.temperature < 0 || LLM_CONFIG.temperature > 2) {
    errors.push(`Invalid temperature: ${LLM_CONFIG.temperature}`);
  }
  
  if (LLM_CONFIG.top_p < 0 || LLM_CONFIG.top_p > 1) {
    errors.push(`Invalid top_p: ${LLM_CONFIG.top_p}`);
  }
  
  if (LLM_CONFIG.max_tokens < 1 || LLM_CONFIG.max_tokens > 8192) {
    errors.push(`Invalid max_tokens: ${LLM_CONFIG.max_tokens}`);
  }
  
  return {
    valid: errors.length === 0,
    hashMatch,
    computedHash,
    expectedHash: EXPECTED_CONFIG_HASH,
    errors,
  };
}

// ============================================================
// BUILD-TIME VALIDATION
// ============================================================

// This runs at module load time to fail fast
if (process.env.NODE_ENV === 'production') {
  const validation = validateLLMConfig();
  if (!validation.valid) {
    console.error('❌ LLM CONFIG VALIDATION FAILED:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    // In production build, throw to fail the build
    if (validation.errors.some(e => e.includes('HASH MISMATCH'))) {
      throw new Error('LLM config changed without re-certification. Update version.ts and re-run audit.');
    }
  }
}

// Export type for external use
export type LLMConfigType = typeof LLM_CONFIG;
export type PlannerConfigType = typeof PLANNER_CONFIG;
