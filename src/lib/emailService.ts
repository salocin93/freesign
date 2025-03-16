/**
 * Email Service Module
 * 
 * This module provides functionality for sending email notifications and signature requests
 * through the application's email service infrastructure. It integrates with Supabase Edge
 * Functions to handle email delivery.
 * 
 * Features:
 * - Signature request emails
 * - Authentication integration
 * - Error handling and logging
 * 
 * @module EmailService
 */

import { supabase } from './supabase';

/**
 * Interface defining the structure of a recipient
 */
export interface Recipient {
  email: string;
  name?: string;
}

/**
 * Sends a signature request email to specified recipients for a document.
 * This function invokes a Supabase Edge Function that handles the actual email delivery.
 * 
 * @param documentId - The ID of the document to be signed
 * @param recipients - Array of recipients who should receive the signature request
 * @returns A Promise resolving to the response data from the email service
 * @throws {Error} If there's no active session or if the email service fails
 * 
 * @example
 * ```typescript
 * const recipients = [
 *   { email: 'john@example.com', name: 'John Doe' },
 *   { email: 'jane@example.com', name: 'Jane Smith' }
 * ];
 * 
 * try {
 *   await sendSignatureRequest('doc123', recipients);
 *   console.log('Signature requests sent successfully');
 * } catch (error) {
 *   console.error('Failed to send signature requests:', error);
 * }
 * ```
 */
export async function sendSignatureRequest(documentId: string, recipients: Recipient[]) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase.functions.invoke('send-signature-request', {
      body: { documentId, recipients },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending signature request:', error);
    throw error;
  }
} 