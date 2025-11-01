/**
 * Input validation utilities
 * Validates and sanitizes user inputs before processing
 */

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // UK phone format: 07XXX XXX XXX or +44 7XXX XXX XXX
  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
  const ukMobileRegex = /^(\+44|0)7\d{9}$/;
  return ukMobileRegex.test(cleaned);
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
  
  // Remove +44 and replace with 0
  const normalized = cleaned.replace(/^\+44/, '0');
  
  // Format as 07XXX XXX XXX
  if (normalized.match(/^07\d{9}$/)) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  
  return cleaned;
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validatePIN(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function validateShopName(name: string): boolean {
  if (!name) return false;
  return name.length >= 2 && name.length <= 100;
}

export function validateHourlyRate(rate: number): boolean {
  return !isNaN(rate) && rate >= 0 && rate <= 1000;
}

export function validatePoints(points: number): boolean {
  return !isNaN(points) && Number.isInteger(points) && points >= 0 && points <= 10000;
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any HTML/script tags
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeName(name: string): string {
  if (!name) return '';
  
  // Allow letters, spaces, hyphens, apostrophes
  return name
    .replace(/[^a-zA-Z\s'-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 100);
}

export function validateLocation(
  latitude: number,
  longitude: number
): boolean {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validatePassword(password: string): boolean {
  // Minimum 8 characters, at least one letter and one number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

export function validateTime(timeString: string): boolean {
  // Format: HH:MM (24-hour)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeString);
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

