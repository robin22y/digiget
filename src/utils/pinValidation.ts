/**
 * PIN Validation Utilities
 * 
 * IMPORTANT: 
 * - Owner PIN (Console PIN): 6 digits (for accessing shop settings)
 * - Staff PIN: 4 digits (for clock in/out) - UNCHANGED
 * 
 * Only the owner/console PIN has been updated to 6 digits for security.
 * Staff PINs remain 4 digits for quick entry during clock in/out.
 */

/**
 * Validates owner PIN format (6 digits)
 */
export function validateOwnerPIN(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Validates staff PIN format (4 digits)
 */
export function validateStaffPIN(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Checks if an owner PIN is weak (uses simple patterns)
 */
export function isWeakOwnerPIN(pin: string): boolean {
  if (!validateOwnerPIN(pin)) {
    return false; // Invalid format, not weak
  }

  const weakPatterns = [
    '000000',
    '111111',
    '222222',
    '333333',
    '444444',
    '555555',
    '666666',
    '777777',
    '888888',
    '999999',
    '123456',
    '654321',
    '112233',
    '121212',
    '123123',
    '000123',
    '123000',
  ];

  return weakPatterns.includes(pin);
}

/**
 * Gets weak PIN suggestions/reasons
 */
export function getWeakPINReason(pin: string): string | null {
  if (!isWeakOwnerPIN(pin)) {
    return null;
  }

  if (pin === '000000') {
    return 'This is the default PIN. Please change it for security.';
  }

  if (/^(\d)\1{5}$/.test(pin)) {
    return 'Avoid using the same digit 6 times.';
  }

  if (pin === '123456' || pin === '654321') {
    return 'This is a very common PIN. Please choose something more secure.';
  }

  if (/^(.)\1(.)\2(.)\3$/.test(pin)) {
    return 'Avoid repeating patterns. Use unique digits.';
  }

  return 'Please choose a stronger PIN. Avoid simple patterns.';
}

/**
 * Checks if PIN is the default value
 */
export function isDefaultOwnerPIN(pin: string | null | undefined): boolean {
  return !pin || pin === '000000';
}

/**
 * Rate limiting for PIN attempts
 */
interface PINAttempt {
  attempts: number;
  lockoutUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

const attemptStorage: Map<string, PINAttempt> = new Map();

/**
 * Checks if an IP/key is locked out from PIN attempts
 */
export function isLockedOut(identifier: string): boolean {
  const attempt = attemptStorage.get(identifier);
  if (!attempt || !attempt.lockoutUntil) {
    return false;
  }

  if (Date.now() < attempt.lockoutUntil) {
    return true;
  }

  // Lockout expired, reset
  attemptStorage.delete(identifier);
  return false;
}

/**
 * Gets remaining lockout time in minutes
 */
export function getLockoutTimeRemaining(identifier: string): number | null {
  const attempt = attemptStorage.get(identifier);
  if (!attempt || !attempt.lockoutUntil) {
    return null;
  }

  const remaining = attempt.lockoutUntil - Date.now();
  if (remaining <= 0) {
    attemptStorage.delete(identifier);
    return null;
  }

  return Math.ceil(remaining / 60000); // Convert to minutes
}

/**
 * Records a failed PIN attempt
 */
export function recordFailedAttempt(identifier: string): number {
  const attempt = attemptStorage.get(identifier) || {
    attempts: 0,
    lockoutUntil: null,
  };

  attempt.attempts += 1;

  if (attempt.attempts >= MAX_ATTEMPTS) {
    attempt.lockoutUntil = Date.now() + LOCKOUT_TIME;
    attemptStorage.set(identifier, attempt);
    return 0; // No attempts remaining
  }

  attemptStorage.set(identifier, attempt);
  return MAX_ATTEMPTS - attempt.attempts;
}

/**
 * Records a successful PIN attempt (resets counter)
 */
export function recordSuccessfulAttempt(identifier: string): void {
  attemptStorage.delete(identifier);
}

/**
 * Gets remaining attempts for an identifier
 */
export function getRemainingAttempts(identifier: string): number {
  const attempt = attemptStorage.get(identifier);
  if (!attempt || !attempt.lockoutUntil) {
    return MAX_ATTEMPTS;
  }

  if (Date.now() >= attempt.lockoutUntil) {
    // Lockout expired, reset
    attemptStorage.delete(identifier);
    return MAX_ATTEMPTS;
  }

  return 0; // Locked out
}

