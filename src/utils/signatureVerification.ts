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
 * Signature Verification Utility
 * 
 * This utility class provides methods for creating and verifying signature hashes
 * to ensure the integrity and authenticity of digital signatures.
 * 
 * The verification process uses a combination of:
 * - Signature data (base64 encoded image or text)
 * - User/Recipient ID
 * - Timestamp
 * - Document ID
 * 
 * This creates a unique hash that can be used to verify:
 * 1. The signature was created by the correct user
 * 2. The signature was created at a specific time
 * 3. The signature was created for a specific document
 * 4. The signature data hasn't been tampered with
 * 
 * @class SignatureVerificationUtil
 */
export class SignatureVerificationUtil {
  /**
   * Creates a verification hash for a signature
   * 
   * @param signatureData - The base64 encoded signature data (image or text)
   * @param userId - The ID of the user/recipient creating the signature
   * @param timestamp - The ISO timestamp when the signature was created
   * @param documentId - The ID of the document being signed
   * @returns A promise that resolves to the verification hash
   * 
   * @example
   * ```typescript
   * const hash = await SignatureVerificationUtil.createSignatureHash(
   *   signatureData,
   *   userId,
   *   timestamp,
   *   documentId
   * );
   * ```
   */
  static async createSignatureHash(
    signatureData: string,
    userId: string,
    timestamp: string,
    documentId: string
  ): Promise<string> {
    // Combine all data in a specific order for consistent hashing
    const dataToHash = `${signatureData}|${userId}|${timestamp}|${documentId}`;
    
    console.log('Creating signature hash with data:', {
      signatureDataLength: signatureData.length,
      userId,
      timestamp,
      documentId,
      combinedDataLength: dataToHash.length,
    });

    // Create SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Generated verification hash:', hashHex);
    return hashHex;
  }

  /**
   * Verifies a signature hash
   * 
   * @param signatureData - The base64 encoded signature data
   * @param userId - The ID of the user/recipient
   * @param timestamp - The ISO timestamp
   * @param documentId - The ID of the document
   * @param expectedHash - The hash to verify against
   * @returns A promise that resolves to true if the hash matches
   * 
   * @example
   * ```typescript
   * const isValid = await SignatureVerificationUtil.verifySignatureHash(
   *   signatureData,
   *   userId,
   *   timestamp,
   *   documentId,
   *   expectedHash
   * );
   * ```
   */
  static async verifySignatureHash(
    signatureData: string,
    userId: string,
    timestamp: string,
    documentId: string,
    expectedHash: string
  ): Promise<boolean> {
    const calculatedHash = await this.createSignatureHash(
      signatureData,
      userId,
      timestamp,
      documentId
    );

    console.log('Verifying signature hash:', {
      calculatedHash,
      expectedHash,
      matches: calculatedHash === expectedHash,
    });

    return calculatedHash === expectedHash;
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

