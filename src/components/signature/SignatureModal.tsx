/**
 * SignatureModal Component
 * 
 * A modal component that allows users to create signatures using multiple methods:
 * - Drawing signatures on a canvas
 * - Typing signatures with various fonts
 * - Uploading signature images
 * 
 * Features:
 * - Multiple signature creation methods
 * - Tabbed interface for different signature types
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
 * - @/components/ui/*: Various UI components
 * - @/components/signature/TypeSignature: For typed signatures
 * - @/components/signature/UploadSignature: For uploaded signatures
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

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypeSignature } from './TypeSignature';
import { UploadSignature } from './UploadSignature';
import SignatureErrorBoundary from './SignatureErrorBoundary';
import { 
  AriaLabelGenerator, 
  FocusManagement, 
  ScreenReaderSupport,
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReaderAnnouncement
} from '@/utils/accessibility';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signature: string, date: Date, agreed: boolean) => void;
}

export function SignatureModal({ isOpen, onClose, onComplete }: SignatureModalProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('draw');

  // Accessibility hooks
  useFocusTrap(modalRef);
  const announce = useScreenReaderAnnouncement();

  // Announce modal state changes
  useEffect(() => {
    if (isOpen) {
      announce('Signature modal opened. Use tabs to switch between signature methods: Draw, Type, or Upload.');
    }
  }, [isOpen, announce]);

  // Announce tab changes
  useEffect(() => {
    if (isOpen) {
      const tabLabels = {
        draw: 'Draw signature tab',
        type: 'Type signature tab', 
        upload: 'Upload signature tab'
      };
      announce(`Switched to ${tabLabels[activeTab as keyof typeof tabLabels]}`);
    }
  }, [activeTab, isOpen, announce]);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setSignatureData(null);
  };

  const handleSignatureCreated = (dataUrl: string) => {
    setSignatureData(dataUrl);
    setError(null);
  };

  const handleSave = () => {
    if (!signatureData) {
      setError('Please create your signature');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms');
      return;
    }

    onComplete(signatureData, new Date(), agreed);
    onClose();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSignatureData(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={modalRef}
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="signature-modal-title"
        aria-describedby="signature-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="signature-modal-title">Create Your Signature</DialogTitle>
          <div id="signature-modal-description" className="sr-only">
            Modal for creating signatures. Choose between drawing, typing, or uploading a signature.
          </div>
        </DialogHeader>

        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Signature creation methods">
            <TabsTrigger 
              value="draw" 
              role="tab" 
              aria-selected={activeTab === 'draw'}
              aria-controls="draw-panel"
            >
              Draw
            </TabsTrigger>
            <TabsTrigger 
              value="type" 
              role="tab" 
              aria-selected={activeTab === 'type'}
              aria-controls="type-panel"
            >
              Type
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              role="tab" 
              aria-selected={activeTab === 'upload'}
              aria-controls="upload-panel"
            >
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-6" role="tabpanel" id="draw-panel" aria-labelledby="draw-tab">
            <SignatureErrorBoundary signatureType="draw" enableRetry>
              <div>
                <Label htmlFor="signature-canvas">Draw Your Signature</Label>
                <div className="border rounded-md p-4 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      id: "signature-canvas",
                      "data-testid": "signature-canvas",
                      className: 'w-full h-40 border rounded-md',
                      style: { background: 'white' },
                      'aria-label': 'Signature drawing canvas. Use your mouse or touch to draw your signature.',
                      role: 'img'
                    }}
                    onEnd={() => {
                      if (signatureRef.current && !signatureRef.current.isEmpty()) {
                        handleSignatureCreated(signatureRef.current.toDataURL());
                        announce('Signature drawn successfully');
                      }
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="mt-2"
                  aria-label="Clear signature drawing"
                >
                  Clear
                </Button>
              </div>
            </SignatureErrorBoundary>
          </TabsContent>

          <TabsContent value="type" className="space-y-6" role="tabpanel" id="type-panel" aria-labelledby="type-tab" data-testid="type-signature">
            <SignatureErrorBoundary signatureType="type" enableRetry>
              <TypeSignature
                onSave={(dataUrl) => {
                  handleSignatureCreated(dataUrl);
                  announce('Typed signature created successfully');
                }}
                onCancel={() => setSignatureData(null)}
              />
            </SignatureErrorBoundary>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6" role="tabpanel" id="upload-panel" aria-labelledby="upload-tab" data-testid="upload-signature">
            <SignatureErrorBoundary signatureType="upload" enableRetry>
              <UploadSignature
                onSave={(dataUrl) => {
                  handleSignatureCreated(dataUrl);
                  announce('Signature uploaded successfully');
                }}
                onCancel={() => setSignatureData(null)}
              />
            </SignatureErrorBoundary>
          </TabsContent>
        </Tabs>

        {signatureData && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50" role="region" aria-label="Signature preview">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Signature Preview
            </Label>
            <div className="flex items-center justify-center min-h-[80px]">
              <img
                src={signatureData}
                alt="Signature preview"
                className="max-w-full max-h-16 object-contain"
                aria-describedby="signature-preview-description"
              />
            </div>
            <div id="signature-preview-description" className="sr-only">
              Preview of your created signature
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            aria-describedby="terms-description"
          />
          <Label htmlFor="terms">
            I agree to the terms and consent to sign this document electronically
          </Label>
          <div id="terms-description" className="sr-only">
            Required agreement to proceed with electronic signature
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            aria-label="Cancel signature creation"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!signatureData || !agreed}
            aria-label={!signatureData || !agreed ? 'Complete signature and agreement required' : 'Complete signature'}
          >
            Complete Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 