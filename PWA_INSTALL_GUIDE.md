# PWA Installation Troubleshooting Guide

## Quick Checks

1. **Is the app served over HTTPS?** 
   - PWAs require HTTPS (except localhost)
   - Check the URL - it should start with `https://` or `http://localhost`

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for:
     - "✅ PWA install prompt available!" - means beforeinstallprompt fired
     - "Service Workers registered: X" - shows SW registration
     - "✅ Manifest loaded:" - confirms manifest is accessible
     - Any red errors

3. **Check Chrome DevTools → Application Tab**
   - **Manifest**: Should show no errors, all icons green
   - **Service Workers**: Should show "activated and running"
   - **Installability**: Should show "Installable" with reasons

## Common Issues & Fixes

### Issue: "beforeinstallprompt" event not firing

**Possible causes:**
- App already installed
- Not served over HTTPS
- Service worker not registered
- Manifest errors

**Fix:**
1. Uninstall the app if already installed
2. Clear browser cache and service workers
3. Ensure HTTPS is enabled
4. Check console for errors

### Issue: Service Worker not registering

**Check:**
- Open DevTools → Application → Service Workers
- Should see `/sw.js` registered

**Fix:**
- Clear site data
- Hard refresh (Ctrl+Shift+R)
- Check network tab for 404 errors on sw.js

### Issue: Manifest errors

**Check:**
- DevTools → Application → Manifest
- Look for red error messages

**Common errors:**
- Icons not found (404)
- Invalid icon format
- Missing required fields

**Fix:**
- Ensure icon files exist in `public/` folder
- Rebuild: `npm run build`
- Check `dist/manifest.webmanifest` is valid JSON

## Testing Locally

1. Build: `npm run build`
2. Preview: `npm run preview` (serves on localhost)
3. Open: `http://localhost:4173`
4. Check console for debug messages
5. Try installing via browser menu

## Production Deployment

1. Ensure HTTPS is enabled
2. Deploy `dist/` folder to your server
3. Verify all files are accessible:
   - `/manifest.webmanifest`
   - `/sw.js`
   - `/icon-192x192.png`
   - `/icon-512x512.png`
4. Test on mobile device over HTTPS

## Browser-Specific Notes

- **Chrome/Edge**: Should show install banner or allow manual install
- **Safari iOS**: Requires manual "Add to Home Screen"
- **Firefox**: May require manual installation
- **Samsung Internet**: Should support PWA installation

