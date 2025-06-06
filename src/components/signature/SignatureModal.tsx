/**
 * SignatureModal Component
 * 
 * A modal component that allows users to draw their signature electronically and agree to terms.
 * This component provides a canvas for drawing signatures and includes validation to ensure
 * the signature is provided and terms are accepted.
 * 
 * Features:
 * - Electronic signature drawing canvas
 * - Clear signature functionality
 * - Terms agreement checkbox
 * - Error handling and validation
 * - Responsive design
 * 
 * Props:
 * @param {boolean} isOpen - Controls the visibility of the modal
 * @param {() => void} onClose - Callback function when the modal is closed
 * @param {(signature: string, date: Date, agreed: boolean) => void} onComplete - Callback function when signature is completed
 * 
 * Dependencies:
 * - react-signature-canvas: For signature drawing functionality
 * - @/components/ui/*: Various UI components (Dialog, Button, Checkbox, Label)
 * 
 * Usage:
 * ```tsx
 * <SignatureModal
 *   isOpen={showSignatureModal}
 *   onClose={() => setShowSignatureModal(false)}
 *   onComplete={(signature, date, agreed) => {
 *     // Handle the completed signature
 *     console.log('Signature completed:', { signature, date, agreed });
 *   }}
 * />
 * ```
 * 
 * Used in:
 * - SignDocument page
 * - Document signing flow
 */

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signature: string, date: Date, agreed: boolean) => void;
}

export function SignatureModal({ isOpen, onClose, onComplete }: SignatureModalProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSave = () => {
    if (!signatureRef.current) {
      setError('Signature is required');
      return;
    }

    if (signatureRef.current.isEmpty()) {
      setError('Please provide your signature');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms');
      return;
    }

    const signatureData = signatureRef.current.toDataURL();
    onComplete(signatureData, new Date(), agreed);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label>Signature</Label>
            <div className="border rounded-md p-4 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40 border rounded-md',
                  style: { background: 'white' }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="mt-2"
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label htmlFor="terms">
              I agree that this is my legal signature and I consent to sign this document electronically
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Sign Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 