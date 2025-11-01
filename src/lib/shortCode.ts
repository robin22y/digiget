import { supabase } from './supabase';

// Allowed characters: A-Z (except I, O), 2-9
// Excluded: 0 (looks like O), 1 (looks like I or l), I (looks like l or 1), O (looks like 0)
const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a random 6-character short code
 * Format: 6 characters from allowed set (no confusing chars)
 */
export function generateShortCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  return code;
}

/**
 * Generates a unique short code that doesn't already exist in the database
 * @param maxAttempts Maximum number of attempts to generate a unique code
 * @returns A unique 6-character short code
 */
export async function generateUniqueShortCode(maxAttempts: number = 10): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = generateShortCode();
    
    // Check if code already exists
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('short_code', code)
      .maybeSingle();

    // If no existing shop with this code, it's unique
    if (!data && (error?.code === 'PGRST116' || !error)) {
      return code;
    }

    attempts++;
  }

  throw new Error(`Failed to generate unique short code after ${maxAttempts} attempts`);
}

/**
 * Validates a short code format
 * @param code The code to validate
 * @returns true if valid, false otherwise
 */
export function validateShortCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false;
  }
  
  // Check that all characters are in the allowed set
  const allowedSet = new Set(ALLOWED_CHARS.split(''));
  return code.split('').every(char => allowedSet.has(char));
}

