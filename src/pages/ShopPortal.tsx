import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ShopPINEntry } from '../components/ShopPINEntry';
import { ShopClockInOutModal } from '../components/ShopClockInOutModal';
import { ShopCustomerCheckInModal } from '../components/ShopCustomerCheckInModal';
import { updateManifest } from '../utils/manifestManager';
import { isDeviceTrusted } from '../lib/deviceFingerprint';

export default function ShopPortal() {
  const { code } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAction, setShowAction] = useState<'clock' | 'customer' | null>(null);
  const [currentlyWorking, setCurrentlyWorking] = useState<any[]>([]);
  const [todayCustomers, setTodayCustomers] = useState(0);

  // Note: Using static manifest for now - shop-specific features can be added later
  // The basic PWA will work with the static manifest.json

  const navigate = useNavigate();

  // Check if device is trusted OR shop PIN is stored in session
  useEffect(() => {
    if (!code) return;
    
    const checkAccess = async () => {
      // Load shop data first
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name, short_code, shop_pin')
        .eq('short_code', code)
        .maybeSingle();

      if (data) {
        setShop(data);
        
        // Check if device is trusted
        const trusted = await isDeviceTrusted(data.id);
        if (trusted) {
          setIsUnlocked(true);
          loadCurrentlyWorking();
          loadTodayCustomers();
          return;
        }
      }
      
      // If not trusted, check session PIN
      const unlocked = sessionStorage.getItem(`shop_unlocked_${code}`);
      if (unlocked === 'true') {
        setIsUnlocked(true);
        loadCurrentlyWorking();
        loadTodayCustomers();
      }
    };
    
    checkAccess();
  }, [code]);

  async function loadShopData() {
    if (!code) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, short_code, shop_pin')
        .eq('short_code', code)
        .maybeSingle();

      if (error) throw error;
      if (data) setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  }

  async function loadCurrentlyWorking() {
    if (!shop?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: clockEntries, error } = await supabase
        .from('clock_entries')
        .select(`
          id,
          clock_in_time,
          employees (
            id,
            first_name,
            last_name
          )
        `)
        .eq('shop_id', shop.id)
        .is('clock_out_time', null)
        .gte('clock_in_time', today.toISOString())
        .order('clock_in_time', { ascending: false });

      if (error) throw error;

      const working = (clockEntries || []).map(entry => {
        const employee = entry.employees as any;
        const clockInTime = new Date(entry.clock_in_time);
        const now = new Date();
        const diffMs = now.getTime() - clockInTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          id: employee?.id,
          name: `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim(),
          duration: `${diffHours}h ${diffMins}m`
        };
      });

      setCurrentlyWorking(working);
    } catch (error) {
      console.error('Error loading working staff:', error);
    }
  }

  async function loadTodayCustomers() {
    if (!shop?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('customer_visits')
        .select('id')
        .eq('shop_id', shop.id)
        .gte('visit_date', today.toISOString());

      if (error) throw error;
      setTodayCustomers(data?.length || 0);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  function handleUnlock(shopData: any) {
    if (code) {
      sessionStorage.setItem(`shop_unlocked_${code}`, 'true');
      setShop(shopData);
      setIsUnlocked(true);
      loadCurrentlyWorking();
      loadTodayCustomers();
    }
  }

  function handleLock() {
    if (code) {
      sessionStorage.removeItem(`shop_unlocked_${code}`);
      setIsUnlocked(false);
      setShop(null);
      setShowAction(null);
    }
  }

  if (!isUnlocked || !shop) {
    return <ShopPINEntry code={code || ''} onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
            <p className="text-gray-600 text-sm mt-1">Shop Tablet Portal</p>
          </div>
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Lock className="w-4 h-4" />
            Lock
          </button>
        </div>

        {/* Main Actions - Large Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => setShowAction('clock')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Clock In/Out</h2>
                <p className="text-gray-600 text-sm">Staff arrival and departure</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Enter staff PIN to clock in or out</p>
          </button>

          <button
            onClick={() => setShowAction('customer')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Check In Customer</h2>
                <p className="text-gray-600 text-sm">Customer visits and loyalty points</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Enter customer phone and your PIN</p>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Working</h3>
            {currentlyWorking.length > 0 ? (
              <div className="space-y-3">
                {currentlyWorking.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-900">{staff.name}</span>
                    <span className="text-sm text-gray-600">{staff.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No staff currently clocked in</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Customers</h3>
            <p className="text-4xl font-bold text-blue-600">{todayCustomers}</p>
            <p className="text-gray-500 text-sm mt-2">Customers checked in today</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Tablet is always unlocked with shop PIN ({shop.shop_pin})</li>
            <li>• Staff enter their personal PIN for each action (clock in, check in customer)</li>
            <li>• System tracks who did what via their PIN</li>
            <li>• No login/logout needed - multiple staff can use tablet</li>
          </ul>
        </div>
      </div>

      {/* Action Modals */}
      {showAction === 'clock' && (
        <ShopClockInOutModal
          isOpen={true}
          onClose={() => setShowAction(null)}
          shopId={shop.id}
          onSuccess={() => {
            loadCurrentlyWorking();
          }}
        />
      )}

      {showAction === 'customer' && (
        <ShopCustomerCheckInModal
          isOpen={true}
          onClose={() => setShowAction(null)}
          shopId={shop.id}
          onSuccess={() => {
            loadTodayCustomers();
          }}
        />
      )}
    </div>
  );
}

