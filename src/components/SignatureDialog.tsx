import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignaturePadComponent } from './SignaturePad';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SignatureData } from '@/utils/types';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSelected: (signatureId: string) => void;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  onClose,
  onSignatureSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSaveSignature = async (signatureData: SignatureData) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save a signature',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save the signature to the database
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          user_id: currentUser.id,
          type: activeTab,
          value: signatureData.dataUrl,
          name: typedName || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onSignatureSelected(data.id);
        onClose();
        toast({
          title: 'Success',
          description: 'Signature saved successfully',
        });
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save signature',
        variant: 'destructive',
      });
    }
  };

  const handleTypedSignature = () => {
    if (!typedName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    // Create a canvas to render the typed signature
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 100;

    // Set font and style
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '48px "Dancing Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the text
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    // Convert to base64
    const signatureData: SignatureData = {
      dataUrl: canvas.toDataURL('image/png'),
      type: 'typed'
    };
    handleSaveSignature(signatureData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
          <DialogDescription>
            Choose how you want to create your signature
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <SignaturePadComponent
              onSave={(dataUrl) => handleSaveSignature({ dataUrl, type: 'drawn' })}
              onCancel={onClose}
            />
          </TabsContent>

          <TabsContent value="type">
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Type your name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleTypedSignature}>
                  Save Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <div className="flex flex-col gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Convert the uploaded image to base64
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (typeof event.target?.result === 'string') {
                      handleSaveSignature({
                        dataUrl: event.target.result,
                        type: 'uploaded'
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 