import React, { useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '@/components/AppLayout';
import DocumentViewer from '@/components/DocumentViewer';
import SigningElementsToolbar from '@/components/SigningElementsToolbar';
import SigningFieldList from '@/components/SigningFieldList';
import RecipientSelector from '@/components/RecipientSelector';
import RecipientModal from '@/components/RecipientModal';
import EmailForm from '@/components/EmailForm';
import { Document, Recipient } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Mail, Pen, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase, getDocumentUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SignatureDialog } from '@/components/SignatureDialog';
import { SignatureField } from '@/components/SignatureField';
import { cn } from '@/lib/utils';

interface SigningElement {
  id: string;
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'name' | 'email' | 'address' | 'title';
  position: {
    x: number;
    y: number;
    pageIndex: number;
  };
  size: {
    width: number;
    height: number;
  };
  value: string | boolean | null;
  required: boolean;
  assignedTo: string | null;
  label?: string;
}

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signingElements, setSigningElements] = useState<SigningElement[]>([]);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [selectedSignatureFieldId, setSelectedSignatureFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      toast.error('No document selected');
      navigate('/upload');
      return;
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !currentUser) {
      return;
    }

    const loadDocument = async () => {
      try {
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .eq('created_by', currentUser.id)
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
          .eq('document_id', id);

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
          .eq('document_id', id);

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
  }, [id, navigate, currentUser]);

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
      const { error: documentError } = await supabase
        .from('documents')
        .update({ status: 'sent' })
        .eq('id', document.id);

      if (documentError) {
        throw documentError;
      }

      for (const recipient of emailRecipients) {
        const { error: recipientError } = await supabase
          .from('recipients')
          .update({ status: 'pending' })
          .eq('id', recipient.id);

        if (recipientError) {
          throw recipientError;
        }
      }
      
      toast.success('Document sent for signing');
      navigate('/documents');
    } catch (error) {
      console.error('Error sending document:', error);
      toast.error('Failed to send document');
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
                {signingElements.map((element) => {
                  const recipient = recipients.find(r => r.id === element.assignedTo);
                  const recipientColor = recipient ? 
                    (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : 
                     recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : 
                     recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : 
                     `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';
                  
                  return (
                    <div
                      key={element.id}
                      className="signing-element absolute"
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
                      <div 
                        className="h-full flex items-center justify-center border-b border-dashed border-gray-300"
                        onClick={() => element.type === 'signature' && handleSignatureFieldClick(element.id)}
                      >
                        {element.type === 'signature' ? (
                          element.value ? (
                            <img 
                              src={element.value as string} 
                              alt="Signature" 
                              className="max-h-[calc(100%-10px)] max-w-[calc(100%-10px)] object-contain" 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Pen className="w-6 h-6 mb-1" />
                              <span className="text-sm">Click to sign</span>
                            </div>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">{element.type}</span>
                        )}
                      </div>
                      <button
                        className="signing-element-handle absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100"
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
