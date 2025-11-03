import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/analytics.css';
import './i18n/config'; // Initialize i18n BEFORE rendering App

// Initialize offline storage and sync
import { initOfflineStorage } from './lib/offlineStorage';
import { setupOfflineSync, syncPendingClockEntries } from './lib/offlineSync';

// Initialize offline storage
initOfflineStorage()
  .then(() => {
    console.log('✓ Offline storage initialized');
    setupOfflineSync();
    
    // Listen for service worker sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_PENDING_ENTRIES') {
          console.log(`Syncing ${event.data.count} pending entries...`);
          syncPendingClockEntries().catch(console.error);
        }
      });
    }
  })
  .catch((error) => {
    console.error('Failed to initialize offline storage:', error);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registered:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('✗ Service Worker registration failed:', error);
      });
  });
}