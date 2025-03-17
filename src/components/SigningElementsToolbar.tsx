import React from 'react';
import { Pen, Calendar, Type, Mail, Home, UserCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SigningElement } from '@/utils/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SigningElementsToolbarProps {
  activeElementType: SigningElement['type'] | null;
  onSelectElement: (type: SigningElement['type']) => void;
  variant?: 'default' | 'compact';
  showTooltips?: boolean;
}

/**
 * A unified toolbar component for selecting and adding signing elements to a document.
 * 
 * @param activeElementType - The currently active signing element type
 * @param onSelectElement - Callback function when an element is selected
 * @param variant - Visual variant of the toolbar ('default' or 'compact')
 * @param showTooltips - Whether to show tooltips on hover
 */
const SigningElementsToolbar: React.FC<SigningElementsToolbarProps> = ({ 
  activeElementType, 
  onSelectElement,
  variant = 'default',
  showTooltips = true
}) => {
  const elements = [
    { type: 'signature' as const, icon: Pen, label: 'Signature' },
    { type: 'date' as const, icon: Calendar, label: 'Date' },
    { type: 'name' as const, icon: UserCircle, label: 'Name' },
    { type: 'email' as const, icon: Mail, label: 'Email' },
    { type: 'address' as const, icon: Home, label: 'Address' },
    { type: 'text' as const, icon: Type, label: 'Text Field' },
    { type: 'checkbox' as const, icon: Check, label: 'Checkbox' },
  ];

  const renderButton = (element: typeof elements[0]) => {
    const button = (
      <Button
        key={element.type}
        variant={activeElementType === element.type ? "default" : "outline"}
        size="sm"
        className={cn(
          "transition-all duration-200",
          variant === 'default' ? "justify-start" : "",
          activeElementType === element.type ? "bg-primary" : ""
        )}
        onClick={() => onSelectElement(element.type)}
      >
        <element.icon className="h-4 w-4 mr-2" />
        {variant === 'default' && element.label}
      </Button>
    );

    if (showTooltips) {
      return (
        <TooltipProvider key={element.type}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>Add {element.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <div className={cn(
      "space-y-3",
      variant === 'compact' ? "p-2" : "p-4 bg-white rounded-lg shadow-sm border"
    )}>
      <h3 className="text-sm font-medium">
        {variant === 'default' ? "Field Types" : "Add Fields"}
      </h3>
      <div className={cn(
        variant === 'default' ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"
      )}>
        {elements.map(renderButton)}
      </div>
    </div>
  );
};

export default SigningElementsToolbar;
