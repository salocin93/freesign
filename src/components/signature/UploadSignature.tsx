
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
