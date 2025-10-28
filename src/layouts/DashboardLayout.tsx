import { useEffect, useState } from 'react';
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, CheckCircle, UserCheck, ClipboardList, Calendar, AlertTriangle, Settings, LogOut, Tablet, MapPin, Zap, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Shop {
  id: string;
  shop_name: string;
  plan_type: 'basic' | 'pro';
  diary_enabled: boolean;
}

export default function DashboardLayout() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, plan_type, diary_enabled')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-start p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex items-start p-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: `/dashboard/${shopId}`, icon: Home, label: 'Dashboard', end: true },
    { to: `/dashboard/${shopId}/checkin`, icon: CheckCircle, label: 'Check In' },
    { to: `/dashboard/${shopId}/customers`, icon: Users, label: 'Customers' },
    ...(shop.plan_type === 'pro' ? [
      { to: `/dashboard/${shopId}/staff`, icon: UserCheck, label: 'Staff' },
      { to: `/dashboard/${shopId}/staff-locations`, icon: Navigation, label: 'Staff Locations' },
      { to: `/dashboard/${shopId}/tasks`, icon: ClipboardList, label: 'Tasks' },
      { to: `/dashboard/${shopId}/incidents`, icon: AlertTriangle, label: 'Incidents' },
      { to: `/dashboard/${shopId}/clock-requests`, icon: MapPin, label: 'Clock Requests' },
    ] : []),
    ...(shop.diary_enabled ? [
      { to: `/dashboard/${shopId}/diary`, icon: Calendar, label: 'Diary' },
    ] : []),
    { to: `/dashboard/${shopId}/flash-offers`, icon: Zap, label: 'Flash Offers' },
    { to: `/dashboard/${shopId}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex bg-white">
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center h-14 px-4 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-blue-600">DigiGet</h1>
              <p className="text-xs text-gray-600">{shop.shop_name}</p>
            </div>
          </div>

          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-2.5" />
                {item.label}
              </NavLink>
            ))}

            <a
              href={`/tablet/${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50 border-t border-gray-200 mt-2"
            >
              <Tablet className="w-4 h-4 mr-2.5" />
              Staff Tablet
            </a>
          </nav>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64">
        <main className="bg-gray-50">
          <div className="p-4">
            <Outlet context={{ shop }} />
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around">
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 text-xs ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`
                }
              >
                <item.icon className="w-6 h-6 mb-1" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
