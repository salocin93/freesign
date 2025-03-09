
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrawSignature } from './signature/DrawSignature';
import { TypeSignature } from './signature/TypeSignature';
import { UploadSignature } from './signature/UploadSignature';
import { useSignature } from './signature/useSignature';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSelected: (signatureId: string) => void;
  documentId?: string;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  onClose,
  onSignatureSelected,
  documentId,
}) => {
  const {
    activeTab,
    setActiveTab,
    handleSaveSignature,
  } = useSignature({
    onSignatureSelected,
    onClose,
    documentId,
  });

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
            <DrawSignature
              onSave={handleSaveSignature}
              onCancel={onClose}
            />
          </TabsContent>

          <TabsContent value="type">
            <TypeSignature
              onSave={handleSaveSignature}
              onCancel={onClose}
            />
          </TabsContent>

          <TabsContent value="upload">
            <UploadSignature
              onSave={handleSaveSignature}
              onCancel={onClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
