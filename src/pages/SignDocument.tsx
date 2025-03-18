/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
*/

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SignatureModal } from '@/components/signature/SignatureModal';
import { SigningPDFViewer } from '@/components/pdf/SigningPDFViewer';
import { toast } from 'sonner';
import { SigningElement, Recipient } from '@/utils/types';

/**
 * SignDocument Component
 * 
 * This page allows a recipient to securely access and sign a document using a unique token-based link.
 * 
 * Features:
 * - Secure document access using token-based links (validated via Supabase Edge Function)
 * - Displays PDF document along with interactive signing elements
 * - Handles signature submission and updates recipient/document status in Supabase
 * - Error handling, loading indicators, and user feedback
 */
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

  // Fetch document and recipient details securely via Edge Function
  useEffect(() => {
    async function fetchDocument() {
      try {
        if (!documentId || !token) {
          throw new Error('Document ID and token are required');
        }

        // Call Edge Function to securely fetch document & recipient
        const { data, error } = await supabase.functions.invoke('get-document-for-recipient', {
          body: { documentId, token },
        });

        if (error || !data?.document) {
          throw new Error(error?.message || 'Failed to load document');
        }

        const storagePath = data.document.storage_path;

        // Get signed URL for the document file
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !urlData?.signedUrl) {
          throw new Error('Could not generate document URL');
        }
        const fullSignedUrl = `${supabase.storage.url}${urlData.signedUrl}`;
        setDocumentUrl(fullSignedUrl);
        setSigningElements(data.document.signing_elements);
        setRecipient(data.document.recipients[0]); // Recipient from Edge Function result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load document';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, token]);

  /**
   * Handles when the user completes signing the document.
   * Updates recipient status and document status if all recipients have signed.
   */
  const handleSignatureComplete = async (signatureData: string, date: Date, agreed: boolean) => {
    try {
      if (!documentId) throw new Error('Document ID is required');

      // Save signature to Supabase
      const { error: signError } = await supabase.from('signatures').insert({
        document_id: documentId,
        signature: signatureData,
        signed_at: date.toISOString(),
        agreed_to_terms: agreed
      });

      if (signError) throw signError;

      // Update recipient status
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

        // Update document status if all signed
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
      const message = err instanceof Error ? err.message : 'Failed to save signature';
      setError(message);
      toast.error(message);
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
