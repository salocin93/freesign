import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditorState } from '@/hooks/useEditorState';
import { Button } from '@/components/ui/button';
import { SendEmailModal } from '@/components/SendEmailModal';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { SigningPDFViewer } from '@/components/pdf/SigningPDFViewer';
import { PDFErrorBoundary } from '@/components/pdf/PDFErrorBoundary';
import { AddRecipientModal } from '@/components/recipient/AddRecipientModal';
import { Recipient, SigningElement } from '@/utils/types';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import { Loader2 } from 'lucide-react';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import { cn } from '@/lib/utils';
import { createSigningElement } from '@/lib/supabase';
import { handleApiError, handleError } from '@/utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export default function Editor() {
  const params = useParams();
  const { currentUser } = useAuth();
  const {
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
    handleSelectRecipient,
    setIsRecipientModalOpen,
    setIsEmailModalOpen,
    isRecipientModalOpen,
    isEmailModalOpen,
    setActiveElementType,
    setSigningElements,
  } = useEditorState(params.id);

  // Pending field state
  const pendingField = useRef<{
    type: SigningElement['type'];
    position: { x: number; y: number; pageIndex: number };
  } | null>(null);

  // Custom handler for PDFViewer
  const handleAddElement = (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => {
    if (!selectedRecipientId) {
      pendingField.current = { type, position };
      setIsRecipientModalOpen(true);
      return;
    }
    // Direct user click - clear the active element type after placement
    addSigningElement(type, position, true);
  };

  // Custom onAddRecipient handler
  const handleAddRecipient = (recipient: Recipient) => {
    setIsRecipientModalOpen(false);
    handleSelectRecipient(recipient.id);
    
    // If there is a pending field, create and place the element immediately 
    // using the stored click position and the new recipient ID
    if (pendingField.current) {
      const pendingType = pendingField.current.type;
      const pendingPosition = pendingField.current.position;
      
      
      // Create the element directly without waiting for state updates
      const newElement: SigningElement = {
        id: uuidv4(),
        document_id: params.id!,
        recipient_id: recipient.id, // Use the new recipient directly
        type: pendingType,
        position: pendingPosition, // Use the stored click position
        size: { width: 200, height: 100 },
        value: null,
      };

      // Create element immediately
      const createElementImmediately = async () => {
        try {
          await handleApiError(
            async () => {
              return await createSigningElement({
                id: newElement.id,
                document_id: params.id!,
                recipient_id: recipient.id,
                type: newElement.type,
                position: newElement.position,
                size: newElement.size,
                value: newElement.value,
              });
            },
            'addSigningElement'
          );

          // Update the local state immediately
          setSigningElements(prev => [...prev, newElement]);
          toast.success('Signing element added successfully');
          setActiveElementType(null);
          
        } catch (err) {
          console.error('Failed to create element:', err);
          handleError(err, 'addSigningElement');
        }
      };

      createElementImmediately();
      pendingField.current = null;
    }
  };

  // Place pending field after recipient selection (only if not handled by modal)
  useEffect(() => {
    if (pendingField.current && selectedRecipientId) {
      // Only place if modal is not open (means recipient was selected via other means)
      if (!isRecipientModalOpen) {
        addSigningElement(pendingField.current.type, pendingField.current.position, true);
        pendingField.current = null;
      }
    }
  }, [selectedRecipientId, isRecipientModalOpen, addSigningElement]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{document.name}</h1>
          <p className="text-gray-600">
            {document.status === 'completed' 
              ? 'Document has been signed by all recipients'
              : 'Add recipients and signature fields'}
          </p>
        </div>
        {document.status !== 'completed' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRecipientModalOpen(true)}
            >
              Add Recipient
            </Button>
            <Button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={!recipients.length}
            >
              Send for Signature
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <PDFErrorBoundary>
            {document.url ? (
              document.status === 'completed' ? (
                <SigningPDFViewer
                  url={document.url}
                  signingElements={signingElements}
                  recipients={recipients}
                  isCompleted={true}
                />
              ) : (
                <PDFViewer
                  url={document.url}
                  signingElements={signingElements}
                  recipients={recipients}
                  onElementClick={handleSelectElement}
                  onAddElement={handleAddElement}
                  activeElementType={activeElementType}
                  onRemoveElement={removeSigningElement}
                  selectedRecipientId={selectedRecipientId}
                  onOpenAddRecipient={() => setIsRecipientModalOpen(true)}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No document URL available</p>
              </div>
            )}
          </PDFErrorBoundary>
        </div>

        {document.status !== 'completed' && (
          <div className="col-span-3">
            <div className="space-y-6">
              <SigningElementsToolbar
                activeElementType={activeElementType}
                onSelectElement={setActiveElementType}
              />
              <RecipientSelector
                recipients={recipients}
                selectedRecipientId={selectedRecipientId}
                onSelectRecipient={handleSelectRecipient}
                onAddRecipient={() => setIsRecipientModalOpen(true)}
              />
              <SigningFieldList
                signingElements={signingElements}
                recipients={recipients}
                onRemoveElement={removeSigningElement}
              />
            </div>
          </div>
        )}
      </div>

      <AddRecipientModal
        isOpen={isRecipientModalOpen}
        onClose={() => {
          setIsRecipientModalOpen(false);
          // Clear pending field if user cancels the modal
          pendingField.current = null;
        }}
        documentId={params.id}
        onAddRecipient={handleAddRecipient}
        recipients={recipients}
        setSelectedRecipientId={handleSelectRecipient}
      />

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        documentId={params.id}
        recipients={recipients}
      />
    </div>
  );
} 