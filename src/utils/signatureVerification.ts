
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { SignatureData, SignatureVerification } from './types';

export class SignatureVerification {
  // Create a hash of the signature data and metadata
  static async createSignatureHash(
    signatureData: string,
    userId: string,
    timestamp: string,
    documentId: string
  ): Promise<string> {
    const data = `${signatureData}${userId}${timestamp}${documentId}`;
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  // Verify the signature hasn't been tampered with
  static async verifySignature(
    signatureId: string,
    documentId: string
  ): Promise<boolean> {
    try {
      // Get the signature record from the database
      const { data: signature, error } = await supabase
        .from('signatures')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name
          )
        `)
        .eq('id', signatureId)
        .single();

      if (error || !signature) {
        throw new Error('Signature not found');
      }

      // Recreate the hash with the stored data
      const verificationHash = await this.createSignatureHash(
        signature.value,
        signature.user_id,
        signature.created_at,
        documentId
      );

      // Compare with stored hash
      return verificationHash === signature.verification_hash;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Get detailed verification info
  static async getVerificationInfo(
    signatureId: string,
    documentId: string
  ): Promise<SignatureVerification> {
    try {
      const { data: signature, error } = await supabase
        .from('signatures')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name
          )
        `)
        .eq('id', signatureId)
        .single();

      if (error || !signature) {
        throw new Error('Signature not found');
      }

      const isValid = await this.verifySignature(signatureId, documentId);

      return {
        isValid,
        timestamp: signature.created_at,
        signedBy: {
          name: signature.users.name,
          email: signature.users.email,
          userId: signature.users.id,
        },
        documentId,
        verificationHash: signature.verification_hash,
      };
    } catch (error) {
      console.error('Error getting verification info:', error);
      throw error;
    }
  }
}
