import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signature: string, date: Date, agreed: boolean) => void;
}

export function SignatureModal({ isOpen, onClose, onComplete }: SignatureModalProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [date, setDate] = useState<Date>(new Date());
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
    onComplete(signatureData, date, agreed);
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

          <div>
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
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