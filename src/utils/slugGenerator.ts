/**
 * Generate a URL-friendly slug from a shop name
 * @param shopName - The shop name to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(shopName: string): string {
  // Convert to lowercase
  let slug = shopName.toLowerCase().trim();
  
  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // If empty, return a default
  if (!slug || slug.length === 0) {
    slug = 'shop';
  }
  
  // Limit length to 50 characters
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    // Remove trailing hyphen if truncated
    slug = slug.replace(/-+$/, '');
  }
  
  return slug;
}

/**
 * Generate a unique slug by appending a counter if needed
 * This should be called on the backend, but provided for client-side validation
 */
export async function generateUniqueSlug(
  baseSlug: string,
  excludeShopId?: string
): Promise<string> {
  const { supabase } = await import('../lib/supabase');
  
  let slug = baseSlug;
  let counter = 0;
  
  // Check if slug exists
  while (true) {
    let query = supabase
      .from('shops')
      .select('id')
      .eq('slug', slug)
      .limit(1);
    
    // Exclude current shop if updating
    if (excludeShopId) {
      query = query.neq('id', excludeShopId);
    }
    
    const { data } = await query;
    
    // If slug doesn't exist, we're done
    if (!data || data.length === 0) {
      break;
    }
    
    // Otherwise, append counter and try again
    counter++;
    slug = `${baseSlug}-${counter}`;
    
    // Prevent infinite loops
    if (counter > 1000) {
      // Fallback: use timestamp
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

