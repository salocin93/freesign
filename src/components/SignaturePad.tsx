
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { SignatureData } from '@/utils/types';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: SignatureData) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas when component mounts and when dialog opens
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    canvas.width = canvasRect.width * 2;
    canvas.height = canvasRect.height * 2;
    canvas.style.width = `${canvasRect.width}px`;
    canvas.style.height = `${canvasRect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      contextRef.current = ctx;
      
      // Clear the canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    setHasDrawn(false);
    setSignatureData(null);
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    setHasDrawn(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    
    if (hasDrawn) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setSignatureData({
        dataUrl,
        type: 'drawn'
      });
    }
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    contextRef.current.fillStyle = 'white';
    contextRef.current.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    setSignatureData(null);
    setHasDrawn(false);
  };

  const generateTypedSignature = () => {
    if (!typedName) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'italic 40px "Times New Roman", serif';
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(typedName, canvas.width / 2, canvas.height / 2);
    
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData({
      dataUrl,
      type: 'typed'
    });
  };

  const handleSave = () => {
    if (signatureData) {
      onSave(signatureData);
      onClose();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSignatureData(null);
    if (value === 'type') {
      generateTypedSignature();
    }
  };

  useEffect(() => {
    if (activeTab === 'type' && typedName) {
      generateTypedSignature();
    }
  }, [typedName, activeTab]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Signature</DialogTitle>
          <DialogDescription>
            Draw, type, or upload your signature.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="mt-4">
            <div className="border rounded-md p-1 bg-white">
              <canvas
                ref={canvasRef}
                className="signature-pad w-full h-[150px] bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={finishDrawing}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={finishDrawing}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCanvas}
              className="mt-2"
            >
              Clear
            </Button>
            
            {signatureData && (
              <div className="mt-3 p-2 border rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <img 
                  src={signatureData.dataUrl}
                  alt="Signature preview"
                  className="max-h-[60px] mx-auto"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="type" className="mt-4">
            <div className="space-y-4">
              <div>
                <Input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name"
                  className="font-medium"
                />
              </div>
              
              {signatureData && (
                <div className="border rounded-md p-4 bg-white flex justify-center">
                  <img 
                    src={signatureData.dataUrl} 
                    alt="Typed signature" 
                    className="max-h-[100px]" 
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!signatureData}
          >
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePad;
