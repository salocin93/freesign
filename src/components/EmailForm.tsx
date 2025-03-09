import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Recipient } from '@/utils/types';
import { Plus, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface EmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipients: Recipient[], message: string) => void;
  existingRecipients: Recipient[];
}

const EmailForm: React.FC<EmailFormProps> = ({ isOpen, onClose, onSend, existingRecipients = [] }) => {
  const [recipients, setRecipients] = useState<Recipient[]>(() => 
    existingRecipients?.length > 0 
      ? existingRecipients 
      : [{ id: uuidv4(), name: '', email: '', status: 'pending' }]
  );
  const [message, setMessage] = useState('Please review and sign this document.');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRecipient = () => {
    setRecipients([
      ...recipients,
      { id: uuidv4(), name: '', email: '', status: 'pending' }
    ]);
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length === 1) {
      return;
    }
    setRecipients(recipients.filter(recipient => recipient.id !== id));
  };

  const handleRecipientChange = (id: string, field: 'name' | 'email', value: string) => {
    setRecipients(
      recipients.map(recipient => 
        recipient.id === id ? { ...recipient, [field]: value } : recipient
      )
    );
  };

  const handleSend = () => {
    // Validate recipients
    const isValid = recipients.every(recipient => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return recipient.name.trim() !== '' && emailRegex.test(recipient.email);
    });

    if (!isValid) {
      toast.error('Please fill in all recipient details with valid email addresses');
      return;
    }

    setIsLoading(true);
    onSend(recipients, message);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Document for Signature</DialogTitle>
          <DialogDescription>
            Enter the email addresses of the people who need to sign this document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="flex items-center space-x-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Input
                    placeholder="Name"
                    value={recipient.name}
                    onChange={(e) => handleRecipientChange(recipient.id, 'name', e.target.value)}
                  />
                  <div className="relative flex items-center">
                    <Input
                      placeholder="Email"
                      type="email"
                      value={recipient.email}
                      onChange={(e) => handleRecipientChange(recipient.id, 'email', e.target.value)}
                      className="pr-8"
                    />
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 h-full aspect-square text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveRecipient(recipient.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleAddRecipient}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Recipient
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to the recipients"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailForm;
