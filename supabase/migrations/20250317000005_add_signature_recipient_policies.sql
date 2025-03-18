-- Drop existing signature policies if they exist
DROP POLICY IF EXISTS "Enable read for own signatures" ON public.signatures;
DROP POLICY IF EXISTS "Enable insert for recipients" ON public.signatures;

-- Create policies for signatures table
CREATE POLICY "Enable read for document owners and recipients" ON public.signatures
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

CREATE POLICY "Enable insert for recipients" ON public.signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipients r
      WHERE r.document_id = signatures.document_id
      AND r.email = auth.jwt()->>'email'
      AND r.status = 'pending'
    )
  );

-- Grant permissions again to ensure they're set
GRANT ALL ON TABLE public.signatures TO authenticated; 