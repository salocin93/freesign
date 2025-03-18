-- Grant necessary permissions to authenticator role
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticator;

-- Explicitly grant permissions on specific tables
GRANT ALL ON TABLE public.documents TO authenticator;
GRANT ALL ON TABLE public.recipients TO authenticator;
GRANT ALL ON TABLE public.signatures TO authenticator;
GRANT ALL ON TABLE public.signing_elements TO authenticator;

-- Drop all existing signature policies
DROP POLICY IF EXISTS "Enable insert for document recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable read access for document owners and recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable update for document recipients" ON public.signatures;
DROP POLICY IF EXISTS "Enable delete for document recipients" ON public.signatures;

-- Create a simple policy for signatures that allows authenticator role
CREATE POLICY "Enable all access for authenticator" ON public.signatures
  FOR ALL
  TO authenticator
  USING (true)
  WITH CHECK (true);

-- Create policies for other roles
CREATE POLICY "Enable read access for document owners and recipients" ON public.signatures
  FOR SELECT
  TO authenticated, anon
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
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipients r
      WHERE r.document_id = signatures.document_id
      AND (
        (auth.role() = 'authenticated' AND r.email = auth.jwt()->>'email')
        OR
        (auth.role() = 'anon' AND EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = r.document_id
          AND d.status = 'pending'
        ))
      )
      AND r.status = 'pending'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON TABLES TO authenticator;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON SEQUENCES TO authenticator;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON FUNCTIONS TO authenticator; 