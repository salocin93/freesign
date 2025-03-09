
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SignatureData } from '@/utils/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SignatureVerificationUtil } from '@/utils/signatureVerification';
import { getClientInfo } from '@/utils/clientInfo';

interface UseSignatureProps {
  onSignatureSelected: (signatureId: string) => void;
  onClose: () => void;
  documentId?: string;
}

export const useSignature = ({
  onSignatureSelected,
  onClose,
  documentId,
}: UseSignatureProps) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
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
      // Get client information
      const clientInfo = await getClientInfo();
      
      // Add verification metadata
      const timestamp = clientInfo.timestamp;
      
      let verificationHash = '';
      if (documentId) {
        verificationHash = await SignatureVerificationUtil.createSignatureHash(
          signatureData.dataUrl,
          currentUser.id,
          timestamp,
          documentId
        );
      }

      // Save the signature to the database
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          user_id: currentUser.id,
          type: activeTab,
          value: signatureData.dataUrl,
          name: signatureData.type === 'typed' ? signatureData.dataUrl : null,
          verification_hash: verificationHash || null,
          metadata: {
            userAgent: clientInfo.userAgent,
            timestamp,
            geolocation: clientInfo.geolocation,
          },
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the signature event if document ID is provided
      if (documentId) {
        await supabase.from('signature_audit_logs').insert({
          signature_id: data.id,
          document_id: documentId,
          event_type: 'signature_created',
          event_data: {
            type: activeTab,
            metadata: data.metadata,
          },
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          geolocation: clientInfo.geolocation,
        });
      }

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

  return {
    activeTab,
    setActiveTab,
    handleSaveSignature,
  };
};
