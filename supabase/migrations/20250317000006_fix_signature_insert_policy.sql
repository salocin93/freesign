-- Drop existing signature policies if they exist
DROP POLICY IF EXISTS "Enable insert for recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable insert for document recipients" ON public.signatures;

-- Create a new policy for signature insertion
CREATE POLICY "Enable insert for document recipients" ON public.signatures
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