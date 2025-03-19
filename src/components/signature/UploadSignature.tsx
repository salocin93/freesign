/**
 * UploadSignature Component
 * 
 * A component that allows users to upload their signature as an image file.
 * The component handles file selection, converts the image to base64 format,
 * and provides a way to save or cancel the upload process.
 * 
 * Features:
 * - File upload input for signature images
 * - Automatic base64 conversion of uploaded images
 * - Support for various image formats
 * - Simple save/cancel interface
 * - Metadata tracking (user agent, timestamp)
 * 
 * Props:
 * @param {(signatureData: SignatureData) => void} onSave - Callback function when signature is saved
 * @param {() => void} onCancel - Callback function when signature upload is cancelled
 * 
 * Dependencies:
 * - @/components/ui/input: For file input
 * - @/components/ui/button: For action buttons
 * - @/utils/types: For SignatureData type definition
 * 
 * Usage:
 * ```tsx
 * <UploadSignature
 *   onSave={(signatureData) => {
 *     // Handle the saved signature
 *     console.log('Signature saved:', signatureData);
 *   }}
 *   onCancel={() => {
 *     // Handle cancellation
 *     console.log('Signature upload cancelled');
 *   }}
 * />
 * ```
 * 
 * Used in:
 * - SignatureModal component
 * - Document signing flow
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignatureData } from '@/utils/types';

interface UploadSignatureProps {
  onSave: (signatureData: SignatureData) => void;
  onCancel: () => void;
}

export const UploadSignature: React.FC<UploadSignatureProps> = ({
  onSave,
  onCancel,
}) => {
  const handleUploadSignature = (dataUrl: string) => {
    const timestamp = new Date().toISOString();
    const signatureData: SignatureData = {
      dataUrl,
      type: 'uploaded',
      timestamp,
      metadata: {
        userAgent: navigator.userAgent
      }
    };
    onSave(signatureData);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // Convert the uploaded image to base64
          const reader = new FileReader();
          reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
              handleUploadSignature(event.target.result);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
