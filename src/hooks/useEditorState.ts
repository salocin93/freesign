import { useState, useCallback, useEffect, useRef } from 'react';
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
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);

  const loadDocument = useCallback(async (force = false) => {
    if (!documentId || !userId) {
      console.log('Missing required params:', { documentId, userId });
      setIsLoading(false);
      return;
    }

    // Prevent concurrent loads and unnecessary reloads
    if (loadingRef.current || (!force && initialLoadRef.current)) {
      console.log('Skipping load - already loading or already loaded:', 
        { loading: loadingRef.current, initialLoaded: initialLoadRef.current });
      return;
    }

    loadingRef.current = true;
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
        expiresIn: '1 hour',
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
        const newElements = elementsData.map(element => ({
          id: element.id,
          type: element.type as SigningElement['type'],
          position: element.position,
          size: element.size,
          value: element.value,
          required: true,
          assignedTo: element.recipient_id,
        }));
        setSigningElements(newElements);
      }

      initialLoadRef.current = true;
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
    loadDocument(true);
  }, [loadDocument]);

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
          // Only reload if there's an actual change in the data
          const newData = payload.new as Recipient;
          const oldData = payload.old as Recipient;
          if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
            console.log('Recipient change detected, forcing reload');
            loadDocument(true);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
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
