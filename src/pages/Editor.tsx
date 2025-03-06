import React, { useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '@/components/AppLayout';
import DocumentViewer from '@/components/DocumentViewer';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import RecipientModal from '@/components/RecipientModal';
import SignaturePad from '@/components/SignaturePad';
import EmailForm from '@/components/EmailForm';
import { Document, SigningElement, SignatureData, Recipient } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Mail, Pen, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  
  // Load document from localStorage when component mounts
  useEffect(() => {
    const documentsString = localStorage.getItem('documents');
    if (documentsString) {
      const documents = JSON.parse(documentsString);
      const documentId = location.state?.documentId;
      const currentDocument = documents.find((doc: Document) => doc.id === documentId);
      if (currentDocument) {
        setDocument(currentDocument);
      } else {
        toast.error('Document not found');
        navigate('/upload');
      }
    } else {
      toast.error('No documents found');
      navigate('/upload');
    }
  }, [location.state?.documentId, navigate]);

  // Reset recipient selection when changing documents
  useEffect(() => {
    if (!document) {
      setRecipients([]);
      setSelectedRecipientId(null);
    }
  }, [document]);

  const handleDragStart = useCallback((e: React.DragEvent, element: SigningElement) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', element.id);
    
    // Calculate offset between mouse and element position
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

    const rect = e.currentTarget.getBoundingClientRect();
    // Place exactly where dropped, accounting for the initial offset
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    setSigningElements(prevElements => 
      prevElements.map(el => 
        el.id === draggedId 
          ? { ...el, position: { ...el.position, x, y } }
          : el
      )
    );
    setDragOffset(null);
  }, [signingElements, dragOffset]);

  const handleDocumentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!activeElementType || !document) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const canvas = e.currentTarget.querySelector('.pdf-page canvas');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      // Center the element on the mouse cursor by subtracting half the element's dimensions
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

      // Calculate position relative to the canvas
      const x = e.clientX - canvasRect.left - (width / 2);
      const y = e.clientY - canvasRect.top - (height / 2);

      // If no recipient is selected when trying to place an element, show the recipient modal
      if (!selectedRecipientId) {
        setIsRecipientModalOpen(true);
        return;
      }

      const newElement: SigningElement = {
        id: uuidv4(),
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

      setSigningElements([...signingElements, newElement]);
      toast.success(`${activeElementType} field added`);
      // Deselect the field type after placement
      setActiveElementType(null);
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
    
    // Navigate back to upload page
    navigate('/upload');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!document) {
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
              onClick={() => navigate('/upload')}
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
              <DocumentViewer documentUrl={document.url}>
                {signingElements.map((element) => {
                  const recipient = recipients.find(r => r.id === element.assignedTo);
                  // Use specific colors for first three recipients, then generate colors for others
                  const recipientColor = recipient ? 
                    (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : // blue
                     recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : // green
                     recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : // red
                     `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';
                  
                  return (
                    <div
                      key={element.id}
                      className="signing-element"
                      style={{
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.size.width}px`,
                        height: `${element.size.height}px`,
                        borderColor: recipientColor,
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, element)}
                    >
                      <div 
                        className="flex items-center justify-between px-2 py-1 border-b"
                        style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
                      >
                        <span className="text-xs font-medium">{element.type}</span>
                        <span className="text-xs text-muted-foreground">{recipient?.name || 'Unassigned'}</span>
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
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
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

      <SignaturePad
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
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
