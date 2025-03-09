-- Reset and reapply schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure storage schema permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO authenticated;

-- Explicitly grant permissions on specific tables
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.recipients TO authenticated;
GRANT ALL ON TABLE public.signatures TO authenticated;
GRANT ALL ON TABLE public.signing_elements TO authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.documents;
DROP POLICY IF EXISTS "Enable read for users who created documents" ON public.documents;
DROP POLICY IF EXISTS "Enable update for users who created documents" ON public.documents;
DROP POLICY IF EXISTS "Enable delete for users who created documents" ON public.documents;

-- Recreate document policies
CREATE POLICY "Enable insert for authenticated users only" ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable read for users who created documents" ON public.documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Enable update for users who created documents" ON public.documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Enable delete for users who created documents" ON public.documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable read for users who created documents" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users who created documents" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users who created documents" ON storage.objects;

-- Recreate storage policies with simpler conditions
CREATE POLICY "Enable read for users who created documents" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable insert for authenticated users" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable update for users who created documents" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable delete for users who created documents" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
GRANT ALL ON FUNCTIONS TO authenticated;

-- Drop existing signing_elements policies if they exist
DROP POLICY IF EXISTS "Enable insert for document owners" ON public.signing_elements;
DROP POLICY IF EXISTS "Enable update for document owners" ON public.signing_elements;
DROP POLICY IF EXISTS "Enable delete for document owners" ON public.signing_elements;

-- Create policies for signing_elements table
CREATE POLICY "Enable insert for document owners" ON public.signing_elements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = signing_elements.document_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable update for document owners" ON public.signing_elements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = signing_elements.document_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable delete for document owners" ON public.signing_elements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = signing_elements.document_id
      AND created_by = auth.uid()
    )
  );

-- Grant permissions again to ensure they're set
GRANT ALL ON TABLE public.signing_elements TO authenticated; 