-- Create enum for signature types
CREATE TYPE signature_type AS ENUM ('draw', 'type', 'upload');

-- Create signatures table for storing user signatures
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type signature_type NOT NULL,
    value TEXT NOT NULL, -- Base64 encoded signature data
    name VARCHAR, -- Optional name for the signature
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signature_fields table for placing signatures on documents
CREATE TABLE signature_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) NOT NULL,
    recipient_id UUID REFERENCES recipients(id) NOT NULL,
    signature_id UUID REFERENCES signatures(id),
    page_number INTEGER NOT NULL,
    position JSONB NOT NULL, -- {x: number, y: number}
    size JSONB NOT NULL, -- {width: number, height: number}
    required BOOLEAN DEFAULT true,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_fields ENABLE ROW LEVEL SECURITY;

-- Signatures policies
CREATE POLICY "Users can view their own signatures"
ON signatures FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures"
ON signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures"
ON signatures FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures"
ON signatures FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Signature fields policies
CREATE POLICY "Users can view signature fields for their documents"
ON signature_fields FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = signature_fields.document_id
        AND documents.created_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM recipients
        WHERE recipients.id = signature_fields.recipient_id
        AND recipients.email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Document creators can manage signature fields"
ON signature_fields FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = signature_fields.document_id
        AND documents.created_by = auth.uid()
    )
);

-- Create functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_signatures_updated_at
    BEFORE UPDATE ON signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signature_fields_updated_at
    BEFORE UPDATE ON signature_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_signatures_user_id ON signatures(user_id);
CREATE INDEX idx_signature_fields_document_id ON signature_fields(document_id);
CREATE INDEX idx_signature_fields_recipient_id ON signature_fields(recipient_id);
