import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, Recipient } from '@/utils/types';
import { SigningElement, SignatureData } from '@/components/editor/EditorTypes';
import { supabase, getDocumentUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { sendDocumentForSignature } from '@/lib/emailService';

export const useEditorState = (documentId: string | undefined, currentUserId: string | undefined) => {
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectedSignatureFieldId, setSelectedSignatureFieldId] = useState<string | null>(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  useEffect(() => {
    if (!documentId) {
      toast.error('No document selected');
      navigate('/upload');
      return;
    }
  }, [documentId, navigate]);

  useEffect(() => {
    if (!documentId || !currentUserId) {
      return;
    }

    const loadDocument = async () => {
      try {
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('created_by', currentUserId)
          .single();

        if (documentError || !documentData) {
          throw new Error('Document not found');
        }

        const url = await getDocumentUrl(documentData.storage_path);
        if (!url) {
          throw new Error('Document URL not found');
        }

        setDocument(documentData);
        setDocumentUrl(url);

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

        const { data: recipientsData, error: recipientsError } = await supabase
          .from('recipients')
          .select('*')
          .eq('document_id', documentId);

        if (recipientsError) {
          throw recipientsError;
        }

        if (recipientsData) {
          setRecipients(recipientsData.map(recipient => ({
            id: recipient.id,
            name: recipient.name || '',
            email: recipient.email,
            status: recipient.status,
          })));
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast.error('Failed to load document');
        navigate('/documents');
      }
    };

    loadDocument();
  }, [documentId, navigate, currentUserId]);

  useEffect(() => {
    if (!document) {
      setRecipients([]);
      setSelectedRecipientId(null);
    }
  }, [document]);

  const handleDragStart = useCallback((e: React.DragEvent, element: SigningElement) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', element.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedElement = signingElements.find(el => el.id === draggedId);
    if (!draggedElement || !dragOffset) return;

    const canvas = e.currentTarget.querySelector('.pdf-page canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;
    
    const boundedX = Math.max(0, Math.min(x, canvasRect.width - draggedElement.size.width));
    const boundedY = Math.max(0, Math.min(y, canvasRect.height - draggedElement.size.height));
    
    const updatedElements = signingElements.map(el => 
      el.id === draggedId 
        ? { 
            ...el, 
            position: { 
              ...el.position, 
              x: boundedX, 
              y: boundedY 
            } 
          }
        : el
    );
    
    setSigningElements(updatedElements);
    setDragOffset(null);

    supabase
      .from('signing_elements')
      .update({
        position: { x: boundedX, y: boundedY, pageIndex: 0 }
      })
      .eq('id', draggedId)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating element position:', error);
          toast.error('Failed to save element position');
        }
      });
  }, [signingElements, dragOffset]);

  const handleDocumentClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!activeElementType || !document) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const canvas = e.currentTarget.querySelector('.pdf-page canvas');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      let width = 150;
      let height = 50;

      if (activeElementType === 'signature') {
        width = 200;
        height = 80;
      } else if (activeElementType === 'checkbox') {
        width = 50;
        height = 50;
      } else if (activeElementType === 'date') {
        width = 150;
        height = 40;
      }

      const x = e.clientX - canvasRect.left - (width / 2);
      const y = e.clientY - canvasRect.top - (height / 2);

      if (!selectedRecipientId) {
        setIsRecipientModalOpen(true);
        return;
      }

      const elementId = uuidv4();
      const newElement: SigningElement = {
        id: elementId,
        type: activeElementType,
        position: {
          x,
          y,
          pageIndex: 0,
        },
        size: {
          width,
          height,
        },
        value: activeElementType === 'checkbox' ? false : '',
        required: true,
        assignedTo: selectedRecipientId,
      };

      const { error } = await supabase
        .from('signing_elements')
        .insert({
          id: elementId,
          document_id: document.id,
          recipient_id: selectedRecipientId,
          type: activeElementType,
          position: newElement.position,
          size: newElement.size,
          value: newElement.value,
        });

      if (error) {
        console.error('Error adding signing element:', error);
        toast.error('Failed to add signing element');
        return;
      }

      setSigningElements([...signingElements, newElement]);
      toast.success(`${activeElementType} field added`);
      setActiveElementType(null);
    },
    [activeElementType, document, signingElements, selectedRecipientId]
  );

  const handleSelectElement = (type: SigningElement['type']) => {
    setActiveElementType(type);
    toast(`Click on the document to place the ${type} field`);
  };

  const handleRemoveElement = async (id: string) => {
    const { error } = await supabase
      .from('signing_elements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing signing element:', error);
      toast.error('Failed to remove signing element');
      return;
    }

    setSigningElements(signingElements.filter((element) => element.id !== id));
  };

  const handleAddRecipient = () => {
    setIsRecipientModalOpen(true);
  };

  const handleSaveRecipient = async (recipientData: Omit<Recipient, 'id' | 'status'>) => {
    if (!document) return;

    const recipientId = uuidv4();
    const newRecipient: Recipient = {
      ...recipientData,
      id: recipientId,
      status: 'pending',
    };

    const { error } = await supabase
      .from('recipients')
      .insert({
        id: recipientId,
        document_id: document.id,
        email: recipientData.email,
        name: recipientData.name,
        status: 'pending',
      });

    if (error) {
      console.error('Error adding recipient:', error);
      toast.error('Failed to add recipient');
      return;
    }
    
    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    
    setSelectedRecipientId(newRecipient.id);
    
    toast.success(`Recipient ${recipientData.name} added`);
  };

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = async (signatureData: SignatureData) => {
    setSignature(signatureData);
    
    const updatedElements = signingElements.map(element => {
      if (element.type === 'signature') {
        return {
          ...element,
          value: signatureData.dataUrl
        };
      }
      return element;
    });
    
    for (const element of updatedElements) {
      if (element.type === 'signature') {
        const { error } = await supabase
          .from('signing_elements')
          .update({ value: element.value })
          .eq('id', element.id);

        if (error) {
          console.error('Error updating signature:', error);
          toast.error('Failed to save signature');
          return;
        }
      }
    }
    
    setSigningElements(updatedElements);
    toast.success('Signature saved');
  };

  const handleSendDocument = async (emailRecipients: Recipient[], message: string) => {
    if (!document) return;

    try {
      // First update existing recipients or create new ones
      for (const recipient of emailRecipients) {
        if (recipients.find(r => r.id === recipient.id)) {
          // Update existing recipient
          const { error: recipientError } = await supabase
            .from('recipients')
            .update({
              name: recipient.name,
              email: recipient.email,
              status: 'pending'
            })
            .eq('id', recipient.id);

          if (recipientError) throw recipientError;
        } else {
          // Create new recipient
          const { error: recipientError } = await supabase
            .from('recipients')
            .insert({
              id: recipient.id,
              document_id: document.id,
              name: recipient.name,
              email: recipient.email,
              status: 'pending'
            });

          if (recipientError) throw recipientError;
        }
      }

      // Send document using email service
      await sendDocumentForSignature(document.id, emailRecipients, message);
      toast.success('Document sent for signing');
      navigate('/documents');
    } catch (error) {
      console.error('Error sending document:', error);
      toast.error('Failed to send document');
      setIsEmailModalOpen(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSignatureFieldClick = (fieldId: string) => {
    setSelectedSignatureFieldId(fieldId);
    setIsSignatureDialogOpen(true);
  };

  const handleSignatureSelected = async (signatureId: string) => {
    if (!selectedSignatureFieldId) return;

    try {
      const { error } = await supabase
        .from('signature_fields')
        .update({
          signature_id: signatureId,
          signed_at: new Date().toISOString(),
        })
        .eq('id', selectedSignatureFieldId);

      if (error) throw error;

      const { data: signatureData, error: signatureError } = await supabase
        .from('signatures')
        .select('value')
        .eq('id', signatureId)
        .single();

      if (signatureError) throw signatureError;

      setSigningElements(elements => 
        elements.map(el => 
          el.id === selectedSignatureFieldId
            ? { ...el, value: signatureData.value }
            : el
        )
      );

      toast.success('Signature added successfully');
    } catch (error) {
      console.error('Error adding signature:', error);
      toast.error('Failed to add signature');
    }

    setSelectedSignatureFieldId(null);
    setIsSignatureDialogOpen(false);
  };

  return {
    document,
    documentUrl,
    signingElements,
    signature,
    activeElementType,
    recipients,
    selectedRecipientId,
    isRecipientModalOpen,
    isSignatureModalOpen,
    isEmailModalOpen,
    isSignatureDialogOpen,
    selectedSignatureFieldId,
    handleDragStart,
    handleDrop,
    handleDocumentClick,
    handleSelectElement,
    handleRemoveElement,
    handleAddRecipient,
    handleSaveRecipient,
    handleSelectRecipient,
    handleOpenSignatureModal,
    handleSaveSignature,
    handleSendDocument,
    handleDragOver,
    handleSignatureFieldClick,
    handleSignatureSelected,
    setIsRecipientModalOpen,
    setIsSignatureModalOpen,
    setIsEmailModalOpen,
    setIsSignatureDialogOpen,
    setSelectedSignatureFieldId,
  };
};
