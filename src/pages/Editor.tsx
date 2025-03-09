import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditorState } from '@/hooks/useEditorState';
import { Button } from '@/components/ui/button';
import { SendEmailModal } from '@/components/SendEmailModal';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { AddRecipientModal } from '@/components/recipient/AddRecipientModal';
import { Loader2 } from 'lucide-react';

export default function Editor() {
  const params = useParams();
  const documentId = params.documentId;
  const { currentUser } = useAuth();
  const { document, recipients, signingElements, handleSelectElement, isLoading } = useEditorState(documentId, currentUser?.id);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

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
          <PDFViewer
            url={document.url || ''}
            signingElements={signingElements}
            onElementClick={handleSelectElement}
          />
        </div>
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Recipients</h2>
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="p-2 bg-gray-50 rounded-md"
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
        />
      )}
    </div>
  );
} 