/**
 * Utility functions for checking owner access via HttpOnly cookies
 * Replaces client-side sessionStorage checks
 */

/**
 * Check if user has owner access for a shop via HttpOnly cookie
 * @param shopId - The shop ID to check access for
 * @returns Promise<boolean> - true if access is granted, false otherwise
 */
export async function hasOwnerAccess(shopId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/.netlify/functions/check-cookie?shopId=${encodeURIComponent(shopId)}`,
      {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return data.success === true && data.hasAccess === true;
  } catch (error) {
    console.error('Error checking owner access:', error);
    return false;
  }
}

/**
 * Clear owner access cookie by calling logout endpoint
 * Note: This should be handled server-side, but we provide a client-side helper
 */
export async function clearOwnerAccess(shopId: string): Promise<void> {
  try {
    await fetch(`/.netlify/functions/clear-cookie?shopId=${encodeURIComponent(shopId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error clearing owner access:', error);
  }
}

