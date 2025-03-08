
import React from 'react';
import { Pen, X } from 'lucide-react';
import { SigningElement } from './EditorTypes';
import { Recipient } from '@/utils/types';

interface DocumentElementsProps {
  signingElements: SigningElement[];
  recipients: Recipient[];
  handleDragStart: (e: React.DragEvent, element: SigningElement) => void;
  handleRemoveElement: (id: string) => void;
  handleSignatureFieldClick: (fieldId: string) => void;
}

const DocumentElements: React.FC<DocumentElementsProps> = ({
  signingElements,
  recipients,
  handleDragStart,
  handleRemoveElement,
  handleSignatureFieldClick,
}) => {
  return (
    <>
      {signingElements.map((element) => {
        const recipient = recipients.find(r => r.id === element.assignedTo);
        const recipientColor = recipient ? 
          (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : 
           recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : 
           recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : 
           `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';
        
        return (
          <div
            key={element.id}
            className="signing-element absolute"
            style={{
              left: `${element.position.x}px`,
              top: `${element.position.y}px`,
              width: `${element.size.width}px`,
              height: `${element.size.height}px`,
              borderColor: recipientColor,
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, element)}
          >
            <div 
              className="flex items-center justify-between px-2 py-1 border-b"
              style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
            >
              <span className="text-xs font-medium">{element.type}</span>
              <span className="text-xs text-muted-foreground">{recipient?.name || 'Unassigned'}</span>
            </div>
            <div 
              className="h-full flex items-center justify-center border-b border-dashed border-gray-300"
              onClick={() => element.type === 'signature' && handleSignatureFieldClick(element.id)}
            >
              {element.type === 'signature' ? (
                element.value ? (
                  <img 
                    src={element.value as string} 
                    alt="Signature" 
                    className="max-h-[calc(100%-10px)] max-w-[calc(100%-10px)] object-contain" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Pen className="w-6 h-6 mb-1" />
                    <span className="text-sm">Click to sign</span>
                  </div>
                )
              ) : (
                <span className="text-muted-foreground text-sm">{element.type}</span>
              )}
            </div>
            <button
              className="signing-element-handle absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveElement(element.id);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </>
  );
};

export default DocumentElements;
