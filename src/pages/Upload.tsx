import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DocumentUploader from '@/components/DocumentUploader';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase, uploadDocument, createDocument } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Replace spaces and special characters with underscores
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore
};

const Upload = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Check authentication on mount
  useEffect(() => {
    if (!currentUser) {
      toast.error('Please log in to upload documents');
      navigate('/login', { state: { from: '/upload' } });
    }
  }, [currentUser, navigate]);

  const handleDocumentSelected = async (file: File) => {
    let loadingToast: string | number | undefined;
    
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
        navigate('/login', { state: { from: '/upload' } });
        return;
      }

      // Show loading toast
      loadingToast = toast.loading('Uploading document...');

      // Create a unique ID and storage path with sanitized filename
      const documentId = uuidv4();
      const sanitizedFilename = sanitizeFilename(file.name);
      const storagePath = `${currentUser.id}/${documentId}/${sanitizedFilename}`;

      // Upload file to Supabase storage
      const storageData = await uploadDocument(file, storagePath);
      if (!storageData) {
        throw new Error('Failed to upload document to storage');
      }

      // Insert document record in database using the helper function
      // which will handle mock data in development mode
      const documentRecord = await createDocument(file.name, storagePath);
      
      if (!documentRecord) {
        throw new Error('Failed to create document record');
      }
      
      // Dismiss loading toast and show success
      if (loadingToast) toast.dismiss(loadingToast);
      toast.success('Document uploaded successfully');
      
      // Navigate to the editor with the document ID in the URL
      navigate(`/editor/${documentRecord.id}`);
    } catch (error: any) {
      // Dismiss loading toast if it exists
      if (loadingToast) toast.dismiss(loadingToast);

      console.error('Error handling document upload:', error);
      
      // Handle specific error cases
      if (error.message?.includes('not authenticated')) {
        toast.error('Please log in to upload documents');
        navigate('/login', { state: { from: '/upload' } });
      } else if (error.message?.includes('bucket')) {
        toast.error('Storage system not properly configured. Please contact support.');
      } else if (error.message?.includes('permission denied')) {
        toast.error('You do not have permission to upload documents');
      } else {
        // Show specific error message if available
        const errorMessage = error.message || error.error_description || 'Failed to upload document';
        toast.error(errorMessage);
      }
    }
  };

  if (!currentUser) {
    return null; // Let the useEffect handle the redirect
  }

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
