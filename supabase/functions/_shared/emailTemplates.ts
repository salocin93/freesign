import { Handlebars } from "https://deno.land/x/handlebars@v0.10.0/mod.ts";
import { signatureRequestTemplate } from './templates/signature-request.ts';

export async function generateSignatureRequestEmail(
  recipientName: string,
  senderName: string,
  documentName: string,
  documentId: string,
  recipientEmail: string,
  message?: string
) {
  const APP_URL = Deno.env.get('APP_URL') || '';
  console.log('APP_URL:', APP_URL);
  
  const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipientEmail)}`;
  const logoUrl = `${APP_URL}/logo.png`;
  
  console.log('Generated URLs:', {
    signingUrl,
    logoUrl
  });

  try {
    console.log('Using external HTML template (preprocessed)');

    const handlebars = new Handlebars();

    const templateData = {
      recipient_name: recipientName,
      sender_name: senderName,
      document_name: documentName,
      signing_url: signingUrl,
      logo_url: logoUrl,
      message: message
    };
    console.log('Template data:', templateData);

    // Render template with data
    const html = await handlebars.renderTemplate(signatureRequestTemplate, templateData);
    console.log('Template rendered successfully, HTML length:', html.length);

    return {
      subject: `${senderName} has requested your signature`,
      html,
      text: `
Hello ${recipientName},

${senderName} has requested your signature on the document "${documentName}".

Please visit the following link to review and sign the document:
${signingUrl}

This is an automated message from FreeSign. Please do not reply to this email.
      `.trim()
    };
  } catch (error) {
    console.error('Error generating email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
