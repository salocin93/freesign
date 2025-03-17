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
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'nicolasvonrosen@gmail.com'
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'FreeSign'

console.log("Hello from Functions!")

// Add custom error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class DatabaseError extends Error {
  originalError?: any
  constructor(message: string, originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
    this.originalError = originalError
  }
}

class EmailError extends Error {
  recipientEmail: string
  originalError?: any
  constructor(message: string, recipientEmail: string, originalError?: any) {
    super(message)
    this.name = 'EmailError'
    this.recipientEmail = recipientEmail
    this.originalError = originalError
  }
}

// Add input validation function
function validateInput(documentId: string, recipients: any[]) {
  if (!documentId || typeof documentId !== 'string') {
    throw new ValidationError('Invalid documentId: must be a non-empty string')
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new ValidationError('Invalid recipients: must be a non-empty array')
  }

  recipients.forEach((recipient, index) => {
    if (!recipient.name || typeof recipient.name !== 'string') {
      throw new ValidationError(`Invalid recipient name at index ${index}: must be a non-empty string`)
    }
    if (!recipient.email || typeof recipient.email !== 'string' || !recipient.email.includes('@')) {
      throw new ValidationError(`Invalid recipient email at index ${index}: must be a valid email address`)
    }
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validate request method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      details: 'Only POST requests are allowed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    // Validate environment variables
    if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new ValidationError('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new ValidationError('Invalid authorization header format')
    }

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError) {
      console.error('Auth error:', userError)
      throw new ValidationError(`Authentication failed: ${userError.message}`)
    }
    if (!user) {
      throw new ValidationError('User not found')
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      throw new ValidationError('Invalid JSON in request body')
    }

    const { documentId, recipients } = body
    validateInput(documentId, recipients)

    console.log('Processing request for document:', documentId)
    console.log('Recipients:', recipients)

    // Get the document details with error handling
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('name, created_by, status')
      .eq('id', documentId)
      .single()

    if (documentError) {
      console.error('Document fetch error:', documentError)
      throw new DatabaseError(`Failed to fetch document: ${documentError.message}`, documentError)
    }

    if (!document) {
      throw new DatabaseError(`Document not found with ID: ${documentId}`)
    }

    if (document.status === 'sent') {
      throw new ValidationError('Document has already been sent')
    }

    console.log('Found document:', document)

    // Get sender profile using Auth API
    const { data: sender, error: senderError } = await supabase.auth.admin.getUserById(document.created_by);

    if (senderError) {
      throw new DatabaseError('Failed to fetch sender profile', {
        code: senderError.status,
        message: senderError.message
      });
    }

    if (!sender) {
      throw new ValidationError('Sender not found');
    }

    const senderName = sender.user.user_metadata?.full_name || sender.user.email;

    // Update document status with error handling
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'sent' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Document update error:', updateError)
      throw new DatabaseError(`Failed to update document status: ${updateError.message}`, updateError)
    }

    // Process recipients with better error handling
    const results = await Promise.allSettled(
      recipients.map(async (recipient: { name: string; email: string; message?: string }) => {
        try {
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
            throw new DatabaseError(
              `Failed to create recipient: ${recipientError.message}`,
              recipientError
            )
          }

          // Generate and send email
          const emailContent = await generateSignatureRequestEmail(
            recipient.name,
            senderName,
            document.name,
            documentId,
            recipient.email,
            recipient.message
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
                email: SENDER_EMAIL,
                name: SENDER_NAME,
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
            throw new EmailError(
              `Failed to send email to ${recipient.email}: ${errorText}`,
              recipient.email,
              errorText
            )
          }

          return { recipient: recipient.email, status: 'success' }
        } catch (error: unknown) {
          console.error(`Error processing recipient ${recipient.email}:`, error)
          return { 
            recipient: recipient.email, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Check if any recipients failed
    const failedRecipients = results.filter(
      (result) => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.status === 'error')
    )

    if (failedRecipients.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Some recipients failed to process',
        details: {
          failedRecipients: failedRecipients.map(r => 
            r.status === 'rejected' ? { recipient: 'unknown', error: r.reason } : r.value
          )
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207, // Multi-Status
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'All signature requests sent successfully',
      details: {
        documentId,
        recipientCount: recipients.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Error:', error)
    
    // Determine appropriate status code based on error type
    let statusCode = 500
    let errorMessage = 'An unknown error occurred'
    let errorType = 'UnknownError'
    let errorDetails = 'No additional details available'

    if (error instanceof ValidationError) {
      statusCode = 400
      errorMessage = error.message
      errorType = error.name
      errorDetails = error.stack || errorDetails
    } else if (error instanceof DatabaseError) {
      statusCode = 503
      errorMessage = error.message
      errorType = error.name
      errorDetails = error.originalError ? JSON.stringify(error.originalError) : error.stack || errorDetails
    } else if (error instanceof EmailError) {
      statusCode = 502
      errorMessage = error.message
      errorType = error.name
      errorDetails = error.originalError ? JSON.stringify(error.originalError) : error.stack || errorDetails
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorType = error.name
      errorDetails = error.stack || errorDetails
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      type: errorType,
      details: errorDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
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
