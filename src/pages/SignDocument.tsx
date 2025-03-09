import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, SigningElement } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFViewer } from '@/components/pdf/PDFViewer';

export default function SignDocument() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const recipientEmail = searchParams.get('recipient');
  
  const [document, setDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        if (!documentId || !recipientEmail) {
          throw new Error('Missing document ID or recipient email');
        }

        // Get document and check if recipient is authorized
        const { data: documentData, error: documentError } = await supabase
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

        if (documentError || !documentData) {
          throw new Error('Document not found');
        }

        // Check if the recipient exists and is authorized
        const recipient = documentData.recipients.find(r => r.email === recipientEmail);
        if (!recipient) {
          throw new Error('Unauthorized recipient');
        }

        if (recipient.status === 'completed') {
          throw new Error('Document already signed');
        }

        // Get document URL
        const { data: { publicUrl }, error: urlError } = await supabase
          .storage
          .from('documents')
          .getPublicUrl(documentData.storage_path);

        if (urlError) {
          throw new Error('Failed to get document URL');
        }

        // Get signing elements for this recipient
        const { data: elementsData, error: elementsError } = await supabase
          .from('signing_elements')
          .select('*')
          .eq('document_id', documentId)
          .eq('recipient_id', recipient.id);

        if (elementsError) {
          throw new Error('Failed to load signing elements');
        }

        setDocument(documentData);
        setDocumentUrl(publicUrl);
        setSigningElements(elementsData || []);
      } catch (error) {
        console.error('Error loading document:', error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId, recipientEmail]);

  const handleSign = async () => {
    // TODO: Implement signing logic
    toast.info('Signing functionality coming soon');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!document || !documentUrl) {
    return <div>Document not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{document.name}</h1>
        <Button onClick={handleSign}>Sign Document</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <PDFViewer
          url={documentUrl}
          signingElements={signingElements}
          onElementClick={() => {}}
        />
      </div>
    </div>
  );
} 