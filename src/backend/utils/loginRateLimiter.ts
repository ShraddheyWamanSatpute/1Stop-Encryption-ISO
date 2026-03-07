/**
 * Client-side login rate limiter for the main 1Stop app.
 *
 * Provides brute-force protection on the client side (ISO 27001 A.9, SOC 2 CC6).
 * Firebase Auth also enforces server-side rate limiting (auth/too-many-requests),
 * but this adds an additional layer to reduce unnecessary network requests.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  resetTime: number;
}

const attempts = new Map<string, AttemptRecord>();

/**
 * Check if a login attempt is allowed for the given email.
 * Returns true if allowed, false if rate-limited.
 */
export function isLoginAllowed(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetTime) {
    attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get remaining lockout time in seconds for a rate-limited email.
 * Returns 0 if not rate-limited.
 */
export function getRemainingLockoutSeconds(email: string): number {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetTime || record.count < MAX_ATTEMPTS) {
    return 0;
  }

  return Math.ceil((record.resetTime - now) / 1000);
}
