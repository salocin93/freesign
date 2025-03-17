/**
 * Send Signature Request Edge Function
 * 
 * This Supabase Edge Function handles the sending of signature request emails to document recipients.
 * It integrates with SendGrid for email delivery and manages the email templating and sending process.
 * 
 * Features:
 * - SendGrid integration for reliable email delivery
 * - Email template rendering with recipient data
 * - CORS handling for cross-origin requests
 * - Authentication and authorization checks
 * - Error handling and logging
 * 
 * Environment Variables Required:
 * - SENDGRID_API_KEY: API key for SendGrid service
 * - SUPABASE_URL: URL of the Supabase instance
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for Supabase
 * - APP_URL: Base URL of the application
 * 
 * @module SendSignatureRequest
 */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @deno-types="https://esm.sh/@supabase/supabase-js@2.38.4"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { generateSignatureRequestEmail } from '../_shared/emailTemplates.ts'

// Environment variables for configuration
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || ''

console.log("Hello from Functions!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '')

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Invalid authorization token')
    }

    // Get the request body
    const { documentId, recipients } = await req.json()
    if (!documentId || !recipients || !Array.isArray(recipients)) {
      throw new Error('Invalid request body')
    }

    // Get the document details
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('name, user_id')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      throw new Error('Document not found')
    }

    // Get the sender's name
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', document.user_id)
      .single()

    if (senderError || !sender) {
      throw new Error('Sender not found')
    }

    // Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'sent' })
      .eq('id', documentId)

    if (updateError) {
      throw new Error('Failed to update document status')
    }

    // Create recipients in the database and send emails
    const recipientPromises = recipients.map(async (recipient: { name: string; email: string }) => {
      // Create recipient in the database
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipients')
        .insert({
          document_id: documentId,
          name: recipient.name,
          email: recipient.email,
          status: 'pending'
        })
        .select()
        .single()

      if (recipientError) {
        throw new Error(`Failed to create recipient: ${recipientError.message}`)
      }

      // Generate and send email
      const emailContent = generateSignatureRequestEmail(
        recipient.name,
        sender.full_name,
        document.name,
        documentId,
        recipient.email
      )

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
            },
          ],
          from: {
            email: 'noreply@freesign.app',
            name: 'FreeSign',
          },
          subject: emailContent.subject,
          content: [
            {
              type: 'text/plain',
              value: emailContent.text,
            },
            {
              type: 'text/html',
              value: emailContent.html,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SendGrid API error:', errorText)
        throw new Error(`Failed to send email to ${recipient.email}`)
      }

      return response
    })

    await Promise.all(recipientPromises)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack || 'No additional details available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
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
