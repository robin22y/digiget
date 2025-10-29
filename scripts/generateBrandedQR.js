/**
 * DigiGet Branded QR Code Generator
 * Generates A5-sized branded QR posters for shops (PNG and PDF)
 * 
 * Usage:
 *   node scripts/generateBrandedQR.js <shopId> [--force]
 *   node scripts/generateBrandedQR.js --all   (generate for all shops)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const A5_WIDTH = 1748; // A5 at 300 DPI (148mm × 210mm)
const A5_HEIGHT = 2480;
const BRAND_COLOR = '#5170FF';
const BRAND_COLOR_RGB = { r: 81, g: 112, b: 255 };
const HEADER_HEIGHT = 150;
const QR_SIZE = 900;
const FOOTER_HEIGHT = 400;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load shop data
 */
async function loadShop(shopId) {
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_name, owner_name, logo_url, qr_url, image_url')
    .eq('id', shopId)
    .single();

  if (error) throw new Error(`Failed to load shop: ${error.message}`);
  if (!data) throw new Error(`Shop ${shopId} not found`);

  // Ensure QR URL exists
  if (!data.qr_url) {
    data.qr_url = `https://digiget.uk/dashboard/${data.id}/checkin`;
    await supabase
      .from('shops')
      .update({ qr_url: data.qr_url })
      .eq('id', shopId);
  }

  return data;
}

/**
 * Load all shops
 */
async function loadAllShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_name, owner_name, logo_url, qr_url, image_url')
    .not('id', 'is', null);

  if (error) throw new Error(`Failed to load shops: ${error.message}`);
  return data || [];
}

/**
 * Create DigiGet logo SVG (placeholder - replace with actual logo if available)
 */
function createLogoSVG(width = 200, height = 60) {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="${height * 0.7}" font-family="Arial, sans-serif" font-size="${height * 0.6}" font-weight="bold" fill="white">
        DigiGet
      </text>
    </svg>
  `;
}

/**
 * Generate PNG poster
 */
async function generatePNG(shop) {
  const canvas = createCanvas(A5_WIDTH, A5_HEIGHT);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A5_WIDTH, A5_HEIGHT);

  // Brand header (blue bar)
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillRect(0, 0, A5_WIDTH, HEADER_HEIGHT);

  // DigiGet logo (white text on blue)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('DigiGet', 40, HEADER_HEIGHT / 2);

  // Shop name (below header)
  const shopNameY = HEADER_HEIGHT + 60;
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  // Word wrap shop name if too long
  const maxWidth = A5_WIDTH - 100;
  const words = shop.shop_name.split(' ');
  let line = '';
  let y = shopNameY;
  
  words.forEach((word) => {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, A5_WIDTH / 2, y);
      line = word + ' ';
      y += 60;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, A5_WIDTH / 2, y);
  
  const shopNameBottom = y + 60;

  // Shop logo (if available)
  let logoY = shopNameBottom + 20;
  if (shop.logo_url || shop.image_url) {
    try {
      const logoUrl = shop.logo_url || shop.image_url;
      const response = await fetch(logoUrl);
      if (response.ok) {
        const logoBuffer = await response.arrayBuffer();
        const logo = await loadImage(Buffer.from(logoBuffer));
        const logoSize = 150;
        const logoX = (A5_WIDTH - logoSize) / 2;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        logoY += logoSize + 30;
      }
    } catch (error) {
      console.warn('Could not load shop logo:', error.message);
    }
  }

  // Generate QR code
  const qrDataURL = await QRCode.toDataURL(shop.qr_url, {
    width: QR_SIZE,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const qrImage = await loadImage(qrDataURL);
  const qrX = (A5_WIDTH - QR_SIZE) / 2;
  const qrY = logoY + 40;
  ctx.drawImage(qrImage, qrX, qrY, QR_SIZE, QR_SIZE);

  // Ad placeholder (invisible white rectangle at bottom)
  const adPlaceholderY = A5_HEIGHT - FOOTER_HEIGHT - 40;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(50, adPlaceholderY, A5_WIDTH - 100, FOOTER_HEIGHT);

  // Footer text
  const footerY = A5_HEIGHT - 30;
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Powered by DigiGet – digiget.uk', A5_WIDTH / 2, footerY);

  return canvas.toBuffer('image/png');
}

/**
 * Generate PDF poster
 */
async function generatePDF(shop) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH / 4, A5_HEIGHT / 4]); // PDF units are in points (1/72 inch)
  
  // Convert pixels to points (300 DPI)
  const pageWidth = A5_WIDTH / 4;
  const pageHeight = A5_HEIGHT / 4;
  const headerHeightPt = HEADER_HEIGHT / 4;
  const qrSizePt = QR_SIZE / 4;
  
  // Brand header
  page.drawRectangle({
    x: 0,
    y: pageHeight - headerHeightPt,
    width: pageWidth,
    height: headerHeightPt,
    color: rgb(BRAND_COLOR_RGB.r / 255, BRAND_COLOR_RGB.g / 255, BRAND_COLOR_RGB.b / 255),
  });

  // DigiGet logo text
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('DigiGet', {
    x: 10,
    y: pageHeight - headerHeightPt / 2 + 8,
    size: 16,
    font: font,
    color: rgb(1, 1, 1),
  });

  // Shop name
  page.drawText(shop.shop_name, {
    x: pageWidth / 2,
    y: pageHeight - headerHeightPt - 20,
    size: 12,
    font: font,
    color: rgb(0.12, 0.16, 0.23),
    maxWidth: pageWidth - 20,
    lineHeight: 14,
  });

  // Generate QR code
  const qrDataURL = await QRCode.toDataURL(shop.qr_url, {
    width: QR_SIZE,
    margin: 2,
  });

  // Embed QR code image
  const qrImageBytes = Buffer.from(qrDataURL.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  
  const qrX = (pageWidth - qrSizePt) / 2;
  const qrY = pageHeight - headerHeightPt - 60 - qrSizePt;
  
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSizePt,
    height: qrSizePt,
  });

  // Footer text
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Powered by DigiGet – digiget.uk', {
    x: pageWidth / 2,
    y: 10,
    size: 4,
    font: helvetica,
    color: rgb(0.61, 0.64, 0.69),
  });

  return await pdfDoc.save();
}

/**
 * Upload to Supabase Storage
 */
async function uploadToStorage(shopId, pngBuffer, pdfBuffer) {
  const pngPath = `branded-qrs/${shopId}.png`;
  const pdfPath = `branded-qrs/${shopId}.pdf`;

  // Upload PNG
  const { data: pngData, error: pngError } = await supabase.storage
    .from('public')
    .upload(pngPath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (pngError) {
    throw new Error(`Failed to upload PNG: ${pngError.message}`);
  }

  // Upload PDF
  const { data: pdfData, error: pdfError } = await supabase.storage
    .from('public')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (pdfError) {
    throw new Error(`Failed to upload PDF: ${pdfError.message}`);
  }

  // Get public URLs
  const { data: pngUrlData } = supabase.storage
    .from('public')
    .getPublicUrl(pngPath);

  const { data: pdfUrlData } = supabase.storage
    .from('public')
    .getPublicUrl(pdfPath);

  return {
    pngUrl: pngUrlData.publicUrl,
    pdfUrl: pdfUrlData.publicUrl,
  };
}

/**
 * Update shop record with branded QR URLs
 */
async function updateShop(shopId, pngUrl, pdfUrl) {
  const { error } = await supabase
    .from('shops')
    .update({
      branded_qr_url: pngUrl,
      branded_qr_pdf: pdfUrl,
    })
    .eq('id', shopId);

  if (error) {
    throw new Error(`Failed to update shop: ${error.message}`);
  }
}

/**
 * Generate branded QR for a single shop
 */
async function generateForShop(shopId, force = false) {
  try {
    console.log(`\n📦 Generating branded QR for shop: ${shopId}...`);
    
    const shop = await loadShop(shopId);
    console.log(`   Shop: ${shop.shop_name}`);
    console.log(`   QR URL: ${shop.qr_url}`);

    // Check if already exists (unless force)
    if (!force) {
      const { data } = await supabase
        .from('shops')
        .select('branded_qr_url')
        .eq('id', shopId)
        .single();

      if (data?.branded_qr_url) {
        console.log(`   ⚠️  Branded QR already exists. Use --force to regenerate.`);
        return;
      }
    }

    // Generate PNG and PDF
    console.log(`   🎨 Generating PNG...`);
    const pngBuffer = await generatePNG(shop);
    
    console.log(`   📄 Generating PDF...`);
    const pdfBuffer = await generatePDF(shop);

    // Upload to Supabase Storage
    console.log(`   ☁️  Uploading to Supabase Storage...`);
    const { pngUrl, pdfUrl } = await uploadToStorage(shopId, pngBuffer, pdfBuffer);

    // Update shop record
    console.log(`   💾 Updating shop record...`);
    await updateShop(shopId, pngUrl, pdfUrl);

    console.log(`   ✅ Success!`);
    console.log(`      PNG: ${pngUrl}`);
    console.log(`      PDF: ${pdfUrl}`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const shopId = args[0];
  const force = args.includes('--force');

  try {
    if (shopId === '--all') {
      console.log('🚀 Generating branded QRs for all shops...');
      const shops = await loadAllShops();
      console.log(`   Found ${shops.length} shops\n`);

      for (const shop of shops) {
        try {
          await generateForShop(shop.id, force);
        } catch (error) {
          console.error(`   Failed for shop ${shop.id}: ${error.message}`);
        }
      }

      console.log(`\n✨ Completed processing ${shops.length} shops.`);
    } else if (shopId) {
      await generateForShop(shopId, force);
    } else {
      console.log('Usage:');
      console.log('  node scripts/generateBrandedQR.js <shopId> [--force]');
      console.log('  node scripts/generateBrandedQR.js --all [--force]');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();


