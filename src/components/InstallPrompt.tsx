import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      // Prevent default browser install prompt
      e.preventDefault();
      const promptEvent = e as any; // beforeinstallprompt event
      setDeferredPrompt(promptEvent);
      
      // Show our custom prompt after a delay
      setTimeout(() => {
        // Check if already dismissed
        const dismissed = localStorage.getItem('install-prompt-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: Try to show browser's install UI directly
      // This won't work in all browsers but provides a fallback
      return;
    }

    try {
      // Show install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`);

      // Clear the prompt
      setDeferredPrompt(null);
      setShowPrompt(false);

      if (outcome === 'accepted') {
        localStorage.setItem('install-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      // Clear prompt on error
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show on login/signup pages
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/signup') {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      maxWidth: '400px',
      margin: '0 auto',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          marginRight: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          📱
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Install DigiGet</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
            Add to home screen for faster access
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            background: '#2563EB',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            background: '#F3F4F6',
            color: '#4B5563',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}

