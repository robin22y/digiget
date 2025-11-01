/**
 * NFC Tag ID Generator
 * 
 * Generates unique NFC tag IDs for shops in the format:
 * DIGIGET-XXXXXXXXXXXX
 * 
 * Where X is a random alphanumeric character (no confusing chars like 0, O, I, 1)
 */

/**
 * Generates a random string of specified length
 * Uses only unambiguous characters (no 0, O, I, 1, l)
 */
export function generateRandomString(length: number): string {
  // Characters that are easy to distinguish (no 0, O, I, 1, l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a unique NFC tag ID for a shop
 * Format: DIGIGET-XXXXXXXXXXXX (12 random chars)
 */
export function generateNFCTagId(): string {
  return `DIGIGET-${generateRandomString(12)}`;
}

/**
 * Sets up a shop with an NFC tag (for first 20 shops)
 * Assigns a unique tag ID and activates it
 */
export async function setupShopWithNFC(shopId: string): Promise<string | null> {
  const { supabase } = await import('../lib/supabase');
  
  // Generate unique NFC tag ID
  let nfcTagId = generateNFCTagId();
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure uniqueness (check if tag ID already exists)
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('nfc_tag_id', nfcTagId)
      .maybeSingle();
    
    if (!existing) {
      // Tag ID is unique
      break;
    }
    
    // Collision - generate new one
    nfcTagId = generateNFCTagId();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.error('Failed to generate unique NFC tag ID after multiple attempts');
    return null;
  }

  // Update shop with NFC tag
  const { error } = await supabase
    .from('shops')
    .update({
      nfc_tag_id: nfcTagId,
      nfc_tag_active: true,
      require_nfc: false, // Don't force it yet
      allow_gps_fallback: true, // Allow GPS as backup
    })
    .eq('id', shopId);

  if (error) {
    console.error('Failed to assign NFC tag:', error);
    return null;
  }

  return nfcTagId;
}

/**
 * Gets the NFC clock-in URL for a shop
 */
export function getNFCClockInURL(tagId: string): string {
  return `${window.location.origin}/nfc-clock?tag=${tagId}`;
}

/**
 * Validates NFC tag ID format
 */
export function isValidNFCTagId(tagId: string): boolean {
  return /^DIGIGET-[A-Z2-9]{12}$/.test(tagId);
}

