
import React, { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '@/components/Layout';
import DocumentUploader from '@/components/DocumentUploader';
import DocumentViewer from '@/components/DocumentViewer';
import { SigningElementsToolbar, DraggableSigningElement } from '@/components/SigningElements';
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
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [activeElementType, setActiveElementType] = useState<SigningElement['type'] | null>(null);
  const [editorView, setEditorView] = useState<'upload' | 'editor'>('upload');

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

      let width = 150;
      let height = 50;

      if (activeElementType === 'signature') {
        width = 200;
        height = 80;
      } else if (activeElementType === 'checkbox') {
        width = 50;
        height = 50;
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
      };

      setSigningElements([...signingElements, newElement]);
      setActiveElementType(null);
      toast.success(`${activeElementType} element added`);
    },
    [activeElementType, document, signingElements]
  );

  const handleAddElement = (type: SigningElement['type']) => {
    setActiveElementType(type);
    toast(`Click on the document to place the ${type} element`);
  };

  const handleRemoveElement = (id: string) => {
    setSigningElements(signingElements.filter((element) => element.id !== id));
  };

  const handleUpdateElement = (id: string, updates: Partial<SigningElement>) => {
    setSigningElements(
      signingElements.map((element) =>
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = (signatureData: SignatureData) => {
    setSignature(signatureData);
    
    // Find all signature elements and update them with the signature data
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

  const handleSendDocument = (recipients: Recipient[], message: string) => {
    console.log('Sending document to:', recipients);
    console.log('Message:', message);
    console.log('Document:', document);
    console.log('Signing elements:', signingElements);
    
    // In a real application, you would send this data to your backend
    
    // Reset for a new document
    setEditorView('upload');
    setDocument(null);
    setSigningElements([]);
    setSignature(null);
  };

  const renderContent = () => {
    if (editorView === 'upload') {
      return <DocumentUploader onDocumentSelected={handleDocumentSelected} />;
    }

    if (document) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setEditorView('upload')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleOpenSignatureModal}
                className="gap-2"
              >
                <Pen className="h-4 w-4" />
                Create Signature
              </Button>
              <Button 
                onClick={() => setIsEmailModalOpen(true)}
                className="gap-2"
                disabled={!signature}
              >
                <Mail className="h-4 w-4" />
                Send for Signature
              </Button>
            </div>
          </div>
          
          <SigningElementsToolbar onAddElement={handleAddElement} />
          
          <div onClick={handleDocumentClick}>
            <DocumentViewer documentUrl={document.url}>
              {signingElements.map((element) => (
                <DraggableSigningElement
                  key={element.id}
                  element={element}
                  onRemove={handleRemoveElement}
                  onUpdate={handleUpdateElement}
                />
              ))}
            </DocumentViewer>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Document Editor</h1>
        {renderContent()}
      </div>
      
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
    </Layout>
  );
};

export default Editor;
