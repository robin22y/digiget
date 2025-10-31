import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Shop {
  id: string;
  shop_name: string;
  location_name?: string | null;
  group_id?: string | null;
  user_id?: string;
  userRole?: 'owner' | 'manager' | 'staff';
}

interface ShopContextType {
  currentShop: Shop | null;
  accessibleShops: Shop[];
  isMultiLocation: boolean;
  switchShop: (shopId: string) => void;
  hasAccess: (shopId: string) => boolean;
  loading: boolean;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [accessibleShops, setAccessibleShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAccessibleShops();
    } else {
      setAccessibleShops([]);
      setCurrentShop(null);
      setLoading(false);
    }
  }, [user]);

  async function loadAccessibleShops() {
    if (!user) return;

    setLoading(true);
    try {
      // Check if user is super admin
      const { data: userData } = await supabase.auth.getUser();
      const isSuperAdmin = userData.user?.user_metadata?.role === 'super_admin';

      if (isSuperAdmin) {
        // Super admin sees all shops
        const { data: allShops } = await supabase
          .from('shops')
          .select('*')
          .order('shop_name');

        if (allShops) {
          const shops = allShops.map(shop => ({
            ...shop,
            userRole: 'owner' as const
          }));
          setAccessibleShops(shops);
          
          const savedShopId = localStorage.getItem('currentShopId');
          const shopToSet = shops.find(s => s.id === savedShopId) || shops[0];
          setCurrentShop(shopToSet);
        }
      } else {
        // Regular users: get shops from user_shop_access
        // First try the new user_shop_access table (if migrations are run)
        let access = null;
        let accessError = null;
        
        try {
          // Query user_shop_access WITHOUT shops(*) join to avoid RLS recursion
          const result = await supabase
            .from('user_shop_access')
            .select('shop_id, role')
            .eq('user_id', user.id);
          
          access = result.data;
          accessError = result.error;
          
          // If we got access records, fetch shops separately to avoid recursion
          if (access && access.length > 0) {
            const shopIds = access.map((a: any) => a.shop_id);
            const { data: shopData, error: shopsError } = await supabase
              .from('shops')
              .select('*')
              .in('id', shopIds);
            
            if (!shopsError && shopData) {
              const shops = shopData.map(shop => {
                const accessRecord = access.find((a: any) => a.shop_id === shop.id);
                return {
                  ...shop,
                  userRole: (accessRecord?.role || 'owner') as 'owner' | 'manager' | 'staff'
                };
              });
              
              setAccessibleShops(shops);
              const savedShopId = localStorage.getItem('currentShopId');
              const shopToSet = shops.find(s => s.id === savedShopId) || shops[0];
              setCurrentShop(shopToSet);
              return; // Exit early if successful
            }
          }
        } catch (err: any) {
          // Table doesn't exist yet - will fall back to old method
          accessError = err;
        }

        if (accessError) {
          // Table doesn't exist or other error - use fallback method
          // Only log if it's not a 404 (table doesn't exist)
          if (accessError.code !== 'PGRST116' && accessError.status !== 404) {
            console.error('Error loading shop access:', accessError);
          }
          
          // Fallback: check if user owns shops directly (backward compatibility)
          const { data: ownedShops } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);

          if (ownedShops && ownedShops.length > 0) {
            const shops = ownedShops.map(shop => ({
              ...shop,
              userRole: 'owner' as const
            }));
            setAccessibleShops(shops);
            const savedShopId = localStorage.getItem('currentShopId');
            const shopToSet = shops.find(s => s.id === savedShopId) || shops[0];
            setCurrentShop(shopToSet);
          }
        } else {
          // No shop access from user_shop_access - try backward compatibility
          const { data: ownedShops } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);

          if (ownedShops && ownedShops.length > 0) {
            const shops = ownedShops.map(shop => ({
              ...shop,
              userRole: 'owner' as const
            }));
            setAccessibleShops(shops);
            const savedShopId = localStorage.getItem('currentShopId');
            const shopToSet = shops.find(s => s.id === savedShopId) || shops[0];
            setCurrentShop(shopToSet);
          }
        }
      }
    } catch (error) {
      console.error('Error loading accessible shops:', error);
    } finally {
      setLoading(false);
    }
  }

  function switchShop(shopId: string) {
    const shop = accessibleShops.find(s => s.id === shopId);
    if (shop) {
      setCurrentShop(shop);
      localStorage.setItem('currentShopId', shopId);
    }
  }

  function hasAccess(shopId: string): boolean {
    return accessibleShops.some(s => s.id === shopId);
  }

  const isMultiLocation = accessibleShops.length > 1;

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        accessibleShops,
        isMultiLocation,
        switchShop,
        hasAccess,
        loading,
        refreshShops: loadAccessibleShops
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return context;
}

