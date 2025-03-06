
import React, { useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '@/components/AppLayout';
import DocumentUploader from '@/components/DocumentUploader';
import DocumentViewer from '@/components/DocumentViewer';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import RecipientModal from '@/components/RecipientModal';
import SignaturePad from '@/components/SignaturePad';
import EmailForm from '@/components/EmailForm';
import { Document, SigningElement, SignatureData, Recipient } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Mail, Pen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Editor = () => {
  const [document, setDocument] = useState<Document | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [editorView, setEditorView] = useState<'upload' | 'editor'>('upload');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  
  // Reset recipient selection when changing documents
  useEffect(() => {
    if (!document) {
      setRecipients([]);
      setSelectedRecipientId(null);
    }
  }, [document]);

  const handleDocumentSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    setDocument({
      id: uuidv4(),
      name: file.name,
      file,
      url,
      dateCreated: new Date(),
      status: 'draft',
    });
    setEditorView('editor');
  };

  const handleDocumentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!activeElementType || !document) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // If no recipient is selected when trying to place an element, show the recipient modal
      if (!selectedRecipientId) {
        setIsRecipientModalOpen(true);
        // Store click coordinates to use after recipient is added
        return;
      }

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

      const newElement: SigningElement = {
        id: uuidv4(),
        type: activeElementType,
        position: {
          x,
          y,
          pageIndex: 0, // This should be the current page number - 1
        },
        size: {
          width,
          height,
        },
        value: activeElementType === 'checkbox' ? false : '',
        required: true,
        assignedTo: selectedRecipientId,
      };

      setSigningElements([...signingElements, newElement]);
      toast.success(`${activeElementType} field added`);

      // If signature is being added for the current user, maybe open signature modal
      if (activeElementType === 'signature') {
        // Could check if this is the current user's signature
      }
    },
    [activeElementType, document, signingElements, selectedRecipientId]
  );

  const handleSelectElement = (type: SigningElement['type']) => {
    setActiveElementType(type);
    toast(`Click on the document to place the ${type} field`);
  };

  const handleRemoveElement = (id: string) => {
    setSigningElements(signingElements.filter((element) => element.id !== id));
  };

  const handleAddRecipient = () => {
    setIsRecipientModalOpen(true);
  };

  const handleSaveRecipient = (recipientData: Omit<Recipient, 'id' | 'status'>) => {
    const newRecipient: Recipient = {
      ...recipientData,
      id: uuidv4(),
      status: 'pending',
    };
    
    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    
    // Auto-select the newly added recipient
    setSelectedRecipientId(newRecipient.id);
    
    toast.success(`Recipient ${recipientData.name} added`);
  };

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = (signatureData: SignatureData) => {
    setSignature(signatureData);
    
    // Find all signature elements assigned to the current user and update them
    const updatedElements = signingElements.map(element => {
      if (element.type === 'signature') {
        return {
          ...element,
          value: signatureData.dataUrl
        };
      }
      return element;
    });
    
    setSigningElements(updatedElements);
    toast.success('Signature saved');
  };

  const handleSendDocument = (emailRecipients: Recipient[], message: string) => {
    // In a real application, you would send this data to your backend
    console.log('Sending document to:', emailRecipients);
    console.log('Message:', message);
    console.log('Document:', document);
    console.log('Signing elements:', signingElements);
    
    toast.success('Document sent for signing');
    
    // Reset for a new document
    setEditorView('upload');
    setDocument(null);
    setSigningElements([]);
    setSignature(null);
    setRecipients([]);
    setSelectedRecipientId(null);
  };

  const renderContent = () => {
    if (editorView === 'upload') {
      return <DocumentUploader onDocumentSelected={handleDocumentSelected} />;
    }

    if (document) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setEditorView('upload')}
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
              
              <div onClick={handleDocumentClick}>
                <DocumentViewer documentUrl={document.url}>
                  {signingElements.map((element) => (
                    <div
                      key={element.id}
                      className="signing-element"
                      style={{
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.size.width}px`,
                        height: `${element.size.height}px`,
                      }}
                    >
                      <div className="flex items-center justify-between px-2 py-1 bg-primary/10 border-b border-primary/20">
                        <span className="text-xs font-medium">{element.type}</span>
                      </div>
                      <div className="h-full flex items-center justify-center border-b border-dashed border-gray-300">
                        {element.type === 'signature' && element.value ? (
                          <img 
                            src={element.value as string} 
                            alt="Signature" 
                            className="max-h-full max-w-full p-1" 
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">{element.type}</span>
                        )}
                      </div>
                      <button
                        className="signing-element-handle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveElement(element.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </DocumentViewer>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-4 shadow-sm space-y-6">
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
              </div>
              
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <SigningFieldList 
                  signingElements={signingElements}
                  recipients={recipients}
                  onRemoveElement={handleRemoveElement}
                />
              </div>

              {activeElementType === 'signature' && (
                <Button 
                  variant="outline" 
                  onClick={handleOpenSignatureModal}
                  className="w-full gap-2"
                >
                  <Pen className="h-4 w-4" />
                  Create Your Signature
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
      
      <SignaturePad
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
      />
      
      <RecipientModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
        onSave={handleSaveRecipient}
      />
      
      <EmailForm
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleSendDocument}
      />
    </AppLayout>
  );
};

export default Editor;
