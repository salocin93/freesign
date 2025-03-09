import { supabase } from './supabase';

interface Recipient {
  name: string;
  email: string;
}

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