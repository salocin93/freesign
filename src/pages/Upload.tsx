
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DocumentUploader from '@/components/DocumentUploader';
import { v4 as uuidv4 } from 'uuid';

const Upload = () => {
  const navigate = useNavigate();

  const handleDocumentSelected = (file: File) => {
    // Create a document object
    const documentId = uuidv4();
    const url = URL.createObjectURL(file);
    
    // In a real app, you would upload this file to your backend
    const document = {
      id: documentId,
      name: file.name,
      file,
      url,
      dateCreated: new Date(),
      status: 'draft',
    };
    
    // Store document data in localStorage or state management
    const documentsString = localStorage.getItem('documents');
    const documents = documentsString ? JSON.parse(documentsString) : [];
    localStorage.setItem('documents', JSON.stringify([...documents, document]));
    
    // Navigate to the editor
    navigate('/editor', { state: { documentId } });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Upload Document</h1>
          <p className="text-muted-foreground">
            Upload a PDF document to prepare it for signing
          </p>
        </div>
        
        <DocumentUploader onDocumentSelected={handleDocumentSelected} />
      </div>
    </AppLayout>
  );
};

export default Upload;
