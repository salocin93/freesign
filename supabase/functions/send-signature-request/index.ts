// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const APP_URL = Deno.env.get('APP_URL')

    if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !APP_URL) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client with auth context
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Get request body
    const { documentId, recipient, message } = await req.json()
    console.log('Request payload:', { documentId, recipient, message })

    if (!documentId || !recipient || !recipient.email || !recipient.name) {
      throw new Error('Missing required fields')
    }

    // Get document details
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('name, created_by')
      .eq('id', documentId)
      .single()

    if (documentError) {
      console.error('Document fetch error:', documentError)
      throw new Error('Document not found')
    }

    if (!document) {
      throw new Error('Document not found')
    }

    // Get sender details
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      console.error('User fetch error:', userError);
      throw new Error('Sender not found');
    }

    const sender = {
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    };

    if (!sender.email) {
      throw new Error('Sender email not found');
    }

    // Generate signing URL
    const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipient.email)}`

    console.log('Sending email with data:', {
      to: recipient.email,
      from: sender.email,
      documentName: document.name,
      signingUrl
    })

    // Send email using SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: recipient.email, name: recipient.name }],
            subject: `${sender.full_name} has sent you a document to sign: ${document.name}`,
            dynamic_template_data: {
              sender_name: sender.full_name,
              document_name: document.name,
              recipient_name: recipient.name,
              message: message || '',
              signing_url: signingUrl,
            },
          },
        ],
        from: {
          email: sender.email,
          name: sender.full_name,
        },
        template_id: Deno.env.get('SENDGRID_TEMPLATE_ID') || '',
        subject: `${sender.full_name} has sent you a document to sign: ${document.name}`,
        content: [
          {
            type: 'text/plain',
            value: `${sender.full_name} has sent you a document to sign: ${document.name}\n\n` +
                   `${message ? `Message: ${message}\n\n` : ''}` +
                   `Click here to sign: ${signingUrl}`
          },
          {
            type: 'text/html',
            value: `<p>${sender.full_name} has sent you a document to sign: ${document.name}</p>` +
                   `${message ? `<p>Message: ${message}</p>` : ''}` +
                   `<p><a href="${signingUrl}">Click here to sign</a></p>`
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('SendGrid API error:', errorData)
      throw new Error(`SendGrid API error: ${JSON.stringify(errorData)}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error.message)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-signature-request' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
