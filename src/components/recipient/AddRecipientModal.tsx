/**
 * AddRecipientModal Component
 * 
 * A modal component for adding new recipients to a document for signing.
 * This component provides a form to collect recipient information and handles
 * the creation of new recipients in the database.
 * 
 * Features:
 * - Form for collecting recipient details (name and email)
 * - Input validation
 * - Database integration with Supabase
 * - Loading state handling
 * - Error handling with toast notifications
 * - Automatic recipient selection after creation
 * 
 * Props:
 * @param {boolean} isOpen - Controls the visibility of the modal
 * @param {() => void} onClose - Callback function when the modal is closed
 * @param {string} documentId - ID of the document to add the recipient to
 * @param {(recipient: Recipient) => void} onAddRecipient - Callback function when a recipient is added
 * @param {Recipient[]} recipients - Array of existing recipients
 * @param {(id: string) => void} setSelectedRecipientId - Callback function to set the selected recipient
 * 
 * Dependencies:
 * - @/components/ui/dialog: For modal functionality
 * - @/components/ui/button: For action buttons
 * - @/components/ui/label: For form labels
 * - @/components/ui/input: For form inputs
 * - sonner: For toast notifications
 * - @/lib/supabase: For database operations
 * - uuid: For generating unique IDs
 * 
 * Usage:
 * ```tsx
 * <AddRecipientModal
 *   isOpen={showAddRecipient}
 *   onClose={() => setShowAddRecipient(false)}
 *   documentId="doc123"
 *   onAddRecipient={(recipient) => {
 *     // Handle the new recipient
 *     console.log('Recipient added:', recipient);
 *   }}
 *   recipients={recipients}
 *   setSelectedRecipientId={(id) => setSelectedRecipient(id)}
 * />
 * ```
 * 
 * Used in:
 * - PDFViewer component
 * - Document editor
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onAddRecipient: (recipient: any) => void;
  recipients: any[];
  setSelectedRecipientId: (id: string) => void;
}

export function AddRecipientModal({ isOpen, onClose, documentId, onAddRecipient, recipients, setSelectedRecipientId }: AddRecipientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'select' | 'add'>('select');

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) setMode(recipients.length > 0 ? 'select' : 'add');
  }, [isOpen, recipients.length]);

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    onClose();
  };

  const handleShowAdd = () => setMode('add');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('recipients')
        .insert([
          {
            document_id: documentId,
            name,
            email,
            status: 'pending'
          },
        ])
        .select()
        .single();
      if (error) throw error;
      onAddRecipient(data);
      onClose();
      setSelectedRecipientId(data.id);
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
        {mode === 'select' && recipients.length > 0 ? (
          <div className="space-y-4">
            <Label>Select an existing recipient</Label>
            <Select onValueChange={handleSelectRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button onClick={handleShowAdd} type="button">Add New Recipient</Button>
            </div>
          </div>
        ) : (
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
            <div className="flex justify-between gap-2">
              {recipients.length > 0 && (
                <Button variant="outline" onClick={() => setMode('select')} type="button">
                  Back to Select
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Recipient'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 