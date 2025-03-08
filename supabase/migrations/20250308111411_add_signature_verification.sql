
-- Create RLS policies for documents and storage
CREATE POLICY "Enable insert for authenticated users only" ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Add policy for storage access
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

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
