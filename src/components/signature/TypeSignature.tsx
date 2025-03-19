/**
 * TypeSignature Component
 * 
 * A component that allows users to create their signature by typing their name.
 * The component converts the typed name into a stylized signature using HTML Canvas
 * and the Dancing Script font for a handwritten appearance.
 * 
 * Features:
 * - Text input for signature creation
 * - Canvas-based signature rendering
 * - Stylized font rendering using Dancing Script
 * - Input validation
 * - Toast notifications for error feedback
 * 
 * Props:
 * @param {(signatureData: SignatureData) => void} onSave - Callback function when signature is saved
 * @param {() => void} onCancel - Callback function when signature creation is cancelled
 * 
 * Dependencies:
 * - @/components/ui/input: For text input
 * - @/components/ui/button: For action buttons
 * - @/components/ui/use-toast: For toast notifications
 * - @/utils/types: For SignatureData type definition
 * 
 * Usage:
 * ```tsx
 * <TypeSignature
 *   onSave={(signatureData) => {
 *     // Handle the saved signature
 *     console.log('Signature saved:', signatureData);
 *   }}
 *   onCancel={() => {
 *     // Handle cancellation
 *     console.log('Signature creation cancelled');
 *   }}
 * />
 * ```
 * 
 * Used in:
 * - SignatureModal component
 * - Document signing flow
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SignatureData } from '@/utils/types';

interface TypeSignatureProps {
  onSave: (signatureData: SignatureData) => void;
  onCancel: () => void;
}

export const TypeSignature: React.FC<TypeSignatureProps> = ({
  onSave,
  onCancel,
}) => {
  const [typedName, setTypedName] = useState('');
  const { toast } = useToast();

  const handleTypedSignature = () => {
    if (!typedName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    // Create a canvas to render the typed signature
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 100;

    // Set font and style
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '48px "Dancing Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the text
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    // Convert to base64
    const timestamp = new Date().toISOString();
    const signatureData: SignatureData = {
      dataUrl: canvas.toDataURL('image/png'),
      type: 'typed',
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
        placeholder="Type your name"
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleTypedSignature}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};
