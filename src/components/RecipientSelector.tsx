
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Recipient } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface RecipientSelectorProps {
  recipients: Recipient[];
  selectedRecipientId: string | null;
  onSelectRecipient: (recipientId: string) => void;
  onAddRecipient: () => void;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  recipients,
  selectedRecipientId,
  onSelectRecipient,
  onAddRecipient
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recipients</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddRecipient}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Recipient</span>
        </Button>
      </div>

      {recipients.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select Recipient:</p>
          <Select
            value={selectedRecipientId || ''}
            onValueChange={onSelectRecipient}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  {recipient.name} ({recipient.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="text-center py-3 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">No recipients added yet</p>
          <Button 
            variant="link" 
            size="sm" 
            onClick={onAddRecipient}
            className="mt-1"
          >
            Add your first recipient
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;
