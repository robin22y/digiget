# PWA Setup Instructions

## Installation Steps

### 1. Install Vite PWA Plugin
```bash
npm install vite-plugin-pwa -D
```

### 2. Create App Icons

You need to create the following icon files and place them in the `public` directory:

#### Required Icons:
- **icon-192.png** (192x192 pixels)
- **icon-512.png** (512x512 pixels)  
- **favicon-32x32.png** (32x32 pixels)
- **favicon-16x16.png** (16x16 pixels)

#### Optional Icons:
- **og-image.png** (1200x630 pixels) - For social sharing
- **screenshot-mobile.png** (390x844 pixels) - For app stores
- **screenshot-desktop.png** (1280x720 pixels) - For app stores

#### Icon Design:
- Use DigiGet brand color: `#2563EB` (blue)
- Simple design: Letter "D" or barber pole/clock theme
- Solid background color
- High contrast for visibility
- Ensure icons are square (equal width and height)

### 3. Test the PWA

After installing the plugin and creating icons:

```bash
npm run build
npm run preview
```

Then test:
1. Open Chrome DevTools > Application > Manifest
2. Check Service Worker registration
3. Test offline mode
4. Test install prompt

## What's Been Implemented

✅ **Manifest** (`public/manifest.json`) - Complete
✅ **Service Worker** (`public/sw.js`) - Complete with offline support
✅ **Offline Page** (`public/offline.html`) - Complete
✅ **PWA Meta Tags** (`index.html`) - Complete
✅ **Service Worker Registration** (`src/main.tsx`) - Complete
✅ **Install Prompt Component** (`src/components/InstallPrompt.tsx`) - Complete
✅ **Offline Indicator** (`src/components/OfflineIndicator.tsx`) - Complete
✅ **Vite Configuration** (`vite.config.ts`) - Complete (needs plugin installed)
✅ **Netlify Headers** (`public/_redirects`) - Complete

## Features

### ✅ Offline Support
- Static assets cached automatically
- App shell loads from cache when offline
- Supabase API calls use NetworkFirst strategy
- Custom offline page shown when network unavailable

### ✅ Installability
- Detects when app can be installed
- Shows install prompt after 30 seconds of use
- Remembers if user dismissed the prompt
- Works on Android (Chrome) and iOS (Safari)

### ✅ User Experience
- Offline indicator banner at top of screen
- Install prompt at bottom of screen
- Fullscreen app when installed (no browser chrome)
- Fast loading with cached assets

## Testing Checklist

### Desktop (Chrome)
- [ ] Open DevTools > Application > Manifest - verify no errors
- [ ] Check Service Workers tab - should show "activated and running"
- [ ] Test offline: Network tab > Check "Offline" > Refresh page
- [ ] Verify offline page appears
- [ ] Check install button in address bar (if eligible)

### Mobile (Android)
- [ ] Open site in Chrome mobile
- [ ] Wait for "Add to Home screen" prompt (may take multiple visits)
- [ ] Install app
- [ ] Open from home screen - should open fullscreen
- [ ] Test app works like native app
- [ ] Test offline functionality

### Mobile (iOS)
- [ ] Open site in Safari
- [ ] Tap Share button
- [ ] Tap "Add to Home Screen"
- [ ] Verify icon appears on home screen
- [ ] Open from home screen
- [ ] Test app functionality

### Lighthouse Audit
- [ ] Open Chrome DevTools > Lighthouse
- [ ] Select "Progressive Web App"
- [ ] Run audit
- [ ] Should score 100/100 on PWA checklist

## Troubleshooting

### Service Worker Not Registering
- Ensure site is on HTTPS (or localhost for development)
- Check browser console for errors
- Verify `/sw.js` file is accessible
- Clear browser cache and hard refresh

### Install Prompt Not Showing
- App must meet PWA criteria (HTTPS, manifest, service worker)
- User must visit multiple times (Chrome requirement)
- Check browser support (Chrome/Edge on Android, Safari on iOS)
- Wait 30 seconds for prompt to appear

### Icons Not Showing
- Verify icons exist in `public` directory
- Check file paths in `manifest.json`
- Ensure correct sizes (192x192, 512x512)
- Clear browser cache

### Cache Not Updating
- Service worker updates automatically when new version deployed
- May need hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Can clear cache manually in DevTools > Application > Storage

## Next Steps

1. **Install the plugin**: `npm install vite-plugin-pwa -D`
2. **Create icons** (see requirements above)
3. **Build and test**: `npm run build && npm run preview`
4. **Deploy** and test on real devices

## Notes

- Service worker only works on HTTPS (or localhost for development)
- iOS has limited PWA support (no background sync, limited notifications)
- Some features require user interaction (install prompt, push notifications)
- Always test on real devices, not just desktop browser
- Icons must be square (equal width and height)
- Test offline functionality thoroughly before deploying

