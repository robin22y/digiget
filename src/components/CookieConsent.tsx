import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true
    analytics: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('digiget_cookie_consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const saved = JSON.parse(consent);
      setPreferences(saved);
    }
  }, []);

  const handleAcceptAll = () => {
    const newPreferences = {
      essential: true,
      analytics: true,
    };
    setPreferences(newPreferences);
    localStorage.setItem('digiget_cookie_consent', JSON.stringify(newPreferences));
    setShowBanner(false);
    
    // Initialize analytics if accepted
    if (newPreferences.analytics) {
      // Add Google Analytics initialization here if needed
      console.log('Analytics enabled');
    }
  };

  const handleRejectNonEssential = () => {
    const newPreferences = {
      essential: true,
      analytics: false,
    };
    setPreferences(newPreferences);
    localStorage.setItem('digiget_cookie_consent', JSON.stringify(newPreferences));
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('digiget_cookie_consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    
    // Initialize analytics if accepted
    if (preferences.analytics) {
      console.log('Analytics enabled');
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
            {/* Banner Content */}
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                {/* Cookie Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    We use cookies 🍪
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We use essential cookies to keep you logged in and analytics cookies (optional) to improve {window.location.hostname === 'localhost' || window.location.hostname.includes('localhost') ? 'DigiGet' : 'our service'}. You can customize your preferences below.
                  </p>

                  {/* Quick Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Essential cookies: Required (always on)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Analytics cookies: Optional</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!showSettings ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleAcceptAll}
                        className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-apple-blue to-apple-purple text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      >
                        Accept All
                      </button>
                      <button
                        onClick={handleRejectNonEssential}
                        className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                      >
                        Essential Only
                      </button>
                      <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 md:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Settings Panel */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        {/* Essential Cookies - Always On */}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              id="essential"
                              checked={true}
                              disabled={true}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="essential" className="font-semibold text-gray-900 block mb-1">
                              Essential Cookies
                            </label>
                            <p className="text-sm text-gray-600">
                              Required for {window.location.hostname === 'localhost' || window.location.hostname.includes('localhost') ? 'DigiGet' : 'the website'} to function. These include authentication, security, and session management.
                            </p>
                          </div>
                        </div>

                        {/* Analytics Cookies - Optional */}
                        <div className="flex items-start gap-3 border-t border-gray-200 pt-4">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              id="analytics"
                              checked={preferences.analytics}
                              onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="analytics" className="font-semibold text-gray-900 block mb-1">
                              Analytics Cookies
                            </label>
                            <p className="text-sm text-gray-600">
                              Help us understand how you use {window.location.hostname === 'localhost' || window.location.hostname.includes('localhost') ? 'DigiGet' : 'our website'}. We track page views, button clicks, and device type. All data is anonymous.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowSettings(false)}
                          className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSettings}
                          className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-apple-blue to-apple-purple text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        >
                          Save Preferences
                        </button>
                      </div>

                      {/* Privacy Link */}
                      <p className="text-xs text-gray-500 text-center">
                        Learn more in our{' '}
                        <a href="/cookies" className="text-blue-600 hover:underline font-semibold">
                          Cookie Policy
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline font-semibold">
                          Privacy Policy
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                {!showSettings && (
                  <button
                    onClick={handleRejectNonEssential}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close cookie banner"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Footer Link - Always visible when settings are shown */}
            {!showSettings && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-500">
                  Your privacy matters.{' '}
                  <a href="/cookies" className="text-blue-600 hover:underline font-semibold">
                    Read our Cookie Policy
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleRejectNonEssential}
      />
    </>
  );
}

