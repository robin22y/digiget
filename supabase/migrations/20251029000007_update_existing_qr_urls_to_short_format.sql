/*
  # Update existing QR URLs to use shorter format
  
  1. Changes
    - Update existing QR URLs from /dashboard/{shopId}/checkin to /c/{shopId}
    - Shorter URLs are easier for QR codes and sharing
*/

-- Update existing QR URLs to shorter format
UPDATE shops
SET qr_url = REPLACE(qr_url, '/dashboard/' || id::text || '/checkin', '/c/' || id::text)
WHERE qr_url LIKE '%/dashboard/%/checkin';

-- Also update branded QR URLs if they exist (assuming same pattern)
-- Note: This will only affect URLs that match the old pattern

