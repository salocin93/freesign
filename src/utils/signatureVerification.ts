import { supabase } from '@/lib/supabase';
import { SignatureVerification as SignatureVerificationType } from './types';

export class SignatureVerificationUtil {
  // Create a hash of the signature data and metadata
  static async createSignatureHash(
    signatureData: string,
    userId: string,
    timestamp: string,
    documentId: string
  ): Promise<string> {
    const data = `${signatureData}${userId}${timestamp}${documentId}`;
    
    // Convert the string to bytes
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Create SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
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
  ): Promise<SignatureVerificationType> {
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

