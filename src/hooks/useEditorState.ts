import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Document, Recipient, SigningElement } from '@/utils/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'documents';

export function useEditorState(documentId: string | undefined, userId: string | undefined) {
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);
  const lastLoadedDocumentId = useRef<string | undefined>(undefined);

  const loadDocument = useCallback(async (force = false) => {
    if (!documentId || !userId) {
      console.log('Missing required params:', { documentId, userId });
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
    console.log('Starting document load:', { documentId, userId, force });

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
        .eq('created_by', userId)
        .single();

      if (documentError) {
        console.error('Error fetching document:', documentError);
        throw new Error(`Document not found: ${documentError.message}`);
      }

      if (!documentData) {
        console.error('No document data returned');
        throw new Error('Document not found: No data returned');
      }

      // Log document data for debugging
      console.log('Document data:', {
        id: documentData.id,
        name: documentData.name,
        storage_path: documentData.storage_path,
        status: documentData.status
      });

      // Get document URL
      if (!documentData.storage_path) {
        console.error('Storage path missing:', {
          document_id: documentId,
          name: documentData.name
        });
        throw new Error('Document storage path is missing');
      }

      console.log('Attempting to get signed URL for path:', documentData.storage_path);

      // First check if the file exists in storage
      const { data: fileExists, error: fileExistsError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(documentData.storage_path.split('/').slice(0, -1).join('/'));

      if (fileExistsError) {
        console.error('Error checking file existence:', fileExistsError);
        throw new Error(`Failed to check file existence: ${fileExistsError.message}`);
      }

      const fileName = documentData.storage_path.split('/').pop();
      const fileExistsInStorage = fileExists?.some(file => file.name === fileName);

      if (!fileExistsInStorage) {
        console.error('File not found in storage:', {
          storage_path: documentData.storage_path,
          available_files: fileExists?.map(f => f.name)
        });
        throw new Error('Document file not found in storage');
      }

      console.log('File exists in storage:', {
        storage_path: documentData.storage_path,
        fileName
      });
      
      const { data: signUrl, error: signUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(documentData.storage_path, 3600);

      if (signUrlError) {
        console.error('Error generating signed URL:', {
          error: signUrlError,
          storage_path: documentData.storage_path,
          bucket: STORAGE_BUCKET
        });
        throw new Error(`Failed to generate signed URL: ${signUrlError.message}`);
      }

      if (!signUrl?.signedUrl) {
        console.error('No signed URL in response:', {
          signUrl,
          storage_path: documentData.storage_path
        });
        throw new Error('Could not generate document URL: No signed URL in response');
      }

      console.log('Successfully generated signed URL:', {
        signedUrl: signUrl.signedUrl,
        expiresIn: '24 hours',
        storage_path: documentData.storage_path
      });

      const newDocument = { ...documentData, url: signUrl.signedUrl };
      setDocument(newDocument);
      setRecipients(documentData.recipients || []);

      const { data: elementsData, error: elementsError } = await supabase
        .from('signing_elements')
        .select('*')
        .eq('document_id', documentId);

      if (elementsError) {
        console.error('Error fetching signing elements:', elementsError);
        throw elementsError;
      }

      console.log('Signing elements result:', {
        count: elementsData?.length || 0,
        elementsData,
        elementsError
      });

      if (elementsData) {
        const newElements = elementsData.map(element => {
          const recipient = documentData.recipients.find(r => r.id === element.recipient_id);
          return {
            id: element.id,
            type: element.type as SigningElement['type'],
            position: element.position,
            size: element.size,
            value: element.value,
            required: true,
            assignedTo: recipient?.name || 'Unknown',
          };
        });
        setSigningElements(newElements);
      }

      initialLoadRef.current = true;
      lastLoadedDocumentId.current = documentId;
    } catch (error) {
      console.error('Detailed error loading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load document');
      navigate('/documents');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [documentId, userId, navigate]);

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
    if (!documentId) return;

    // Get the selected recipient's name or use the last added recipient
    const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
    const lastRecipient = recipients[recipients.length - 1];
    const recipientToUse = selectedRecipient || lastRecipient;

    if (!recipientToUse) {
      console.error('No recipient available');
      return;
    }

    // Set the last added recipient as selected
    if (!selectedRecipientId) {
      setSelectedRecipientId(recipientToUse.id);
    }

    const newElement: SigningElement = {
      id: uuidv4(),
      type,
      position: {
        x: position.x - (type === 'signature' ? 150 : 100) / 2, // Center horizontally
        y: position.y - (type === 'signature' ? 50 : 30) / 2,   // Center vertically
        pageIndex: position.pageIndex,
      },
      size: {
        width: type === 'signature' ? 150 : 100,
        height: type === 'signature' ? 50 : 30,
      },
      value: type === 'checkbox' ? false : null,
      required: true,
      assignedTo: recipientToUse.name, // Use name for display
    };

    try {
      const { error } = await supabase
        .from('signing_elements')
        .insert([{
          id: newElement.id,
          document_id: documentId,
          recipient_id: recipientToUse.id, // Use ID for database
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
  }, [documentId, recipients, selectedRecipientId, setSelectedRecipientId]);

  const updateSigningElement = useCallback(async (id: string, updates: Partial<SigningElement>) => {
    if (!documentId) return;

    try {
      // Remove UI-specific fields that don't exist in the database
      const { required, assignedTo, ...dbUpdates } = updates;

      const { error } = await supabase
        .from('signing_elements')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('document_id', documentId);

      if (error) throw error;

      setSigningElements(prev =>
        prev.map(el => (el.id === id ? { ...el, ...updates } : el))
      );
    } catch (error) {
      console.error('Error updating signing element:', error);
      toast.error('Failed to update field');
    }
  }, [documentId]);

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
    if (!element) return;

    // Handle signature field click
    if (element.type === 'signature') {
      // TODO: Open signature dialog
      console.log('Signature field clicked:', elementId);
    }
  }, [signingElements]);

  return {
    document,
    recipients,
    signingElements,
    selectedRecipientId,
    handleSelectElement,
    addSigningElement,
    updateSigningElement,
    removeSigningElement,
    setSelectedRecipientId,
    setRecipients,
    isLoading,
  };
}
