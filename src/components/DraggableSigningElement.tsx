import React, { useState } from 'react';
import { Signature, Calendar, Type, Check, X } from 'lucide-react';
import { SigningElement } from '@/utils/types';
import { cn } from '@/lib/utils';

interface DraggableSigningElementProps {
  element: SigningElement;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SigningElement>) => void;
}

/**
 * Draggable component representing a signing element in the document.
 * 
 * @param element - The signing element data.
 * @param onRemove - Callback function to handle removing the element.
 * @param onUpdate - Callback function to handle updating the element's position.
 */
export const DraggableSigningElement: React.FC<DraggableSigningElementProps> = ({
  element,
  onRemove,
  onUpdate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: element.position.x,
    y: element.position.y,
  });

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', element.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onUpdate(element.id, { position: { ...element.position, x: position.x, y: position.y } });
  };

  const handleRemove = () => {
    onRemove(element.id);
  };

  const getElementIcon = () => {
    switch (element.type) {
      case 'signature':
        return <Signature className="h-4 w-4 text-primary" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'text':
        return <Type className="h-4 w-4 text-primary" />;
      case 'checkbox':
        return <Check className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getElementContent = () => {
    switch (element.type) {
      case 'signature':
        return (
          <div className="h-full flex items-center justify-center border-b border-dashed border-gray-300">
            <span className="text-muted-foreground text-sm">Signature</span>
          </div>
        );
      case 'date':
        return (
          <div className="h-full flex items-center justify-center border-b border-dashed border-gray-300">
            <span className="text-muted-foreground text-sm">Date</span>
          </div>
        );
      case 'text':
        return (
          <div className="h-full flex items-center justify-center border-b border-dashed border-gray-300">
            <span className="text-muted-foreground text-sm">Text</span>
          </div>
        );
      case 'checkbox':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border border-gray-300 rounded"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "signing-element transition-all duration-200",
        isDragging ? "opacity-50" : ""
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between px-2 py-1 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center space-x-1">
          {getElementIcon()}
          <span className="text-xs font-medium">{element.label || element.type}</span>
        </div>
      </div>
      {getElementContent()}
      <button
        className="signing-element-handle"
        onClick={handleRemove}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}; 