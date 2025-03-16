/**
 * Signature Verification Utility Module
 * 
 * This module provides functionality for creating and verifying digital signatures
 * in the document signing workflow. It implements cryptographic hashing and verification
 * to ensure the integrity and authenticity of signatures.
 * 
 * Features:
 * - Cryptographic hash generation using SHA-256
 * - Signature verification against stored hashes
 * - Database integration for signature storage and retrieval
 * - User information tracking for audit purposes
 * 
 * @module SignatureVerification
 */

import { supabase } from '@/lib/supabase';
import { SignatureVerification as SignatureVerificationType } from './types';

/**
 * Utility class for handling signature verification operations.
 * Provides methods for creating and verifying digital signatures.
 */
export class SignatureVerificationUtil {
  /**
   * Creates a cryptographic hash of the signature data and associated metadata.
   * This hash is used to verify the integrity of the signature later.
   * 
   * @param signatureData - The actual signature data (usually a base64 encoded string)
   * @param userId - The ID of the user who created the signature
   * @param timestamp - The timestamp when the signature was created
   * @param documentId - The ID of the document being signed
   * @returns A Promise resolving to a hex-encoded SHA-256 hash string
   * 
   * @example
   * ```typescript
   * const hash = await SignatureVerificationUtil.createSignatureHash(
   *   signatureData,
   *   'user123',
   *   '2024-03-15T12:34:56Z',
   *   'doc456'
   * );
   * ```
   */
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

  /**
   * Verifies the integrity of a signature by comparing its stored hash
   * with a newly generated hash of the same data.
   * 
   * @param signatureId - The ID of the signature to verify
   * @param documentId - The ID of the document the signature belongs to
   * @returns A Promise resolving to a boolean indicating if the signature is valid
   * 
   * @throws {Error} If the signature record cannot be found
   * 
   * @example
   * ```typescript
   * const isValid = await SignatureVerificationUtil.verifySignature(
   *   'sig789',
   *   'doc456'
   * );
   * if (isValid) {
   *   console.log('Signature is valid');
   * }
   * ```
   */
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

