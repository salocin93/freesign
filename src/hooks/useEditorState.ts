import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, Recipient, SigningElement } from '@/utils/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'documents';

interface UseEditorStateReturn {
  document: Document | null;
  recipients: Recipient[];
  signingElements: SigningElement[];
  activeElementType: SigningElement['type'] | null;
  selectedRecipientId: string | null;
  isLoading: boolean;
  error: string | null;
  addSigningElement: (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void;
  removeSigningElement: (elementId: string) => void;
  handleSelectElement: (elementId: string) => void;
  setIsRecipientModalOpen: (isOpen: boolean) => void;
  setIsEmailModalOpen: (isOpen: boolean) => void;
}

export function useEditorState(documentId: string): UseEditorStateReturn {
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);
  const lastLoadedDocumentId = useRef<string | undefined>(undefined);

  const loadDocument = useCallback(async (force = false) => {
    if (!documentId) {
      console.log('Missing required params:', { documentId });
      setIsLoading(false);
      return;
    }

    // Check if we're already loading this document
    if (loadingRef.current) {
      console.log('Already loading document:', { documentId });
      return;
    }

    // Check if we've already loaded this document and don't need to force reload
    if (!force && initialLoadRef.current && documentId === lastLoadedDocumentId.current) {
      console.log('Document already loaded:', { documentId });
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    console.log('Starting document load:', { documentId });

    try {
      // Fetch document
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (documentError) {
        console.error('Error fetching document:', documentError);
        throw documentError;
      }
      setDocument(documentData);

      // Fetch recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('recipients')
        .select('*')
        .eq('document_id', documentId);

      if (recipientsError) throw recipientsError;
      setRecipients(recipientsData || []);

      // Fetch signing elements
      const { data: elementsData, error: elementsError } = await supabase
        .from('signing_elements')
        .select('*')
        .eq('document_id', documentId);

      if (elementsError) throw elementsError;
      setSigningElements(elementsData || []);

      initialLoadRef.current = true;
      lastLoadedDocumentId.current = documentId;
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
      navigate('/documents');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [documentId, navigate]);

  // Initial load
  useEffect(() => {
    // Reset state when document ID changes
    if (documentId !== lastLoadedDocumentId.current) {
      setDocument(null);
      setSigningElements([]);
      setRecipients([]);
      setSelectedRecipientId(null);
      initialLoadRef.current = false;
      lastLoadedDocumentId.current = undefined;
    }
    loadDocument(true);
  }, [loadDocument, documentId]);

  // Subscribe to changes in the recipients table
  useEffect(() => {
    if (!documentId) return;

    let isSubscribed = true;

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
          if (!isSubscribed) return;
          
          const newData = payload.new as Recipient;
          const oldData = payload.old as Recipient;
          
          if (payload.eventType === 'INSERT') {
            setRecipients(prev => [...prev, newData]);
          } else if (payload.eventType === 'UPDATE') {
            setRecipients(prev => 
              prev.map(r => r.id === newData.id ? newData : r)
            );
          } else if (payload.eventType === 'DELETE') {
            setRecipients(prev => 
              prev.filter(r => r.id !== oldData.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [documentId, loadDocument]);

  const addSigningElement = useCallback(async (
    type: SigningElement['type'],
    position: { x: number; y: number; pageIndex: number }
  ) => {
    if (!documentId || !selectedRecipientId) return;

    const newElement: SigningElement = {
      id: uuidv4(),
      document_id: documentId,
      recipient_id: selectedRecipientId,
      type,
      position,
      size: { width: 200, height: 100 },
      value: null,
    };

    try {
      const { error } = await supabase
        .from('signing_elements')
        .insert([{
          id: newElement.id,
          document_id: documentId,
          recipient_id: selectedRecipientId,
          type: newElement.type,
          position: newElement.position,
          size: newElement.size,
          value: newElement.value,
        }]);

      if (error) throw error;

      setSigningElements(prev => [...prev, newElement]);
      toast.success('Signing element added successfully');
    } catch (error) {
      console.error('Error adding signing element:', error);
      toast.error('Failed to add signing element');
    }
  }, [documentId, selectedRecipientId]);

  const removeSigningElement = useCallback(async (id: string) => {
    if (!documentId) return;

    try {
      const { error } = await supabase
        .from('signing_elements')
        .delete()
        .eq('id', id)
        .eq('document_id', documentId);

      if (error) throw error;

      setSigningElements(prev => prev.filter(el => el.id !== id));
      toast.success('Field removed successfully');
    } catch (error) {
      console.error('Error removing signing element:', error);
      toast.error('Failed to remove field');
    }
  }, [documentId]);

  const handleSelectElement = useCallback((elementId: string) => {
    const element = signingElements.find(el => el.id === elementId);
    if (element) {
      setSelectedRecipientId(element.recipient_id);
    }
  }, [signingElements]);

  return {
    document,
    recipients,
    signingElements,
    activeElementType,
    selectedRecipientId,
    isLoading,
    error,
    addSigningElement,
    removeSigningElement,
    handleSelectElement,
    setIsRecipientModalOpen,
    setIsEmailModalOpen,
  };
}
