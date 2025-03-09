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
          },
        ],
        from: {
          email: sender.email,
          name: sender.full_name,
        },
        subject: `${sender.full_name} has sent you a document to sign: ${document.name}`,
        content: [
          {
            type: 'text/html',
            value: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Ready for Signature</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    h1 {
      color: #0284c7;
      font-size: 24px;
      margin-bottom: 30px;
    }
    .message-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .button {
      background-color: #0284c7;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      font-weight: 500;
      text-align: center;
      margin: 30px 0;
    }
    .button:hover {
      background-color: #0369a1;
    }
    .link {
      color: #666;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Document Ready for Signature</h1>
    </div>

    <p>Hello ${recipient.name},</p>

    <p>${sender.full_name} has sent you a document to sign: <strong>${document.name}</strong></p>

    ${message ? `
    <div class="message-box">
      <p style="margin-top: 0;">Message from sender:</p>
      <blockquote style="margin: 0; font-style: italic;">${message}</blockquote>
    </div>
    ` : ''}

    <p>Click the button below to review and sign the document:</p>

    <div style="text-align: center;">
      <a href="${signingUrl}" class="button" style="color: white; text-decoration: none;">Review & Sign Document</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p class="link">${signingUrl}</p>

    <div class="footer">
      <p>This email was sent via FreeSign. If you did not expect to receive this email, please ignore it or contact support.</p>
    </div>
  </div>
</body>
</html>`
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
