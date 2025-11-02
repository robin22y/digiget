import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { PINModal } from '../components/PINModal';
import '../styles/shop-owner.css';

interface MenuButtonProps {
  icon: string;
  label: string;
  subtitle: string;
  locked: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}

function MenuButton({ icon, label, subtitle, locked, onClick, fullWidth }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`menu-button ${locked ? 'locked' : ''} ${fullWidth ? 'full-width' : ''}`}
      disabled={locked}
    >
      <div className="menu-icon">{icon}</div>
      <div className="menu-content">
        <div className="menu-label">{label}</div>
        <div className="menu-subtitle">{subtitle}</div>
      </div>
      {locked && <div className="lock-indicator">🔒</div>}
    </button>
  );
}

export function ShopOwnerHome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { shopId: paramShopId } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    customers: 0,
    staffHours: 0,
    working: 0
  });
  const [currentStaff, setCurrentStaff] = useState<any[]>([]);
  const [showPINModal, setShowPINModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug: Log translation status
  useEffect(() => {
    console.log('ShopOwnerHome: Current language:', i18n.language);
    console.log('ShopOwnerHome: Translation test:', t('home.todays_overview'));
    console.log('ShopOwnerHome: i18n ready:', i18n.isInitialized);
    console.log('ShopOwnerHome: Available resources:', Object.keys(i18n.store?.resources || {}));
  }, [i18n.language, t, i18n.isInitialized, i18n.store]);

  useEffect(() => {
    loadShopData();
    checkSession();
    
    // Set up session expiry check
    const interval = setInterval(() => {
      if (sessionExpiry && Date.now() >= sessionExpiry) {
        setIsUnlocked(false);
        setSessionExpiry(null);
        sessionStorage.removeItem('owner_pin_expiry');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry]);

  useEffect(() => {
    if (shop?.id) {
      loadTodayStats();
      loadCurrentStaff();
    }
  }, [shop?.id]);

  async function loadShopData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setShop(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      setLoading(false);
    }
  }

  async function loadTodayStats() {
    if (!shop?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's customers (from customer check-ins or visits)
      const { data: checkIns } = await supabase
        .from('customer_checkins')
        .select('id')
        .eq('shop_id', shop.id)
        .gte('checkin_time', today.toISOString());

      // Get today's staff hours
      const { data: clockEntries } = await supabase
        .from('clock_entries')
        .select('hours_worked, clock_out_time')
        .eq('shop_id', shop.id)
        .gte('clock_in_time', today.toISOString());

      const totalHours = clockEntries?.reduce((sum, entry) => {
        if (entry.hours_worked) return sum + entry.hours_worked;
        if (!entry.clock_out_time) {
          // Currently clocked in - calculate hours from clock_in_time
          const hours = (Date.now() - new Date(entry.clock_in_time || today).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0) || 0;

      // Get currently working staff
      const { data: working } = await supabase
        .from('clock_entries')
        .select('id')
        .eq('shop_id', shop.id)
        .is('clock_out_time', null)
        .gte('clock_in_time', today.toISOString());

      setTodayStats({
        customers: checkIns?.length || 0,
        staffHours: totalHours,
        working: working?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadCurrentStaff() {
    if (!shop?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
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

      setCurrentStaff(data || []);
    } catch (error) {
      console.error('Error loading current staff:', error);
    }
  }

  function checkSession() {
    const expiry = sessionStorage.getItem('owner_pin_expiry');
    if (expiry && Date.now() < parseInt(expiry)) {
      setIsUnlocked(true);
      setSessionExpiry(parseInt(expiry));
    }
  }

  function handleMenuClick(menuPath: string, requiresPIN: boolean = true) {
    if (!requiresPIN || isUnlocked) {
      // Session still valid or doesn't require PIN, navigate directly
      navigate(menuPath);
    } else {
      // Need PIN
      setSelectedMenu(menuPath);
      setShowPINModal(true);
    }
  }

  function handlePINSuccess() {
    // Set session expiry (5 minutes)
    const expiry = Date.now() + (5 * 60 * 1000);
    sessionStorage.setItem('owner_pin_expiry', expiry.toString());
    setIsUnlocked(true);
    setSessionExpiry(expiry);
    setShowPINModal(false);
    
    // Navigate to selected menu
    if (selectedMenu) {
      navigate(selectedMenu);
    }
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function calculateDuration(startTime: string): string {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const hours = (now - start) / (1000 * 60 * 60);
    
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No shop found. Please create a shop first.</p>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-owner-home">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1>{shop.shop_name}</h1>
          <span className="status-badge active">
            {t('common.active')}
          </span>
        </div>
        <div className="header-right">
          <LanguageSelector />
          <button 
            onClick={() => handleMenuClick(`/dashboard/${shop.id}/settings`, false)}
            className="settings-button"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="card">
        <h3>{t('home.todays_overview')}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{todayStats.customers}</div>
            <div className="stat-label">{t('home.customers')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-value">{todayStats.staffHours.toFixed(1)}h</div>
            <div className="stat-label">{t('home.staff_hours')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{todayStats.working}</div>
            <div className="stat-label">{t('home.working')}</div>
          </div>
        </div>
      </div>

      {/* Secure Menu */}
      <div className="card">
        <div className="card-header">
          <h3>🔐 {t('home.secure_menu')}</h3>
          {isUnlocked && sessionExpiry && (
            <span className="session-indicator">
              🔓 {t('common.unlocked')}
              <span className="session-timer">
                {Math.floor((sessionExpiry - Date.now()) / 60000)}m
              </span>
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-3">{t('home.tap_to_unlock')}</p>
        <div className="menu-grid">
            <MenuButton
              icon="👥"
              label={t('menu.add_staff')}
              subtitle={t('menu.new_employee')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/staff?action=add`)}
            />
            
            <MenuButton
              icon="💰"
              label={t('menu.payroll_report')}
              subtitle={t('menu.hours_wages')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/payroll`)}
            />

            <MenuButton
              icon="🏪"
              label={t('menu.business_details')}
              subtitle={t('menu.name_location')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/settings`)}
            />

            <MenuButton
              icon="🔐"
              label={t('menu.security_settings')}
              subtitle={t('menu.pins_access')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/settings`)}
            />

            <MenuButton
              icon="💳"
              label={t('menu.subscription')}
              subtitle={t('menu.plan_billing')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/settings`)}
            />

            <MenuButton
              icon="🎁"
              label={t('menu.loyalty_settings')}
              subtitle={t('menu.points_rewards')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/settings`)}
            />

            <MenuButton
              icon="👥"
              label={t('menu.manage_staff')}
              subtitle={t('menu.edit_delete')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/staff`)}
            />

            <MenuButton
              icon="💼"
              label={t('menu.staff_jobs')}
              subtitle={t('menu.assign_tasks')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/tasks`)}
            />

            <MenuButton
              icon="👤"
              label={t('menu.view_customers')}
              subtitle={t('menu.customer_list')}
              locked={!isUnlocked}
              onClick={() => handleMenuClick(`/dashboard/${shop.id}/customers`)}
              fullWidth
            />
          </div>
        </div>

      {/* Currently Working */}
      <div className="card">
        <h3>{t('home.currently_working')} ({currentStaff.length})</h3>
        
        {currentStaff.length > 0 ? (
          <div className="staff-list">
            {currentStaff.map((entry: any) => {
              const employee = entry.employees;
              return (
                <div key={entry.id} className="staff-item">
                  <div className="staff-info">
                    <div className="staff-name">
                      {employee?.first_name} {employee?.last_name}
                    </div>
                    <div className="staff-time">
                      Since {formatTime(entry.clock_in_time)}
                    </div>
                  </div>
                  <div className="staff-duration">
                    {calculateDuration(entry.clock_in_time)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 mb-4">No staff currently clocked in</p>
        )}

        <button
          onClick={() => handleMenuClick(`/dashboard/${shop.id}/staff`, !isUnlocked)}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {t('home.view_all_staff')} {!isUnlocked && '🔒'}
        </button>
      </div>

        {/* PIN Modal */}
      {showPINModal && (
        <PINModal
          isOpen={showPINModal}
          menuName={selectedMenu || ''}
          onSuccess={handlePINSuccess}
          onCancel={() => {
            setShowPINModal(false);
            setSelectedMenu(null);
          }}
        />
      )}
    </div>
  );
}

