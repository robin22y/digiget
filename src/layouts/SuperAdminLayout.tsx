import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, FileText, Bell, Settings, LogOut, Download, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/super-admin/dashboard', icon: Home, label: 'Dashboard', end: true },
    { to: '/super-admin/shops', icon: Store, label: 'Manage Shops', end: false },
    { to: '/super-admin/qr-management', icon: QrCode, label: 'QR Management', end: true },
    { to: '/super-admin/reports', icon: FileText, label: 'Reports', end: true },
    { to: '/super-admin/notices', icon: Bell, label: 'Notices', end: true },
    { to: '/super-admin/settings', icon: Settings, label: 'Settings', end: true },
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

      <div className="flex-1 md:ml-64">
        <main className="bg-gray-50">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

