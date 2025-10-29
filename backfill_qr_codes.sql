-- =====================================================
-- Backfill QR Codes for Existing Shops
-- Run this in Supabase SQL Editor to generate QR URLs
-- for all shops that don't have one yet
-- =====================================================

-- Generate QR URLs for all shops that don't have one
-- Note: The component will automatically correct the domain when accessed,
-- but setting it here ensures the URL structure is correct
-- Replace 'https://digiget.uk' with your actual production domain if different
-- Update to use shorter URL format: /c/:shopId
UPDATE shops
SET qr_url = 'https://digiget.uk/c/' || id::text,
    qr_code_active = COALESCE(qr_code_active, true),
    updated_at = NOW()
WHERE qr_url IS NULL OR qr_url = '' OR qr_url LIKE '%/dashboard/%/checkin';

-- Verify the update
SELECT 
    id,
    shop_name,
    qr_url,
    qr_code_active,
    CASE 
        WHEN qr_url IS NOT NULL THEN '✓ QR URL Generated'
        ELSE '✗ Missing QR URL'
    END as status
FROM shops
ORDER BY shop_name;

-- Done! All shops now have QR codes.

