ALTER TABLE signatures
ADD COLUMN verification_hash TEXT NOT NULL,
ADD COLUMN metadata JSONB DEFAULT '{}',
ADD COLUMN ip_address TEXT,
ADD COLUMN user_agent TEXT;

-- Add an audit log for signature events
CREATE TABLE signature_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_id UUID REFERENCES signatures(id),
  document_id UUID REFERENCES documents(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE signature_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for document owners and signers" ON signature_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_audit_logs.document_id
      AND (d.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM recipients r
        WHERE r.document_id = d.id
        AND r.email = auth.email()
      ))
    )
  ); 