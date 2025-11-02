/**
 * Utility to manage dynamic PWA manifests based on route
 */

export type PWAType = 'owner' | 'shop' | 'default';

/**
 * Update manifest link and meta tags based on current route
 */
export function updateManifest(type: PWAType, shopCode?: string, shopName?: string) {
  // Update manifest link
  let manifestLink = document.querySelector('#manifest-link') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.id = 'manifest-link';
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }

  // Update theme color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }

  // Update Apple meta tags
  let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
  if (!appleCapable) {
    appleCapable = document.createElement('meta');
    appleCapable.name = 'apple-mobile-web-app-capable';
    document.head.appendChild(appleCapable);
  }
  appleCapable.content = 'yes';

  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitle);
  }

  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }

  switch (type) {
    case 'owner':
      manifestLink.href = '/owner-manifest.json';
      themeColorMeta.content = '#2563EB';
      appleTitle.content = 'DigiGet Owner';
      appleIcon.href = '/icon-192.png';
      break;

    case 'shop':
      if (shopCode) {
        // Use API endpoint for manifest (served by Netlify Function)
        manifestLink.href = `/api/shop/${shopCode}/manifest.json`;
        themeColorMeta.content = '#2563EB';
        appleTitle.content = shopName || 'DigiGet Shop';
        appleIcon.href = `/api/shop/${shopCode}/icon?size=192`;
      }
      break;

    default:
      manifestLink.href = '/manifest.json';
      themeColorMeta.content = '#2563EB';
      appleTitle.content = 'DigiGet';
      appleIcon.href = '/icon-192.png';
      break;
  }
}

/**
 * Detect PWA type from current pathname
 */
export function detectPWAType(pathname: string): { type: PWAType; shopCode?: string } {
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin')) {
    return { type: 'owner' };
  }
  
  const shopMatch = pathname.match(/^\/shop\/([^\/]+)/);
  if (shopMatch) {
    return { type: 'shop', shopCode: shopMatch[1] };
  }

  return { type: 'default' };
}

