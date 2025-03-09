import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SignatureModal } from '@/components/signature/SignatureModal';
import { SigningPDFViewer } from '@/components/pdf/SigningPDFViewer';
import { toast } from 'sonner';

interface Recipient {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function SignDocument() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const recipientEmail = searchParams.get('recipient');
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    async function fetchDocument() {
      try {
        if (!documentId) {
          throw new Error('Document ID is required');
        }

        // Get document and check if recipient is authorized
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select(`
            *,
            recipients (
              id,
              name,
              email,
              status
            )
          `)
          .eq('id', documentId)
          .single();

        if (docError) throw docError;
        if (!document) throw new Error('Document not found');

        // Check if the recipient exists and is authorized
        if (recipientEmail) {
          const recipientData = document.recipients.find(r => r.email === recipientEmail);
          if (!recipientData) {
            throw new Error('Unauthorized recipient');
          }

          if (recipientData.status === 'completed') {
            throw new Error('Document already signed');
          }

          setRecipient(recipientData);
        }

        // Get document URL
        const { data: signUrl } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600);

        if (!signUrl?.signedUrl) throw new Error('Could not generate document URL');
        
        setDocumentUrl(signUrl.signedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        toast.error(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, recipientEmail]);

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
          <SigningPDFViewer url={documentUrl} />
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