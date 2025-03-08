
import React, { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser, Undo2 } from 'lucide-react';
import { SignatureData } from '@/utils/types';

interface SignaturePadProps {
  onSave: (signatureData: SignatureData) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export const SignaturePadComponent: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  width = 400,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set canvas to be 2x resolution for retina displays
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual size in memory (scaled for retina)
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // Set CSS size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Scale context for retina
    ctx.scale(ratio, ratio);

    // Initialize SignaturePad
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
    });

    // Update isEmpty state when signature changes
    signaturePadRef.current.addEventListener('endStroke', () => {
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
    });

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [width, height]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
  };

  const handleUndo = () => {
    const data = signaturePadRef.current?.toData();
    if (data) {
      data.pop(); // remove the last stroke
      signaturePadRef.current?.fromData(data);
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      const timestamp = new Date().toISOString();
      onSave({
        dataUrl,
        type: 'drawn',
        timestamp,
        metadata: {
          userAgent: navigator.userAgent
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow">
      <div className="relative border rounded">
        <canvas
          ref={canvasRef}
          className="touch-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
        >
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={isEmpty}
        >
          <Undo2 className="w-4 h-4 mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isEmpty}
        >
          Save Signature
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Draw your signature above
      </p>
    </div>
  );
};

export default SignaturePadComponent;
