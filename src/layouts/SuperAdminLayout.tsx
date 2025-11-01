import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, FileText, Bell, Settings, LogOut, Download, QrCode, Zap, Menu, X, Star, BookOpen, Mail, Radio } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Add CSS to hide scrollbar but keep functionality
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/super-admin/dashboard', icon: Home, label: 'Dashboard', end: true },
    { to: '/super-admin/shops', icon: Store, label: 'Manage Shops', end: false },
    { to: '/super-admin/qr-management', icon: QrCode, label: 'QR Management', end: true },
    { to: '/super-admin/assign-nfc-tags', icon: Radio, label: 'Assign NFC Tags', end: true },
    { to: '/super-admin/all-deals', icon: Zap, label: 'All Deals', end: true },
    { to: '/super-admin/top-rated-shops', icon: Star, label: 'Top Rated', end: true },
    { to: '/super-admin/reports', icon: FileText, label: 'Reports', end: true },
    { to: '/super-admin/notices', icon: Bell, label: 'Notices', end: true },
    { to: '/super-admin/email-templates', icon: Mail, label: 'Email Templates', end: true },
    { to: '/super-admin/settings', icon: Settings, label: 'Settings', end: true },
    { to: '/blog', icon: BookOpen, label: 'ShopTalk Blog', end: true },
  ];
  
  const isActive = (item: typeof navItems[0]) => {
    if (item.end) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  const handleExportAll = async () => {
    // Placeholder - implement actual export logic
    alert('Exporting all data...');
  };

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div className="flex bg-white">
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center h-14 px-4 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-blue-600">DigiGet</h1>
              <p className="text-xs text-gray-600">Super Admin</p>
            </div>
          </div>

          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleExportAll}
              className="flex items-center w-full px-3 py-2.5 mb-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2.5" />
              Download All Data (CSV)
            </button>
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

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="bg-gray-50 flex-1 overflow-x-hidden">
          <div className="p-4 pb-20 md:pb-4 max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation - Show all items scrollable */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
          <div className="flex overflow-x-auto max-w-full scrollbar-hide">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex flex-col items-center py-2 px-3 text-xs flex-shrink-0 min-w-[70px] ${
                    active ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
                  <span className="truncate w-full text-center text-[10px] sm:text-xs whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={`flex flex-col items-center py-2 px-3 text-xs flex-shrink-0 min-w-[70px] ${
                showMobileMenu ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center text-[10px] sm:text-xs whitespace-nowrap">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              className="fixed right-0 top-0 bottom-0 bg-white w-80 max-w-[85vw] shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                  <p className="text-xs text-gray-600">Super Admin</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="px-2 py-4 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2.5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={handleExportAll}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2.5" />
                  Download All Data (CSV)
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

