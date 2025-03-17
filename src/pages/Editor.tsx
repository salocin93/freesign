import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditorState } from '@/hooks/useEditorState';
import { Button } from '@/components/ui/button';
import { SendEmailModal } from '@/components/SendEmailModal';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PDFErrorBoundary } from '@/components/pdf/PDFErrorBoundary';
import { AddRecipientModal } from '@/components/recipient/AddRecipientModal';
import { Loader2 } from 'lucide-react';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import { SigningElement } from '@/utils/types';
import { cn } from '@/lib/utils';

export default function Editor() {
  const params = useParams();
  const documentId = params.id;
  const { currentUser } = useAuth();
  const { 
    document, 
    recipients, 
    signingElements, 
    handleSelectElement, 
    addSigningElement,
    updateSigningElement,
    removeSigningElement,
    setSelectedRecipientId,
    selectedRecipientId,
    isLoading,
    setRecipients
  } = useEditorState(documentId, currentUser?.id);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);

  // Add debugging for activeElementType changes
  useEffect(() => {
    console.log('Active element type changed:', activeElementType);
  }, [activeElementType]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Document not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{document.name}</h1>
          <p className="text-gray-600">Add recipients and signature fields</p>
        </div>
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
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <PDFErrorBoundary>
            {document.url ? (
              <PDFViewer
                url={document.url}
                signingElements={signingElements}
                onElementClick={handleSelectElement}
                onAddElement={addSigningElement}
                activeElementType={activeElementType}
                onRemoveElement={removeSigningElement}
                selectedRecipientId={selectedRecipientId}
                onOpenAddRecipient={() => setIsRecipientModalOpen(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No document URL available</p>
              </div>
            )}
          </PDFErrorBoundary>
        </div>
        <div className="col-span-3 space-y-6">
          <SigningElementsToolbar
            activeElementType={activeElementType}
            onSelectElement={setActiveElementType}
            variant="default"
            showTooltips={true}
          />
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Recipients</h2>
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className={cn(
                    "p-2 rounded-md cursor-pointer transition-colors",
                    selectedRecipientId === recipient.id 
                      ? "bg-primary/10 border border-primary" 
                      : "bg-gray-50 hover:bg-gray-100"
                  )}
                  onClick={() => setSelectedRecipientId(recipient.id)}
                >
                  <div className="font-medium">{recipient.name}</div>
                  <div className="text-sm text-gray-500">{recipient.email}</div>
                </div>
              ))}
              {!recipients.length && (
                <p className="text-sm text-gray-500">
                  No recipients added yet. Click "Add Recipient" to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        documentId={document.id}
      />

      {document && (
        <AddRecipientModal
          isOpen={isRecipientModalOpen}
          onClose={() => setIsRecipientModalOpen(false)}
          documentId={document.id}
          onAddRecipient={(recipient) => {
            setRecipients(prev => [...prev, recipient]);
            setSelectedRecipientId(recipient.id);
          }}
          recipients={recipients}
          setSelectedRecipientId={setSelectedRecipientId}
        />
      )}
    </div>
  );
} 