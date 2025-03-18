/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
*/

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SignatureModal } from '@/components/signature/SignatureModal';
import { SigningPDFViewer } from '@/components/pdf/SigningPDFViewer';
import { toast } from 'sonner';
import { SigningElement, Recipient } from '@/utils/types';

export default function SignDocument() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);

  useEffect(() => {
    async function fetchDocument() {
      try {
        if (!documentId || !token) {
          throw new Error('Document ID and token are required');
        }

        // Call the Edge Function to get document details
        const response = await fetch('/functions/v1/get-document-for-recipient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId, token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load document');
        }

        const { document } = await response.json();

        // Get document URL
        const { data: signUrl } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.storage_path, 3600);

        if (!signUrl?.signedUrl) throw new Error('Could not generate document URL');
        
        setDocumentUrl(signUrl.signedUrl);
        setSigningElements(document.signing_elements);
        setRecipient(document.recipients[0]); // The Edge Function returns only the authorized recipient
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        toast.error(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, token]);

  const handleSignatureComplete = async (signatureData: string, date: Date, agreed: boolean) => {
    try {
      if (!documentId) throw new Error('Document ID is required');
      
      // Save signature
      const { error: signError } = await supabase.from('signatures').insert({
        document_id: documentId,
        signature: signatureData,
        signed_at: date.toISOString(),
        agreed_to_terms: agreed
      });

      if (signError) throw signError;

      // If this is a recipient signing, update their status
      if (recipient) {
        const { error: recipientError } = await supabase
          .from('recipients')
          .update({ status: 'completed' })
          .eq('id', recipient.id);

        if (recipientError) throw recipientError;

        // Check if all recipients have signed
        const { data: recipients, error: recipientsError } = await supabase
          .from('recipients')
          .select('status')
          .eq('document_id', documentId);

        if (recipientsError) throw recipientsError;

        const allSigned = recipients?.every(r => r.status === 'completed');

        // If all recipients have signed, update document status
        if (allSigned) {
          const { error: documentError } = await supabase
            .from('documents')
            .update({ status: 'completed' })
            .eq('id', documentId);

          if (documentError) throw documentError;
        }
      }

      toast.success('Document signed successfully');
      navigate('/thank-you');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save signature');
      toast.error(err instanceof Error ? err.message : 'Failed to save signature');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sign Document</h1>
            {recipient && (
              <p className="text-gray-600">
                Signing as {recipient.name} ({recipient.email})
              </p>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <SigningPDFViewer 
            url={documentUrl} 
            signingElements={signingElements}
            recipients={recipient ? [recipient] : []}
          />
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={() => setIsSignatureModalOpen(true)}
            size="lg"
          >
            Sign Document
          </Button>
        </div>

        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onComplete={handleSignatureComplete}
        />
      </div>
    </div>
  );
} 