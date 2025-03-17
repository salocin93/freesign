import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendSignatureRequest } from '@/lib/emailService';
import { Recipient } from '@/utils/types';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  recipients: Recipient[];
}

export function SendEmailModal({ isOpen, onClose, documentId, recipients }: SendEmailModalProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipients.length) {
      toast.error('Please add at least one recipient');
      return;
    }

    try {
      setIsSending(true);

      // Send emails
      await sendSignatureRequest(documentId, recipients);

      toast.success('Document sent successfully');
      onClose();
    } catch (error: any) {
      console.error('Error sending document:', error);
      const errorMessage = error.message || 'Failed to send document';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send for Signature</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Recipients</Label>
            <div className="mt-2 space-y-2">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-500">{recipient.email}</div>
                  </div>
                </div>
              ))}
              {!recipients.length && (
                <div className="text-sm text-gray-500">
                  No recipients added. Please add recipients before sending.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !recipients.length}
            >
              {isSending ? 'Sending...' : 'Send Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 