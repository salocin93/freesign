import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DocumentUploader from '@/components/DocumentUploader';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase, uploadDocument } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const Upload = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleDocumentSelected = async (file: File) => {
    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a valid PDF document');
        return;
      }

      if (!currentUser) {
        toast.error('You must be logged in to upload documents');
        return;
      }

      // Create a unique ID and storage path
      const documentId = uuidv4();
      const storagePath = `${currentUser.id}/${documentId}/${file.name}`;

      // Upload file to Supabase storage
      const storageData = await uploadDocument(file, storagePath);
      if (!storageData) {
        throw new Error('Failed to upload document to storage');
      }

      // Insert document record in database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          name: file.name,
          storage_path: storagePath,
          status: 'draft',
          created_by: currentUser.id,
          metadata: {}
        });

      if (dbError) {
        throw dbError;
      }
      
      toast.success('Document uploaded successfully');
      
      // Navigate to the editor
      navigate('/editor', { state: { documentId } });
    } catch (error) {
      console.error('Error handling document upload:', error);
      toast.error('Failed to upload document');
    }
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
