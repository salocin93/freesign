import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function AddRecipientModal({ isOpen, onClose, documentId }: AddRecipientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const recipientId = uuidv4();
      const { error } = await supabase
        .from('recipients')
        .insert({
          id: recipientId,
          document_id: documentId,
          name: name.trim(),
          email: email.trim(),
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      toast.success('Recipient added successfully');
      setName('');
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast.error('Failed to add recipient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Recipient</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipient's name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter recipient's email"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Recipient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 