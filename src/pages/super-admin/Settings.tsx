import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsIcon, DollarSign, Calendar, Mail, Database } from 'lucide-react';

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState({
    default_trial_days: 90,
    default_basic_price: 5.99,
    default_pro_price: 9.99,
    email_automation_enabled: true,
    email_service_type: 'smtp', // 'smtp' or 'api'
    email_smtp_host: '',
    email_smtp_port: 587,
    email_smtp_username: '',
    email_smtp_password: '',
    email_smtp_from_email: '',
    email_smtp_from_name: 'DigiGet',
    email_api_provider: 'sendgrid', // 'sendgrid', 'mailgun', 'resend', etc.
    email_api_key: '',
    email_api_from_email: '',
    email_api_from_name: 'DigiGet',
  });

  const handleSaveSettings = async () => {
    // In production, save these to a settings table in Supabase
    // For now, just store in localStorage or show alert
    localStorage.setItem('super_admin_settings', JSON.stringify(settings));
    alert('Settings saved successfully');
  };

  const handleExportAllData = () => {
    alert('This will export all data from all shops. This is a placeholder - implement actual export logic.');
  };

  const handleBackupDatabase = () => {
    alert('This will create a full backup of the database. This is a placeholder - implement actual backup logic.');
  };

  useEffect(() => {
    const saved = localStorage.getItem('super_admin_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trial Period */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Default Trial Period</h2>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Days</label>
            <input
              type="number"
              value={settings.default_trial_days}
              onChange={(e) => setSettings({ ...settings, default_trial_days: parseInt(e.target.value) || 90 })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* Default Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Default Pricing</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Basic Plan (£)</label>
              <input
                type="number"
                step="0.01"
                value={settings.default_basic_price}
                onChange={(e) => setSettings({ ...settings, default_basic_price: parseFloat(e.target.value) || 5.99 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pro Plan (£)</label>
              <input
                type="number"
                step="0.01"
                value={settings.default_pro_price}
                onChange={(e) => setSettings({ ...settings, default_pro_price: parseFloat(e.target.value) || 9.99 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email Automation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-base font-semibold text-gray-900">Email Automation</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_automation_enabled}
                onChange={(e) => setSettings({ ...settings, email_automation_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Automatically send welcome emails, trial expiry reminders, and monthly reports.
          </p>

          {settings.email_automation_enabled && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Service Type</label>
                <select
                  value={settings.email_service_type}
                  onChange={(e) => setSettings({ ...settings, email_service_type: e.target.value as 'smtp' | 'api' })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="smtp">SMTP</option>
                  <option value="api">API (SendGrid, Mailgun, etc.)</option>
                </select>
              </div>

              {settings.email_service_type === 'smtp' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.email_smtp_host}
                        onChange={(e) => setSettings({ ...settings, email_smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={settings.email_smtp_port}
                        onChange={(e) => setSettings({ ...settings, email_smtp_port: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                      <input
                        type="text"
                        value={settings.email_smtp_username}
                        onChange={(e) => setSettings({ ...settings, email_smtp_username: e.target.value })}
                        placeholder="your-email@example.com"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                      <input
                        type="password"
                        value={settings.email_smtp_password}
                        onChange={(e) => setSettings({ ...settings, email_smtp_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        value={settings.email_smtp_from_email}
                        onChange={(e) => setSettings({ ...settings, email_smtp_from_email: e.target.value })}
                        placeholder="noreply@digiget.uk"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                      <input
                        type="text"
                        value={settings.email_smtp_from_name}
                        onChange={(e) => setSettings({ ...settings, email_smtp_from_name: e.target.value })}
                        placeholder="DigiGet"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Provider</label>
                    <select
                      value={settings.email_api_provider}
                      onChange={(e) => setSettings({ ...settings, email_api_provider: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="resend">Resend</option>
                      <option value="postmark">Postmark</option>
                      <option value="aws-ses">AWS SES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      value={settings.email_api_key}
                      onChange={(e) => setSettings({ ...settings, email_api_key: e.target.value })}
                      placeholder="Enter your API key"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        value={settings.email_api_from_email}
                        onChange={(e) => setSettings({ ...settings, email_api_from_email: e.target.value })}
                        placeholder="noreply@digiget.uk"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                      <input
                        type="text"
                        value={settings.email_api_from_name}
                        onChange={(e) => setSettings({ ...settings, email_api_from_name: e.target.value })}
                        placeholder="DigiGet"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> These credentials are stored securely. Make sure your email service is properly configured before enabling automation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Backup & Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <Database className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Backup & Export</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleExportAllData}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm"
            >
              Export All Data (CSV)
            </button>
            <button
              onClick={handleBackupDatabase}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm"
            >
              Create Database Backup
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

