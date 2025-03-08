
import React from 'react';
import AppLayout from '@/components/AppLayout';
import DocumentViewer from '@/components/DocumentViewer';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import RecipientModal from '@/components/RecipientModal';
import EmailForm from '@/components/EmailForm';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SignatureDialog } from '@/components/SignatureDialog';
import DocumentElements from '@/components/editor/DocumentElements';
import { useEditorState } from '@/hooks/useEditorState';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const {
    document,
    documentUrl,
    signingElements,
    recipients,
    selectedRecipientId,
    activeElementType,
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
  } = useEditorState(id, currentUser?.id);

  if (!document || !documentUrl) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/documents')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setIsEmailModalOpen(true)}
              className="gap-2"
              disabled={signingElements.length === 0 || recipients.length === 0}
            >
              <Mail className="h-4 w-4" />
              Send for Signature
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Document Preview</h2>
              <p className="text-sm text-muted-foreground">Add fields and send for signing</p>
            </div>
            
            <div 
              onClick={handleDocumentClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative"
            >
              <DocumentViewer documentUrl={documentUrl}>
                <DocumentElements
                  signingElements={signingElements}
                  recipients={recipients}
                  handleDragStart={handleDragStart}
                  handleRemoveElement={handleRemoveElement}
                  handleSignatureFieldClick={handleSignatureFieldClick}
                />
              </DocumentViewer>
            </div>
          </div>

          <div className="space-y-6">
            <RecipientSelector
              recipients={recipients}
              selectedRecipientId={selectedRecipientId}
              onSelectRecipient={handleSelectRecipient}
              onAddRecipient={handleAddRecipient}
            />
            <SigningElementsToolbar 
              activeElementType={activeElementType}
              onSelectElement={handleSelectElement} 
            />
            <SigningFieldList
              signingElements={signingElements}
              recipients={recipients}
              onRemoveElement={handleRemoveElement}
            />
          </div>
        </div>
      </div>

      <RecipientModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
        onSave={handleSaveRecipient}
      />

      <SignatureDialog
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureSelected={handleSignatureSelected}
        documentId={document.id}
      />

      <EmailForm
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleSendDocument}
      />

      <SignatureDialog
        isOpen={isSignatureDialogOpen}
        onClose={() => {
          setIsSignatureDialogOpen(false);
          setSelectedSignatureFieldId(null);
        }}
        onSignatureSelected={handleSignatureSelected}
        documentId={document.id}
      />
    </AppLayout>
  );
};

export default Editor;
