import React from 'react';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

interface SignatureFieldProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  signatureUrl?: string;
  isPlaceholder?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({
  position,
  size,
  signatureUrl,
  isPlaceholder = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute cursor-pointer border-2 rounded flex items-center justify-center',
        isPlaceholder ? 'border-dashed border-gray-400 bg-gray-50' : 'border-transparent',
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      onClick={onClick}
    >
      {signatureUrl ? (
        <img
          src={signatureUrl}
          alt="Signature"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Pencil className="w-6 h-6 mb-1" />
          <span className="text-sm">Click to sign</span>
        </div>
      )}
    </div>
  );
}; 