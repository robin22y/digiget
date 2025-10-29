# Branded QR Code Generator

## Overview

This utility generates professional A5-sized branded QR code posters for each shop, featuring:
- DigiGet brand header (#5170FF blue)
- Shop name and logo (if available)
- Large QR code linking to the shop's check-in page
- Footer with "Powered by DigiGet" text
- Invisible placeholder area at bottom for future ads

## Setup

### 1. Install Dependencies

```bash
npm install canvas pdf-lib qrcode
```

### 2. Set Environment Variables

Create a `.env` file or set these environment variables:

```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key  # Not anon key - needs admin access
```

**Important:** Use the **Service Role Key** (not the anon key) to enable admin access for file uploads and database updates.

### 3. Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `public`
3. Set it as **Public**
4. Set file size limit to 50MB
5. Add allowed MIME types: `image/png`, `application/pdf`

### 4. Run Database Migration

Run `setup_branded_qr_columns.sql` in your Supabase SQL Editor to add the necessary columns:

```sql
ALTER TABLE shops ADD COLUMN branded_qr_url TEXT;
ALTER TABLE shops ADD COLUMN branded_qr_pdf TEXT;
```

## Usage

### Generate for a Single Shop

```bash
node scripts/generateBrandedQR.js <shopId>
```

Example:
```bash
node scripts/generateBrandedQR.js a07140e1-650d-45e1-808c-6f3d36492d8e
```

### Generate for All Shops

```bash
node scripts/generateBrandedQR.js --all
```

### Force Regeneration

To regenerate even if a branded QR already exists:

```bash
node scripts/generateBrandedQR.js <shopId> --force
node scripts/generateBrandedQR.js --all --force
```

## Output

The script generates:
- **PNG file**: High-resolution (1748×2480px) A5 poster at 300 DPI
- **PDF file**: Print-ready A5 PDF version

Both files are:
- Uploaded to Supabase Storage under `/branded-qrs/{shopId}.png` and `/branded-qrs/{shopId}.pdf`
- Publicly accessible via URLs
- Automatically saved to the `shops` table as `branded_qr_url` and `branded_qr_pdf`

## Design Specifications

- **Size**: A5 (148mm × 210mm) at 300 DPI
- **Brand Color**: #5170FF (DigiGet blue)
- **Layout**:
  - Header: 150px blue bar with "DigiGet" logo text
  - Shop name: Bold 48px dark text (#1E293B)
  - Shop logo: 150×150px (if available)
  - QR code: 900×900px centered
  - Footer: 400px placeholder area (invisible)
  - Footer text: "Powered by DigiGet – digiget.uk" in gray (#9CA3AF)

## Frontend Integration

The generated branded QRs are automatically available in:
- **Shop Dashboard** → QR Code page → "Branded QR Poster" section
- **Super Admin** → QR Management → "Branded" column with download links

## Troubleshooting

### Canvas Installation Issues (Windows)

On Windows, you may need to install additional dependencies:

```bash
npm install --build-from-source canvas
```

Or use pre-built binaries:
```bash
npm install canvas --build-from-source=false
```

### Storage Upload Errors

- Verify the `public` bucket exists and is public
- Check that the Service Role Key has proper permissions
- Ensure file size limits are set correctly

### PDF Generation Issues

- PDF generation uses `pdf-lib` which should work cross-platform
- If issues occur, check that all dependencies are installed: `npm install pdf-lib`

## Notes

- The script automatically ensures each shop has a `qr_url` before generating
- Shop logos are fetched from `logo_url` or `image_url` columns
- If a shop logo fails to load, the poster continues without it
- The ad placeholder area is reserved for future use (currently invisible)

## Future Enhancements

- Integrate with a backend API endpoint for on-demand generation
- Add customization options (colors, layouts)
- Support for different sizes (A4, business card)
- Automatic generation on shop creation


