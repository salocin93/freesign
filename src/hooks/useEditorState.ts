import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, Recipient, SigningElement } from '@/utils/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { handleError, handleApiError, AppError } from '@/utils/errorHandling';

const STORAGE_BUCKET = 'documents';

interface UseEditorStateReturn {
  document: Document | null;
  recipients: Recipient[];
  signingElements: SigningElement[];
  activeElementType: SigningElement['type'] | null;
  selectedRecipientId: string | null;
  isLoading: boolean;
  error: string | null;
  isRecipientModalOpen: boolean;
  isEmailModalOpen: boolean;
  addSigningElement: (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void;
  removeSigningElement: (elementId: string) => void;
  handleSelectElement: (elementId: string) => void;
  setIsRecipientModalOpen: (isOpen: boolean) => void;
  setIsEmailModalOpen: (isOpen: boolean) => void;
  setActiveElementType: (type: SigningElement['type'] | null) => void;
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
      setError('Missing document ID');
      setIsLoading(false);
      return;
    }

    if (loadingRef.current) return;
    if (!force && initialLoadRef.current && documentId === lastLoadedDocumentId.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const documentData = await handleApiError(
        async () => {
          const { data, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

          if (documentError) throw documentError;
          return data;
        },
        'loadDocument'
      ) as Document;

      if (documentData.storage_path) {
        const { data: { publicUrl } } = supabase
          .storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(documentData.storage_path);
        
        documentData.url = publicUrl;
      }

      setDocument(documentData);

      const recipientsData = await handleApiError(
        async () => {
          const { data, error: recipientsError } = await supabase
            .from('recipients')
            .select('*')
            .eq('document_id', documentId);

          if (recipientsError) throw recipientsError;
          return data;
        },
        'loadRecipients'
      ) as Recipient[];

      setRecipients(recipientsData || []);

      const elementsData = await handleApiError(
        async () => {
          const { data, error: elementsError } = await supabase
            .from('signing_elements')
            .select('*')
            .eq('document_id', documentId);

          if (elementsError) throw elementsError;
          return data;
        },
        'loadSigningElements'
      ) as SigningElement[];

      setSigningElements(elementsData || []);

      initialLoadRef.current = true;
      lastLoadedDocumentId.current = documentId;
    } catch (err) {
      const appError = handleError(err, 'loadDocument');
      setError(appError.message);
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
    if (!documentId || !selectedRecipientId) {
      throw new AppError('Missing required parameters', 'INVALID_PARAMS');
    }

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
      await handleApiError(
        async () => {
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
        },
        'addSigningElement'
      );

      setSigningElements(prev => [...prev, newElement]);
      toast.success('Signing element added successfully');
      setActiveElementType(null);
    } catch (err) {
      handleError(err, 'addSigningElement');
    }
  }, [documentId, selectedRecipientId]);

  const removeSigningElement = useCallback(async (id: string) => {
    if (!documentId) {
      throw new AppError('Missing document ID', 'INVALID_PARAMS');
    }

    try {
      await handleApiError(
        async () => {
          const { error } = await supabase
            .from('signing_elements')
            .delete()
            .eq('id', id)
            .eq('document_id', documentId);

          if (error) throw error;
        },
        'removeSigningElement'
      );

      setSigningElements(prev => prev.filter(el => el.id !== id));
      toast.success('Field removed successfully');
    } catch (err) {
      handleError(err, 'removeSigningElement');
    }
  }, [documentId]);

  const handleSelectElement = useCallback((elementId: string) => {
    const element = signingElements.find(el => el.id === elementId);
    if (element) {
      setSelectedRecipientId(element.recipient_id);
      setActiveElementType(element.type);
    }
  }, [signingElements]);

  // Add a new function to set the active element type
  const setActiveElementTypeHandler = useCallback((type: SigningElement['type'] | null) => {
    setActiveElementType(type);
  }, []);

  return {
    document,
    recipients,
    signingElements,
    activeElementType,
    selectedRecipientId,
    isLoading,
    error,
    isRecipientModalOpen,
    isEmailModalOpen,
    addSigningElement,
    removeSigningElement,
    handleSelectElement,
    setIsRecipientModalOpen,
    setIsEmailModalOpen,
    setActiveElementType: setActiveElementTypeHandler,
  };
}
