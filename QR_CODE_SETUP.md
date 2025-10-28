# QR Code System Setup & Usage Guide

## ✅ Features Enabled

1. **Auto-Generation for Existing Shops**
   - All existing shops can now generate QR codes automatically
   - QR codes are created when shop owners visit the QR Code page
   - No manual setup required

2. **QR Code Management**
   - View QR code with shop branding
   - Download as high-resolution PNG
   - Print-friendly format
   - Copy check-in link to clipboard
   - Regenerate QR codes anytime

3. **Quick Access**
   - Quick action button on Dashboard Home
   - QR Code tab in dashboard navigation
   - Super Admin QR Management for all shops

## 🚀 Setup Instructions

### For Existing Shops (Backfill QR Codes)

Run this SQL script in your Supabase SQL Editor to generate QR URLs for all existing shops:

**File: `backfill_qr_codes.sql`**

```sql
UPDATE shops
SET qr_url = 'https://digiget.uk/dashboard/' || id::text || '/checkin',
    qr_code_active = COALESCE(qr_code_active, true),
    updated_at = NOW()
WHERE qr_url IS NULL OR qr_url = '';

-- Verify
SELECT shop_name, qr_url, qr_code_active FROM shops;
```

**Note:** Replace `https://digiget.uk` with your actual production domain if different.

### For New Database Setup

The QR code columns are already included in `setup_database.sql`. New shops will automatically get QR codes during signup.

## 📱 How Shop Owners Use QR Codes

1. **Access QR Code Page**
   - Go to Dashboard → Click "QR Code" quick action button, OR
   - Click "QR Code" tab in the left sidebar

2. **Generate QR Code** (if missing)
   - The QR code is automatically generated on page load
   - No action needed if already generated

3. **Download or Print**
   - Click "Download QR as PNG" to save a high-res image
   - Click "Print" for a print-friendly version
   - Copy the check-in link to share via email/message

4. **Reprint/Regenerate**
   - Click "Re-Generate" button to refresh the QR code
   - Useful if you need a new code or lost the printed version

## 🎯 QR Code Behavior

- **URL Format:** `https://digiget.uk/dashboard/{shopId}/checkin`
- **When Scanned:** Opens the shop's check-in page directly
- **No Login Required:** Customers can check in immediately
- **Domain Handling:** Automatically uses current domain (works on localhost, staging, production)

## 🔧 Super Admin Features

Super Admins can:
- View all shop QR codes in one place
- Activate/deactivate QR codes
- Download QR codes for any shop
- Copy links and email to shop owners
- Monitor QR code status across all shops

Access: Super Admin → QR Management

## 📝 Notes

- QR codes use the same URL structure - regenerating creates the same QR code
- The "Re-Generate" button updates the database timestamp but keeps the same URL
- QR codes work offline after being printed/downloaded
- Print function includes shop name and branding for professional display

## ✅ Testing Checklist

- [ ] Run `backfill_qr_codes.sql` for existing shops
- [ ] Visit Dashboard → QR Code page
- [ ] Verify QR code displays correctly
- [ ] Test download as PNG
- [ ] Test print function
- [ ] Test copy link
- [ ] Test regenerate button
- [ ] Scan QR code with phone camera
- [ ] Verify it opens the check-in page

---

**All set!** Shop owners can now easily generate, print, and share their check-in QR codes.

