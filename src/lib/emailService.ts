import { supabase } from './supabase';
import { Recipient } from '@/utils/types';

export async function sendDocumentForSignature(
  documentId: string,
  recipients: Recipient[],
  message: string
) {
  try {
    // First update document status
    const { error: documentError } = await supabase
      .from('documents')
      .update({ status: 'sent' })
      .eq('id', documentId);

    if (documentError) throw documentError;

    // Update recipients status
    for (const recipient of recipients) {
      const { error: recipientError } = await supabase
        .from('recipients')
        .update({ status: 'pending' })
        .eq('id', recipient.id);

      if (recipientError) throw recipientError;

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session');

      // Call email sending edge function with auth token
      const { error: emailError } = await supabase.functions.invoke('send-signature-request', {
        body: {
          documentId,
          recipient: {
            name: recipient.name,
            email: recipient.email
          },
          message
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (emailError) throw emailError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending document for signature:', error);
    throw error;
  }
} 