// @deno-types="https://deno.land/std@0.168.0/types/index.d.ts"
import { Handlebars } from "https://deno.land/x/handlebars@v0.10.0/mod.ts";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";

export async function generateSignatureRequestEmail(
  recipientName: string,
  senderName: string,
  documentName: string,
  documentId: string,
  recipientEmail: string,
  message?: string
) {
  const APP_URL = Deno.env.get('APP_URL') || '';
  const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipientEmail)}`;
  const logoUrl = `${APP_URL}/logo.png`; // Add your logo URL

  const templatePath = join(Deno.cwd(), '_shared', 'templates', 'signature-request.html');
  console.log('Reading template from:', templatePath);
  
  try {
    const template = await Deno.readTextFile(templatePath);
    console.log('Template read successfully');
    
    const handlebars = new Handlebars();
    const compiledTemplate = handlebars.compile(template);
    console.log('Template compiled successfully');

    const html = compiledTemplate({
      recipient_name: recipientName,
      sender_name: senderName,
      document_name: documentName,
      signing_url: signingUrl,
      logo_url: logoUrl,
      message: message
    });
    console.log('Template rendered successfully');

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
    throw error;
  }
} 