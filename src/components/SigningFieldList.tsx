import React from 'react';
import { SigningElement, Recipient } from '@/utils/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SigningFieldListProps {
  signingElements: SigningElement[];
  recipients: Recipient[];
  onRemoveElement: (id: string) => void;
}

const SigningFieldList: React.FC<SigningFieldListProps> = ({ 
  signingElements,
  recipients,
  onRemoveElement
}) => {
  const getRecipientName = (recipientId?: string) => {
    if (!recipientId) return 'Unassigned';
    const recipient = recipients.find(r => r.id === recipientId);
    return recipient ? recipient.name : 'Unknown';
  };

  const getFieldTypeName = (type: SigningElement['type']) => {
    const typeMap: Record<SigningElement['type'], string> = {
      signature: 'Signature',
      date: 'Date',
      text: 'Text',
      checkbox: 'Checkbox',
      name: 'Name',
      email: 'Email',
      address: 'Address',
      title: 'Title'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Signature Fields</h3>
      {signingElements.length > 0 ? (
        <ScrollArea className="h-[250px] border rounded-md p-2">
          <div className="space-y-2">
            {signingElements.map((element) => (
              <div 
                key={element.id} 
                className="flex items-center justify-between p-2 text-xs border rounded-md bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getFieldTypeName(element.type)}</span>
                    <span className="text-muted-foreground">
                      Page {(element?.position?.pageIndex ?? 0) + 1}
                    </span>
                  </div>
                  <div>
                    Position: x: {Math.round(element?.position?.x ?? 0)}, y: {Math.round(element?.position?.y ?? 0)}
                  </div>
                  <div>
                    Assigned to: {getRecipientName(element.recipient_id)}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveElement(element.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">No fields added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a field type and place it on the document
          </p>
        </div>
      )}
    </div>
  );
};

export default SigningFieldList;
