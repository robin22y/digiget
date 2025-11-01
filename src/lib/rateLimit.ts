/**
 * Simple client-side rate limiting
 * Note: Server-side rate limiting should also be implemented in edge functions
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an action should be rate limited
 * @param key Unique key for the rate limit (e.g., userId:action)
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    cleanupRateLimitStore(now);
  }

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Get time remaining until rate limit resets
 */
export function getRateLimitResetTime(key: string): number | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;

  const remaining = entry.resetAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

function cleanupRateLimitStore(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create a rate-limited function wrapper
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRequests: number,
  windowMs: number,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `rate_limit:${fn.name}`;

    if (!checkRateLimit(key, maxRequests, windowMs)) {
      const resetTime = getRateLimitResetTime(key);
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(
          (resetTime || 0) / 1000
        )} seconds.`
      );
    }

    return fn(...args);
  }) as T;
}

