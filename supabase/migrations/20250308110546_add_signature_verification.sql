-- 1. Drop all existing tables and types
DROP SCHEMA public CASCADE;

-- 2. Recreate the public schema
CREATE SCHEMA public;

-- 3. Grant necessary privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Create your base tables
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  storage_path TEXT,
  url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  name TEXT,
  verification_hash TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  geolocation JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE signing_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE signature_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_id UUID REFERENCES signatures(id),
  document_id UUID REFERENCES documents(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  geolocation JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX idx_signature_audit_logs_signature_id ON signature_audit_logs(signature_id);
CREATE INDEX idx_signature_audit_logs_document_id ON signature_audit_logs(document_id);
CREATE INDEX idx_signatures_verification_hash ON signatures(verification_hash);

-- 6. Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Documents
CREATE POLICY "Enable read access for document owners" ON documents
  FOR SELECT
  USING (created_by = auth.uid());

-- Recipients
CREATE POLICY "Enable read access for document owners and recipients" ON recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = recipients.document_id
      AND (d.created_by = auth.uid() OR recipients.email = auth.email())
    )
  );

-- Signatures
CREATE POLICY "Enable read access for own signatures" ON signatures
  FOR SELECT
  USING (user_id = auth.uid());

-- Signing Elements
CREATE POLICY "Enable read access for document owners and recipients" ON signing_elements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signing_elements.document_id
      AND (d.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM recipients r
        WHERE r.document_id = d.id
        AND r.email = auth.email()
      ))
    )
  );

-- Audit Logs
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