-- Create payroll-reports storage bucket
-- Run this in Supabase SQL Editor

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payroll-reports',
  'payroll-reports',
  true,
  5242880, -- 5MB limit
  ARRAY['text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload (shop owners)
CREATE POLICY "Shop owners can upload payroll reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payroll-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to payroll reports (for CSV downloads)
CREATE POLICY "Public can read payroll reports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payroll-reports');

-- Allow authenticated users to delete their own files
CREATE POLICY "Shop owners can delete their payroll reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payroll-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add comment
COMMENT ON TABLE storage.objects IS 'Payroll reports are stored here. Files are organized by shop_id/filename.csv. Public read access for CSV downloads.';

