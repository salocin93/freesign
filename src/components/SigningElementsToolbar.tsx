
import React from 'react';
import { Pen, Calendar, Text, Mail, Home, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SigningElement } from '@/utils/types';

interface SigningElementsToolbarProps {
  activeElementType: SigningElement['type'] | null;
  onSelectElement: (type: SigningElement['type']) => void;
}

const SigningElementsToolbar: React.FC<SigningElementsToolbarProps> = ({ 
  activeElementType, 
  onSelectElement 
}) => {
  const elements = [
    { type: 'signature' as const, icon: Pen, label: 'Signature' },
    { type: 'date' as const, icon: Calendar, label: 'Date' },
    { type: 'name' as const, icon: UserCircle, label: 'Name' },
    { type: 'email' as const, icon: Mail, label: 'Email' },
    { type: 'address' as const, icon: Home, label: 'Address' },
    { type: 'title' as const, icon: Text, label: 'Title' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Field Types</h3>
      <div className="grid grid-cols-2 gap-2">
        {elements.map((element) => (
          <Button
            key={element.type}
            variant={activeElementType === element.type ? "default" : "outline"}
            size="sm"
            className={cn(
              "transition-all duration-200 justify-start",
              activeElementType === element.type ? "bg-primary" : ""
            )}
            onClick={() => onSelectElement(element.type)}
          >
            <element.icon className="h-4 w-4 mr-2" />
            {element.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SigningElementsToolbar;
