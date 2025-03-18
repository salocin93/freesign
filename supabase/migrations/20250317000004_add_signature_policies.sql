-- Drop existing signature policies if they exist
DROP POLICY IF EXISTS "Enable read access for own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Enable insert for document recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable update for document recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable delete for document recipients" ON public.signatures;

-- Create policies for signatures table
CREATE POLICY "Enable read access for document owners and recipients" ON public.signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = signatures.document_id
      AND (
        d.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.recipients r
          WHERE r.document_id = d.id
          AND r.email = auth.jwt()->>'email'
        )
      )
    )
  );

CREATE POLICY "Enable insert for document recipients" ON public.signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND EXISTS (
        SELECT 1 FROM public.recipients r
        WHERE r.document_id = d.id
        AND r.email = auth.jwt()->>'email'
        AND r.status = 'pending'
      )
    )
  );

CREATE POLICY "Enable update for document recipients" ON public.signatures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = signatures.document_id
      AND EXISTS (
        SELECT 1 FROM public.recipients r
        WHERE r.document_id = d.id
        AND r.email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Enable delete for document recipients" ON public.signatures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = signatures.document_id
      AND EXISTS (
        SELECT 1 FROM public.recipients r
        WHERE r.document_id = d.id
        AND r.email = auth.jwt()->>'email'
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Grant permissions again to ensure they're set
GRANT ALL ON TABLE public.signatures TO authenticated; 