-- Add recipient_id column to signatures table
ALTER TABLE public.signatures
ADD COLUMN recipient_id UUID REFERENCES public.recipients(id) ON DELETE CASCADE;

-- Create an index on recipient_id for better query performance
CREATE INDEX idx_signatures_recipient_id ON public.signatures(recipient_id);

-- Update the insert policy to include recipient_id check
CREATE POLICY "Enable insert for document recipients" ON public.signatures
  FOR INSERT
  TO authenticated, anon, authenticator
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipients r
      WHERE r.id = recipient_id
      AND r.document_id = signatures.document_id
      AND (
        (auth.role() = 'authenticated' AND r.email = auth.jwt()->>'email')
        OR
        (auth.role() = 'anon' AND EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = r.document_id
          AND d.status = 'pending'
        ))
        OR
        (auth.role() = 'authenticator')
      )
      AND r.status = 'pending'
    )
  );

-- Enable RLS again with the new policy
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY; 