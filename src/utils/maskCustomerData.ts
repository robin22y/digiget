/**
 * Utility functions to mask customer identifiers for privacy
 */

/**
 * Mask phone number
 * Examples:
 * "+44 7123 456789" -> "+44 7*** 56789"
 * "07123456789" -> "07*** 6789"
 * "1234567890" -> "1*** 7890"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all spaces and non-digit characters except +
  const cleaned = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
  
  // If it starts with + (international format)
  if (cleaned.startsWith('+')) {
    // Keep country code and first digit, mask middle, show last 5 digits
    const match = cleaned.match(/^(\+\d{1,3})(\d)(\d{3,})(\d{5})$/);
    if (match) {
      const [, countryCode, firstDigit, middle, lastFive] = match;
      return `${countryCode} ${firstDigit}*** ${lastFive}`;
    }
    // Fallback: show first 4 chars and last 4, mask the rest
    if (cleaned.length > 8) {
      return `${cleaned.substring(0, 4)}*** ${cleaned.substring(cleaned.length - 4)}`;
    }
    return `${cleaned.substring(0, 2)}***`;
  }
  
  // UK format or other formats without +
  if (cleaned.length >= 7) {
    // Show first 2 digits and last 4, mask the middle
    return `${cleaned.substring(0, 2)}*** ${cleaned.substring(cleaned.length - 4)}`;
  }
  
  // Short numbers: show first char, mask rest, show last char
  if (cleaned.length >= 3) {
    return `${cleaned[0]}***${cleaned[cleaned.length - 1]}`;
  }
  
  // Very short: just mask
  return '***';
}

/**
 * Mask email address
 * Examples:
 * "john.doe@example.com" -> "jo***@example.com"
 * "test@email.co.uk" -> "te***@email.co.uk"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'N/A';
  
  const [localPart, domain] = email.split('@');
  if (!domain) return '***';
  
  if (localPart.length <= 2) {
    return `***@${domain}`;
  }
  
  // Show first 2 chars, mask the rest of local part
  return `${localPart.substring(0, 2)}***@${domain}`;
}

/**
 * Mask customer ID
 * Examples:
 * "a07140e1-650d-45e1-808c-6f3d36492d8e" -> "CUS******2d8e"
 * "12345" -> "CUS**5"
 */
export function maskCustomerId(customerId: string | null | undefined): string {
  if (!customerId) return 'N/A';
  
  // Remove dashes for UUIDs
  const cleaned = customerId.replace(/-/g, '');
  
  if (cleaned.length >= 8) {
    // Show "CUS" prefix and last 4 chars
    return `CUS****${cleaned.substring(cleaned.length - 4)}`;
  }
  
  // Short IDs: show prefix and last char
  if (cleaned.length >= 2) {
    return `CUS**${cleaned.substring(cleaned.length - 1)}`;
  }
  
  return 'CUS****';
}

/**
 * Mask customer name
 * Examples:
 * "John Doe" -> "J*** D***"
 * "John" -> "J***"
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return 'Anonymous';
  
  const parts = name.trim().split(' ');
  
  if (parts.length === 1) {
    // Single name: show first char
    return `${name[0]}***`;
  }
  
  // Multiple names: show first char of each, mask the rest
  return parts.map(part => `${part[0]}***`).join(' ');
}

