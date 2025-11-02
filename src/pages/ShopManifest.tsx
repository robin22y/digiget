import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Dynamic manifest route for shop PWAs
 * Serves manifest.json with shop-specific name and icon
 */
export default function ShopManifest() {
  const { code } = useParams();

  useEffect(() => {
    if (!code) {
      return;
    }

    // Load shop data and return manifest JSON
    const loadManifest = async () => {
      try {
        const { data: shop, error } = await supabase
          .from('shops')
          .select('id, shop_name, short_code')
          .eq('short_code', code)
          .maybeSingle();

        if (error || !shop) {
          // Return 404 manifest if shop not found
          const manifest = {
            name: 'Shop Not Found',
            short_name: 'Not Found',
            description: 'Shop not found',
            start_url: '/',
            display: 'standalone',
            theme_color: '#2563EB',
          };
          document.body.innerHTML = JSON.stringify(manifest, null, 2);
          return;
        }

        // Generate shop initials for icon
        const getInitials = (name: string): string => {
          return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        };

        const initials = getInitials(shop.shop_name);

        const manifest = {
          name: `${shop.shop_name} - DigiGet`,
          short_name: shop.shop_name.length > 20 
            ? shop.shop_name.substring(0, 20) 
            : shop.shop_name,
          description: `Staff clock in and customer check-in for ${shop.shop_name}`,
          start_url: `/shop/${shop.short_code}`,
          scope: `/shop/${shop.short_code}`,
          display: 'standalone',
          background_color: '#f5f5f7',
          theme_color: '#2563EB',
          orientation: 'portrait-primary',
          icons: [
            {
              src: `/shop/${shop.short_code}/icon?size=192`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: `/shop/${shop.short_code}/icon?size=512`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Clock In/Out',
              short_name: 'Clock',
              description: 'Staff clock in or out',
              url: `/shop/${shop.short_code}?action=clock`,
              icons: [{ src: `/shop/${shop.short_code}/icon?size=96`, sizes: '96x96' }]
            },
            {
              name: 'Check In Customer',
              short_name: 'Customer',
              description: 'Check in customer and award points',
              url: `/shop/${shop.short_code}?action=customer`,
              icons: [{ src: `/shop/${shop.short_code}/icon?size=96`, sizes: '96x96' }]
            }
          ],
          categories: ['business', 'productivity']
        };

        // For client-side rendering, we need to set the content type differently
        // In a real server environment, this would be set via HTTP headers
        // For now, we'll output JSON that can be consumed by the browser
        const jsonStr = JSON.stringify(manifest, null, 2);
        
        // Create a download link or display
        document.body.innerHTML = `<pre style="padding: 20px; font-family: monospace; white-space: pre-wrap;">${jsonStr}</pre>`;
      } catch (error) {
        console.error('Error loading shop manifest:', error);
      }
    };

    loadManifest();
  }, [code]);

  // Return empty div - content will be set via innerHTML
  return <div style={{ display: 'none' }} />;
}

