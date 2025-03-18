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
import { PDFErrorBoundary } from '@/components/pdf/PDFErrorBoundary';
import { toast } from 'sonner';
import { SigningElement, Recipient, SignatureData } from '@/utils/types';
import { getClientInfo } from '@/utils/clientInfo';
import { SignatureVerificationUtil } from '@/utils/signatureVerification';

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

  useEffect(() => {
    async function fetchDocument() {
      try {
        console.log('Fetching document:', { documentId, token });

        if (!documentId || !token) {
          throw new Error('Document ID and token are required');
        }

        // --- Call Edge Function ---
        const { data, error } = await supabase.functions.invoke('get-document-for-recipient', {
          body: { documentId, token },
        });

        if (error || !data?.document) {
          console.error('Error fetching document from Edge Function:', error, data);
          throw new Error(error?.message || 'Failed to load document');
        }

        console.log('Edge Function returned document:', data.document);

        const storagePath = data.document.storage_path;
        console.log('Document storage path:', storagePath);

        // --- Get signed URL ---
        const { data: urlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !urlData?.signedUrl) {
          console.error('Error generating signed URL:', urlError);
          throw new Error('Could not generate document URL');
        }

        console.log('Signed URL:', urlData.signedUrl);

        setDocumentUrl(urlData.signedUrl);
        setSigningElements(data.document.signing_elements);
        setRecipient(data.document.recipients[0]); // Edge Function returns correct recipient
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load document';
        console.error('Fetch document failed:', err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, token]);

  const handleSignatureComplete = async (signatureData: string, date: Date, agreed: boolean) => {
    try {
      if (!documentId) throw new Error('Document ID is required');
      if (!recipient) throw new Error('Recipient information is required');

      console.log('Saving signature for document:', documentId);

      // Get comprehensive client information
      const clientInfo = await getClientInfo();
      
      // Create verification hash
      const verificationHash = await SignatureVerificationUtil.createSignatureHash(
        signatureData,
        recipient.id,
        clientInfo.timestamp,
        documentId
      );

      // Create a proper SignatureData object
      const signature: SignatureData = {
        dataUrl: signatureData,
        type: 'uploaded'
      };

      const { error: signError } = await supabase.from('signatures').insert({
        document_id: documentId,
        recipient_id: recipient.id,
        value: signature.dataUrl,
        type: signature.type,
        created_at: date.toISOString(),
        agreed_to_terms: agreed,
        verification_hash: verificationHash,
        metadata: {
          userAgent: clientInfo.userAgent,
          timestamp: clientInfo.timestamp,
          geolocation: clientInfo.geolocation,
        },
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
      });

      if (signError) throw signError;

      // Log the signature event
      await supabase.from('signature_audit_logs').insert({
        document_id: documentId,
        recipient_id: recipient.id,
        event_type: 'signature_created',
        event_data: {
          type: signature.type,
          metadata: {
            userAgent: clientInfo.userAgent,
            timestamp: clientInfo.timestamp,
            geolocation: clientInfo.geolocation,
          },
        },
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        geolocation: clientInfo.geolocation,
      });

      if (recipient) {
        const { error: recipientError } = await supabase
          .from('recipients')
          .update({ status: 'completed' })
          .eq('id', recipient.id);

        if (recipientError) throw recipientError;

        const { data: recipients, error: recipientsError } = await supabase
          .from('recipients')
          .select('status')
          .eq('document_id', documentId);

        if (recipientsError) throw recipientsError;

        const allSigned = recipients?.every(r => r.status === 'completed');

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
      console.error('Signature save error:', err);
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
          <PDFErrorBoundary>
            {documentUrl ? (
              <SigningPDFViewer
                url={documentUrl}
                signingElements={signingElements}
                recipients={recipient ? [recipient] : []}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No document URL available</p>
              </div>
            )}
          </PDFErrorBoundary>
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