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
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const APP_URL = Deno.env.get('APP_URL')

    if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !APP_URL) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Get request body
    const { documentId, recipient, message } = await req.json()

    if (!documentId || !recipient || !recipient.email || !recipient.name) {
      throw new Error('Missing required fields')
    }

    // Get document details
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('name, created_by')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      throw new Error('Document not found')
    }

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', document.created_by)
      .single()

    if (senderError || !sender) {
      throw new Error('Sender not found')
    }

    // Generate signing URL
    const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipient.email)}`

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
            dynamic_template_data: {
              sender_name: sender.full_name,
              document_name: document.name,
              recipient_name: recipient.name,
              message: message,
              signing_url: signingUrl,
            },
          },
        ],
        from: {
          email: sender.email,
          name: sender.full_name,
        },
        template_id: Deno.env.get('SENDGRID_TEMPLATE_ID'),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`SendGrid API error: ${JSON.stringify(error)}`)
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
      JSON.stringify({ error: error.message }),
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
