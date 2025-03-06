
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, File } from 'lucide-react';

interface DocumentUploaderProps {
  onDocumentSelected: (file: File) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDocumentSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type === 'application/pdf') {
        onDocumentSelected(file);
        toast.success('Document uploaded successfully');
      } else {
        toast.error('Please upload a valid PDF document');
      }
    },
    [onDocumentSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`document-drop-zone transition-all duration-300 ease-out ${
        isDragging || isDragActive ? 'document-drop-zone active scale-105' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          {isDragging ? (
            <File className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        <h3 className="text-lg font-medium mb-2">Upload your document</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          Drag and drop your PDF file here, or click to browse
        </p>
        <div className="text-xs text-muted-foreground">
          Supported format: PDF (up to 10MB)
        </div>
      </div>
    </div>
  );
};

export default DocumentUploader;
