/**
 * DrawSignature Component
 * 
 * A wrapper component that provides a drawing interface for creating signatures.
 * This component acts as a thin wrapper around the SignaturePadComponent,
 * providing a consistent interface for signature creation across the application.
 * 
 * Features:
 * - Drawing canvas for freehand signature creation
 * - Save and cancel functionality
 * - Consistent interface with other signature components
 * 
 * Props:
 * @param {(signatureData: SignatureData) => void} onSave - Callback function when signature is saved
 * @param {() => void} onCancel - Callback function when signature drawing is cancelled
 * 
 * Dependencies:
 * - @/components/SignaturePad: For the drawing canvas functionality
 * - @/utils/types: For SignatureData type definition
 * 
 * Usage:
 * ```tsx
 * <DrawSignature
 *   onSave={(signatureData) => {
 *     // Handle the saved signature
 *     console.log('Signature saved:', signatureData);
 *   }}
 *   onCancel={() => {
 *     // Handle cancellation
 *     console.log('Signature drawing cancelled');
 *   }}
 * />
 * ```
 * 
 * Used in:
 * - SignatureModal component
 * - Document signing flow
 */

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
