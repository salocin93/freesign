import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, recipients } = req.body;

    if (!documentId || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Get the user's session from the request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-signature-request', {
      body: { documentId, recipients },
      headers: {
        Authorization: authHeader,
      },
    });

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error sending signature request:', error);
    return res.status(500).json({ error: 'Failed to send signature request' });
  }
} 