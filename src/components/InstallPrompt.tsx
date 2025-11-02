import { useState, useEffect, useRef } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      try {
        // Prevent default browser install prompt
        e.preventDefault();
        const promptEvent = e as any; // beforeinstallprompt event
        
        // Verify the event is still valid and not intercepted by extensions
        if (!promptEvent) {
          return;
        }

        // Check if prompt function exists and is callable
        if (typeof promptEvent.prompt !== 'function') {
          // Some extensions may modify the event, just ignore it
          return;
        }

        // Verify the event hasn't been consumed by checking if it's still cancelable
        if (!e.cancelable) {
          return;
        }
        
        setDeferredPrompt(promptEvent);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Show our custom prompt after a delay
        timeoutRef.current = setTimeout(() => {
          // Check if already dismissed
          const dismissed = localStorage.getItem('install-prompt-dismissed');
          if (!dismissed) {
            // Use functional setState to access current deferredPrompt
            setShowPrompt((prev) => {
              // Check if prompt is still valid before showing
              if (deferredPrompt) {
                return true;
              }
              return prev;
            });
          }
        }, 30000); // Show after 30 seconds
      } catch (error: any) {
        // Silently handle errors from browser extensions interfering
        // Don't log if it's the specific message channel error
        if (error?.message?.includes('message channel') || error?.message?.includes('asynchronous response')) {
          // This is expected when extensions interfere - ignore silently
          return;
        }
        console.debug('Install prompt handler error:', error);
      }
    };

    window.addEventListener('beforeinstallprompt', handler, { passive: false });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      // Clear timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: Try to show browser's install UI directly
      // This won't work in all browsers but provides a fallback
      return;
    }

    try {
      // Verify prompt is still valid before using it
      if (typeof deferredPrompt.prompt !== 'function') {
        console.warn('Install prompt is no longer valid');
        setDeferredPrompt(null);
        setShowPrompt(false);
        return;
      }

      // Check if userChoice exists (prevents channel errors)
      if (!deferredPrompt.userChoice) {
        // Extension may have intercepted, just show the prompt without waiting
        try {
          await deferredPrompt.prompt();
        } catch (err) {
          // Ignore errors from extensions
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
        return;
      }

      // Show install prompt
      await deferredPrompt.prompt();

      // Wait for user choice with timeout - handle potential channel errors
      let outcome = 'dismissed'; // Default to dismissed
      try {
        const choicePromise = deferredPrompt.userChoice;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Install prompt timeout')), 5000)
        );

        const result = await Promise.race([choicePromise, timeoutPromise]) as any;
        outcome = result?.outcome || 'dismissed';
        
        if (outcome === 'accepted') {
          localStorage.setItem('install-prompt-dismissed', 'true');
        }
      } catch (choiceError: any) {
        // Handle message channel errors silently
        if (choiceError?.message?.includes('message channel') || 
            choiceError?.message?.includes('asynchronous response')) {
          // Extension interference - assume dismissed
          outcome = 'dismissed';
        } else if (choiceError?.message !== 'Install prompt timeout') {
          // Log other errors
          console.debug('User choice error:', choiceError);
        }
      }

      // Clear the prompt
      setDeferredPrompt(null);
      setShowPrompt(false);

    } catch (error: any) {
      // Silently handle errors (often from browser extensions or user cancelling)
      if (error?.message?.includes('message channel') || 
          error?.message?.includes('asynchronous response')) {
        // Extension interference - just clear and continue
        setDeferredPrompt(null);
        setShowPrompt(false);
        return;
      }
      
      if (error?.message !== 'Install prompt timeout') {
        console.debug('Install prompt error (non-critical):', error);
      }
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

