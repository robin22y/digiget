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
        const { data: access, error } = await supabase
          .from('user_shop_access')
          .select('shop_id, role, shops(*)')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading shop access:', error);
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
        } else if (access && access.length > 0) {
          const shops = access.map((a: any) => ({
            ...(a.shops as Shop),
            userRole: a.role as 'owner' | 'manager' | 'staff'
          }));

          setAccessibleShops(shops);

          // Set current shop (from localStorage or first one)
          const savedShopId = localStorage.getItem('currentShopId');
          const shopToSet = shops.find(s => s.id === savedShopId) || shops[0];
          setCurrentShop(shopToSet);
        } else {
          // No shop access - try backward compatibility
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

