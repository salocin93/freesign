import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, Recipient, SigningElement } from '@/utils/types';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'documents';

export function useEditorState(documentId: string | undefined, userId: string | undefined) {
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocument = useCallback(async () => {
    if (!documentId || !userId) {
      console.log('Missing required params:', { documentId, userId });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting to load document:', { documentId, userId });
      
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select(`
          *,
          recipients (
            id,
            name,
            email,
            status,
            document_id,
            created_at,
            updated_at
          )
        `)
        .eq('id', documentId)
        .eq('created_by', userId)
        .single();

      console.log('Document query result:', { 
        documentData, 
        documentError,
        file_path: documentData?.file_path,
        storage_path: documentData?.storage_path 
      });

      if (documentError || !documentData) {
        throw new Error('Document not found');
      }

      // Get document URL
      const storagePath = documentData.storage_path || documentData.file_path;
      if (!storagePath) {
        throw new Error('No storage path found for document');
      }

      console.log('Attempting to get signed URL for path:', storagePath);

      // First check if the file exists
      const { data: fileExists } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(storagePath.split('/').slice(0, -1).join('/'));

      console.log('File exists check:', fileExists);
      
      const { data: signUrl, error: signUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, 3600);

      console.log('Storage URL result:', { signUrl, signUrlError, storagePath });

      if (!signUrl?.signedUrl) {
        throw new Error('Could not generate document URL');
      }

      const newDocument = { ...documentData, url: signUrl.signedUrl };
      const newRecipients = documentData.recipients || [];

      // Only update state if the data has changed
      if (JSON.stringify(document) !== JSON.stringify(newDocument)) {
        setDocument(newDocument);
      }
      if (JSON.stringify(recipients) !== JSON.stringify(newRecipients)) {
        setRecipients(newRecipients);
      }

      const { data: elementsData, error: elementsError } = await supabase
        .from('signing_elements')
        .select('*')
        .eq('document_id', documentId);

      console.log('Signing elements result:', { elementsData, elementsError });

      if (elementsError) {
        throw elementsError;
      }

      if (elementsData) {
        const newElements = elementsData.map(element => ({
          id: element.id,
          type: element.type as SigningElement['type'],
          position: element.position,
          size: element.size,
          value: element.value,
          required: true,
          assignedTo: element.recipient_id,
        }));
        
        // Only update if elements have changed
        if (JSON.stringify(signingElements) !== JSON.stringify(newElements)) {
          setSigningElements(newElements);
        }
      }
    } catch (error) {
      console.error('Detailed error loading document:', error);
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, userId, navigate, document, recipients, signingElements]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Subscribe to changes in the recipients table
  useEffect(() => {
    if (!documentId) return;

    const subscription = supabase
      .channel(`recipients:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipients',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          // Only reload if there's an actual change in the data
          const newData = payload.new as Recipient;
          const oldData = payload.old as Recipient;
          if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
            loadDocument();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [documentId, loadDocument]);

  const handleSelectElement = useCallback((elementId: string) => {
    const element = signingElements.find(el => el.id === elementId);
    if (!element) return;
  }, [signingElements]);

  return {
    document,
    recipients,
    signingElements,
    selectedRecipientId,
    handleSelectElement,
    isLoading,
  };
}
