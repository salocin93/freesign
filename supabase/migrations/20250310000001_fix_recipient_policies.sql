-- Drop existing recipient policies if they exist
DROP POLICY IF EXISTS "Enable insert for document owners" ON public.recipients;
DROP POLICY IF EXISTS "Enable read for document owners" ON public.recipients;
DROP POLICY IF EXISTS "Enable update for document owners" ON public.recipients;
DROP POLICY IF EXISTS "Enable delete for document owners" ON public.recipients;

-- Create policies for recipients table
CREATE POLICY "Enable insert for document owners" ON public.recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = recipients.document_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable read for document owners" ON public.recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = recipients.document_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable update for document owners" ON public.recipients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = recipients.document_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable delete for document owners" ON public.recipients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = recipients.document_id
      AND created_by = auth.uid()
    )
  );

-- Grant permissions again to ensure they're set
GRANT ALL ON TABLE public.recipients TO authenticated; 