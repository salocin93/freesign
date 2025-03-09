
import React from 'react';
import { SignaturePadComponent } from '../SignaturePad';
import { SignatureData } from '@/utils/types';

interface DrawSignatureProps {
  onSave: (signatureData: SignatureData) => void;
  onCancel: () => void;
}

export const DrawSignature: React.FC<DrawSignatureProps> = ({
  onSave,
  onCancel,
}) => {
  return (
    <SignaturePadComponent
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};
