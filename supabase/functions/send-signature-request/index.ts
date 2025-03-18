/**
 * Send Signature Request Edge Function
 * 
 * This Supabase Edge Function handles sending signature request emails
 * to recipients of a document, using SendGrid Dynamic Templates and secure tokens.
 * 
 * Features:
 * - Authenticates the request via Supabase Auth
 * - Generates unique access tokens for each recipient
 * - Checks for existing recipients (avoids duplicates)
 * - Updates existing recipient rows with access tokens
 * - Sends transactional emails using SendGrid dynamic templates (token included)
 * - Provides robust error handling and detailed status responses
 * 
 * Requirements:
 * - Supabase project with `documents` and `recipients` tables
 * - `recipients` table has `access_token` (TEXT) and optional `token_expiry` (TIMESTAMP) columns
 * - SendGrid account with a dynamic template created
 * 
 * Environment Variables Required:
 * - SENDGRID_API_KEY: API key for SendGrid (with Mail Send permission)
 * - SENDGRID_TEMPLATE_ID: ID of the dynamic template in SendGrid
 * - SUPABASE_URL: URL of your Supabase instance
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for Supabase
 * - APP_URL: Base URL of the application (used for signing links & logo)
 * - SENDER_EMAIL: Email address shown in the "From" field
 * - SENDER_NAME: Name shown in the "From" field
 * 
 * Input (POST request body):
 * {
 *   "documentId": "string (UUID)",
 *   "recipients": [
 *     {
 *       "name": "Recipient Name",
 *       "email": "recipient@example.com",
 *       "message": "Optional message"
 *     },
 *     ...
 *   ]
 * }
 * 
 * Output:
 * - 200 OK: All signature requests sent successfully
 * - 207 Multi-Status: Some emails failed (details provided)
 * - 400/405/500: Validation, method, or server errors
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ''
const SENDGRID_TEMPLATE_ID = Deno.env.get('SENDGRID_TEMPLATE_ID') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || ''
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'nicolasvonrosen@gmail.com'
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'FreeSign'

console.log("Send Signature Request Function Initialized")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    if (!SENDGRID_API_KEY || !SENDGRID_TEMPLATE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APP_URL) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header provided')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Authentication failed')

    const { documentId, recipients } = await req.json()
    if (!documentId || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Invalid input: documentId and recipients are required')
    }

    console.log(`Processing signature request for document: ${documentId}`)

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('name, created_by, status')
      .eq('id', documentId)
      .single()

    if (docError || !document) throw new Error(`Document not found or error: ${docError?.message || 'No data'}`)
    if (document.status === 'sent') throw new Error('Document has already been sent')

    const { data: senderData } = await supabase.auth.admin.getUserById(document.created_by)
    const senderName = senderData?.user.user_metadata?.full_name || senderData?.user.email || SENDER_NAME

    await supabase.from('documents').update({ status: 'sent' }).eq('id', documentId)

    const results = await Promise.allSettled(
      recipients.map(async (recipient: { name: string; email: string; message?: string }) => {
        try {
          console.log(`Processing recipient: ${recipient.email}`)

          // Generate secure token
          const accessToken = crypto.randomUUID()

          // Check if recipient already exists
          const { data: existingRecipient, error: recipientFetchError } = await supabase
            .from('recipients')
            .select('id')
            .eq('document_id', documentId)
            .eq('email', recipient.email)
            .maybeSingle();

          if (recipientFetchError) throw new Error(`Error checking recipient: ${recipientFetchError.message}`)

          if (existingRecipient) {
            // Update existing recipient with token
            const { error: updateError } = await supabase
              .from('recipients')
              .update({
                access_token: accessToken,
                status: 'pending',
                token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // optional expiry
              })
              .eq('id', existingRecipient.id);

            if (updateError) throw new Error(`Failed to update recipient: ${updateError.message}`);
            console.log(`Updated recipient ${recipient.email}`);
          } else {
            // Insert new recipient (fallback)
            const { error: insertError } = await supabase
              .from('recipients')
              .insert({
                document_id: documentId,
                name: recipient.name,
                email: recipient.email,
                status: 'pending',
                access_token: accessToken,
                token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              });

            if (insertError) throw new Error(`Failed to insert recipient: ${insertError.message}`);
            console.log(`Inserted new recipient ${recipient.email}`);
          }

          const signingUrl = `${APP_URL}/sign/${documentId}?token=${accessToken}`
          const logoUrl = `${APP_URL}/logo.png`

          const sendGridPayload = {
            personalizations: [{
              to: [{ email: recipient.email }],
              dynamic_template_data: {
                recipient_name: recipient.name,
                sender_name: senderName,
                document_name: document.name,
                signing_url: signingUrl,
                logo_url: logoUrl,
                message: recipient.message || '',
                document_id: documentId,
                access_token: accessToken
              }
            }],
            from: { email: SENDER_EMAIL, name: SENDER_NAME },
            template_id: SENDGRID_TEMPLATE_ID
          }

          const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(sendGridPayload)
          })

          if (!response.ok) {
            const errText = await response.text()
            console.error(`SendGrid Error: ${errText}`)
            throw new Error(`Failed to send email to ${recipient.email}`)
          }

          console.log(`Email sent successfully to: ${recipient.email}`)
          return { recipient: recipient.email, status: 'success' }

        } catch (error) {
          console.error(`Error with recipient ${recipient.email}:`, error)
          return { recipient: recipient.email, status: 'error', error: error.message }
        }
      })
    )

    const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'error')
    if (failed.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Some emails failed',
        failedRecipients: failed.map(f => f.value)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'All signature requests sent successfully',
      documentId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
