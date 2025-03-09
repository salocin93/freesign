import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, Recipient, SigningElement } from '@/utils/types';
import { toast } from 'sonner';

export function useEditorState(documentId: string | undefined, userId: string | undefined) {
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocument = useCallback(async () => {
    if (!documentId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
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
        .eq('user_id', userId)
        .single();

      if (documentError || !documentData) {
        throw new Error('Document not found');
      }

      // Get document URL
      const { data: signUrl } = await supabase.storage
        .from('documents')
        .createSignedUrl(documentData.file_path, 3600);

      if (!signUrl?.signedUrl) {
        throw new Error('Could not generate document URL');
      }

      setDocument({ ...documentData, url: signUrl.signedUrl });
      setRecipients(documentData.recipients || []);

      const { data: elementsData, error: elementsError } = await supabase
        .from('signing_elements')
        .select('*')
        .eq('document_id', documentId);

      if (elementsError) {
        throw elementsError;
      }

      if (elementsData) {
        setSigningElements(elementsData.map(element => ({
          id: element.id,
          type: element.type as SigningElement['type'],
          position: element.position,
          size: element.size,
          value: element.value,
          required: true,
          assignedTo: element.recipient_id,
        })));
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, userId, navigate]);

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
        () => {
          loadDocument();
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

    // Handle element selection logic
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
