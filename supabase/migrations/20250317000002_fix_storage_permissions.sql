-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable read for users who created documents" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users who created documents" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users who created documents" ON storage.objects;

-- Create new storage policies that allow document access for recipients
CREATE POLICY "Enable read for document recipients" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND (
      -- Allow access if user is the document creator
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Allow access if user is a recipient of the document
      EXISTS (
        SELECT 1 FROM public.recipients r
        JOIN public.documents d ON d.id = r.document_id
        WHERE r.email = auth.jwt()->>'email'
        AND d.storage_path = name
      )
    )
  );

CREATE POLICY "Enable insert for document creators" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Enable update for document creators" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Enable delete for document creators" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO service_role;

-- Set default privileges for future storage objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON SEQUENCES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON FUNCTIONS TO authenticated, service_role; 