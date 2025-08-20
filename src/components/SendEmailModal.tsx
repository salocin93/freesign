import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [recipientMessages, setRecipientMessages] = useState<Record<string, string>>({});

  const handleMessageChange = (recipientId: string, message: string) => {
    setRecipientMessages(prev => ({
      ...prev,
      [recipientId]: message
    }));
  };

  const handleSend = async () => {
    if (!recipients.length) {
      toast.error('Please add at least one recipient');
      return;
    }

    try {
      setIsSending(true);

      // Add messages to recipients
      const recipientsWithMessages = recipients.map(recipient => ({
        ...recipient,
        message: recipientMessages[recipient.id]
      }));

      // Send emails
      await sendSignatureRequest(documentId, recipientsWithMessages);

      toast.success('Document sent successfully');
      onClose();
    } catch (error) {
      console.error('Error sending document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send document';
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

        <div className="space-y-4">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="space-y-2">
              <Label>Message for {recipient.name || recipient.email}</Label>
              <Textarea
                placeholder="Add a personal message (optional)"
                value={recipientMessages[recipient.id] || ''}
                onChange={(e) => handleMessageChange(recipient.id, e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 