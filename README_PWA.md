# DigiGet PWA Implementation

## Overview
DigiGet has been converted to a Progressive Web App (PWA) with offline support and installability.

## Features Implemented

### ✅ Core PWA Features
1. **Web App Manifest** (`public/manifest.json`)
   - App name, icons, theme colors
   - Standalone display mode
   - Installable on home screens

2. **Service Worker** (`public/sw.js`)
   - Offline caching
   - Background sync support
   - Automatic cache updates

3. **Offline Page** (`public/offline.html`)
   - Fallback page when offline
   - User-friendly offline message

4. **Install Prompt** (`src/components/InstallPrompt.tsx`)
   - Detects install capability
   - Shows install prompt after 30 seconds
   - Respects user dismissal

5. **Offline Indicator** (`src/components/OfflineIndicator.tsx`)
   - Shows banner when offline
   - Disappears when back online

### ✅ Configuration
- **HTML Meta Tags** (in `index.html`)
  - PWA manifest link
  - Apple touch icons
  - Theme colors
  - Mobile web app capable flags

- **Service Worker Registration** (in `src/main.tsx`)
  - Auto-registers on load
  - Checks for updates hourly

- **Vite PWA Plugin** (in `vite.config.ts`)
  - Auto-updates service worker
  - Caches Supabase API calls
  - Optimizes caching strategy

## Required Assets

### Icons Needed
The following icons need to be created and placed in the `public` directory:

1. **icon-192.png** - 192x192 pixels
   - App icon for Android home screen
   - Should be simple and recognizable
   - Recommended: Blue background with "D" or barber pole design

2. **icon-512.png** - 512x512 pixels
   - High-resolution app icon
   - Used for splash screens and app stores

3. **favicon-32x32.png** - 32x32 pixels
   - Browser favicon

4. **favicon-16x16.png** - 16x16 pixels
   - Small browser favicon

5. **og-image.png** - 1200x630 pixels (optional)
   - Open Graph image for social sharing

6. **screenshot-mobile.png** - 390x844 pixels (optional)
   - Mobile screenshot for app stores

7. **screenshot-desktop.png** - 1280x720 pixels (optional)
   - Desktop screenshot for app stores

### Icon Design Guidelines
- Use DigiGet brand color: `#2563EB` (blue)
- Simple, recognizable design
- Avoid text (except single letter "D")
- Consider barber pole or clock/time theme
- Ensure good contrast for visibility

## Installation

### 1. Install Vite PWA Plugin
```bash
npm install vite-plugin-pwa -D
```

### 2. Create Icons
Create the required icon files listed above and place them in the `public` directory.

### 3. Build & Deploy
```bash
npm run build
```

The PWA will be included in the build automatically.

## Testing

### Desktop (Chrome)
1. Open Chrome DevTools > Application tab
2. Check **Manifest** - should load without errors
3. Check **Service Workers** - should show "activated and running"
4. Test offline: Network tab > Check "Offline"
5. Refresh page - should show offline page
6. Install prompt: Chrome will show install button in address bar

### Mobile (Android)
1. Open site in Chrome mobile
2. Wait for "Add to Home screen" prompt
3. Install app
4. Open from home screen (should open fullscreen)
5. Test offline functionality

### Mobile (iOS)
1. Open site in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Verify icon appears
5. Open from home screen

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit
5. Should score 100/100 on PWA checklist

## Features

### Offline Support
- Static assets are cached
- App shell loads from cache when offline
- Supabase API calls use NetworkFirst strategy
- Offline page shown when network unavailable

### Installability
- Detects when app can be installed
- Shows install prompt after 30 seconds
- Remembers if user dismissed prompt
- Works on Android and iOS

### Background Sync
- Service worker supports background sync
- Ready for future offline queue implementation
- Sync events for clock-ins and customer check-ins

## Next Steps (Optional)

### 1. Offline Queue System
Implement IndexedDB-based queue for offline actions:
- Queue clock-ins when offline
- Queue customer check-ins
- Sync when back online

See `src/lib/offlineQueue.ts` for example implementation structure.

### 2. Push Notifications
Add push notification support:
- Notify users of clock-in approvals
- Alert on system updates
- Requires user permission

### 3. Update Notifications
Show update available banner:
- Detect when service worker updates
- Prompt user to reload
- Better than auto-update

## Troubleshooting

### Service Worker Not Registering
- Ensure site is on HTTPS (or localhost)
- Check browser console for errors
- Verify `/sw.js` is accessible

### Install Prompt Not Showing
- App must be installable (meets PWA criteria)
- User must visit multiple times
- Check browser support (Chrome/Edge on Android)

### Icons Not Showing
- Verify icons exist in `public` directory
- Check file paths in manifest.json
- Ensure correct sizes (192x192, 512x512)

### Cache Not Updating
- Service worker updates automatically
- May need hard refresh (Ctrl+Shift+R)
- Clear cache in DevTools > Application > Storage

## Notes
- Service worker only works on HTTPS (or localhost)
- iOS has limited PWA support (no background sync)
- Some features require user interaction (install, notifications)
- Test on real devices, not just desktop browser

