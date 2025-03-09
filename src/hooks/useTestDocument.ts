import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Document, Recipient } from '@/utils/types';

export function useTestDocument() {
  const [document, setDocument] = useState<Document | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    async function createTestDocument() {
      try {
        // Create a test document
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            name: 'Test Document',
            file_path: 'test/sample.pdf', // Make sure this file exists in your storage
            user_id: 'test-user',
            status: 'pending'
          })
          .select()
          .single();

        if (docError) throw docError;

        // Create a test recipient
        const { data: recip, error: recipError } = await supabase
          .from('recipients')
          .insert({
            document_id: doc.id,
            name: 'Test User',
            email: 'test@example.com',
            status: 'pending'
          })
          .select()
          .single();

        if (recipError) throw recipError;

        setDocument(doc);
        setRecipient(recip);
      } catch (error) {
        console.error('Error creating test data:', error);
      }
    }

    createTestDocument();
  }, []);

  return { document, recipient };
} 