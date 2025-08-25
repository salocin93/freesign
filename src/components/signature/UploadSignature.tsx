/**
 * UploadSignature Component
 * 
 * A component that allows users to upload image files (PNG, JPG, SVG) as signatures.
 * This provides an alternative to drawing or typing signatures for users who have
 * existing signature images.
 * 
 * Features:
 * - File upload with drag & drop support
 * - Image preview and cropping
 * - File validation and size limits
 * - Multiple format support (PNG, JPG, SVG)
 * 
 * Props:
 * @param {(dataUrl: string) => void} onSave - Callback when signature is saved
 * @param {() => void} onCancel - Callback when signature upload is cancelled
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Check } from 'lucide-react';

interface UploadSignatureProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export function UploadSignature({ onSave, onCancel }: UploadSignatureProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPG, or SVG file';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!preview) return;
    onSave(preview);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Upload Signature Image</Label>
        <p className="text-sm text-gray-500 mt-1">
          Upload a PNG, JPG, or SVG file of your signature (max 5MB)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          {!preview ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your signature image here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse files
              </p>
              <Button onClick={handleBrowseClick} variant="outline">
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                data-testid="file-input"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">
                    {file?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-white">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Preview
                </Label>
                <div className="flex items-center justify-center min-h-[120px]">
                  <img
                    src={preview}
                    alt="Signature preview"
                    className="max-w-full max-h-32 object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!preview}>
          Save Signature
        </Button>
      </div>
    </div>
  );
}
