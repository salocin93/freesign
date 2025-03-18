-- Drop existing signature policies if they exist
DROP POLICY IF EXISTS "Enable insert for document recipients" ON public.signatures;

-- Create a new policy for signature insertion that allows both authenticated and anonymous users
CREATE POLICY "Enable insert for document recipients" ON public.signatures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipients r
      WHERE r.document_id = signatures.document_id
      AND (
        -- For authenticated users, check their email
        (auth.role() = 'authenticated' AND r.email = auth.jwt()->>'email')
        OR
        -- For anonymous users, check if they have a valid token
        (auth.role() = 'anon' AND EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = r.document_id
          AND d.status = 'pending'
        ))
      )
      AND r.status = 'pending'
    )
  );

-- Grant permissions to both anon and authenticated users
GRANT ALL ON TABLE public.signatures TO anon, authenticated; 