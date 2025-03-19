import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditorState } from '@/hooks/useEditorState';
import { Button } from '@/components/ui/button';
import { SendEmailModal } from '@/components/SendEmailModal';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { SigningPDFViewer } from '@/components/pdf/SigningPDFViewer';
import { PDFErrorBoundary } from '@/components/pdf/PDFErrorBoundary';
import { AddRecipientModal } from '@/components/recipient/AddRecipientModal';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import { Loader2 } from 'lucide-react';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import { SigningElement } from '@/utils/types';
import { cn } from '@/lib/utils';

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
  } = useEditorState(params.id);

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
                  onAddElement={addSigningElement}
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
        onClose={() => setIsRecipientModalOpen(false)}
        documentId={params.id}
        onAddRecipient={() => setIsRecipientModalOpen(false)}
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