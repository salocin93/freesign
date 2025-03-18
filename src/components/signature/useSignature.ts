/**
 * Signature Management Hook
 * 
 * This hook provides functionality for managing digital signatures in the application.
 * It handles signature creation, storage, and verification processes.
 * 
 * Features:
 * - Multiple signature types (draw, type, upload)
 * - Client information collection
 * - Signature verification
 * - Audit logging
 * - Database integration
 * 
 * @module useSignature
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SignatureData } from '@/utils/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SignatureVerificationUtil } from '@/utils/signatureVerification';
import { getClientInfo } from '@/utils/clientInfo';

/**
 * Props for the useSignature hook
 * 
 * @interface UseSignatureProps
 * @property {function} onSignatureSelected - Callback function when a signature is selected
 * @property {function} onClose - Callback function to close the signature modal
 * @property {string} [documentId] - Optional document ID for signature verification
 */
interface UseSignatureProps {
  onSignatureSelected: (signatureId: string) => void;
  onClose: () => void;
  documentId?: string;
}

/**
 * Custom hook for managing signature creation and storage
 * 
 * This hook provides functionality for:
 * 1. Managing signature creation modes (draw, type, upload)
 * 2. Saving signatures with verification data
 * 3. Creating audit logs
 * 4. Handling user feedback
 * 
 * The hook ensures:
 * - User authentication
 * - Client information collection
 * - Signature verification
 * - Complete audit trail
 * - Error handling
 * 
 * @param {UseSignatureProps} props - The hook configuration
 * @returns {Object} Object containing signature management functions and state
 * 
 * @example
 * ```typescript
 * const { activeTab, setActiveTab, handleSaveSignature } = useSignature({
 *   onSignatureSelected: (id) => console.log('Selected signature:', id),
 *   onClose: () => console.log('Modal closed'),
 *   documentId: 'doc123'
 * });
 * ```
 */
export const useSignature = ({
  onSignatureSelected,
  onClose,
  documentId,
}: UseSignatureProps) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  /**
   * Handles the saving of a signature
   * 
   * This function performs several important steps:
   * 1. Validates user authentication
   * 2. Collects client information
   * 3. Creates verification hash if document ID is provided
   * 4. Saves signature to database
   * 5. Creates audit log entry
   * 6. Provides user feedback
   * 
   * @param {SignatureData} signatureData - The signature data to save
   * @throws {Error} If user is not authenticated or database operations fail
   */
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
      console.log('Starting signature save process:', {
        userId: currentUser.id,
        documentId,
        signatureType: activeTab,
      });

      // Get client information
      console.log('Fetching client information...');
      const clientInfo = await getClientInfo();
      console.log('Client information collected:', {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        timestamp: clientInfo.timestamp,
        geolocation: clientInfo.geolocation,
      });
      
      // Add verification metadata
      const timestamp = clientInfo.timestamp;
      
      let verificationHash = '';
      if (documentId) {
        console.log('Creating verification hash...');
        verificationHash = await SignatureVerificationUtil.createSignatureHash(
          signatureData.dataUrl,
          currentUser.id,
          timestamp,
          documentId
        );
        console.log('Verification hash created:', verificationHash);
      }

      // Save the signature to the database
      console.log('Preparing signature data for insertion:', {
        userId: currentUser.id,
        type: activeTab,
        value: signatureData.dataUrl,
        name: signatureData.type === 'typed' ? signatureData.dataUrl : null,
        verification_hash: verificationHash || null,
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        geolocation: clientInfo.geolocation,
      });

      const { data, error } = await supabase
        .from('signatures')
        .insert({
          user_id: currentUser.id,
          type: activeTab,
          value: signatureData.dataUrl,
          name: signatureData.type === 'typed' ? signatureData.dataUrl : null,
          verification_hash: verificationHash || null,
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          geolocation: clientInfo.geolocation,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting signature:', error);
        throw error;
      }

      console.log('Signature saved successfully:', {
        signatureId: data.id,
        userId: data.user_id,
        type: data.type,
      });

      // Log the signature event if document ID is provided
      if (documentId) {
        console.log('Creating audit log entry...');
        const { error: auditError } = await supabase.from('signature_audit_logs').insert({
          signature_id: data.id,
          document_id: documentId,
          event_type: 'signature_created',
          event_data: {
            type: activeTab,
          },
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          geolocation: clientInfo.geolocation,
        });

        if (auditError) {
          console.error('Error creating audit log:', auditError);
          throw auditError;
        }

        console.log('Audit log entry created successfully');
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
