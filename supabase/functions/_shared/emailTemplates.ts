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
  console.log('APP_URL:', APP_URL);
  
  const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipientEmail)}`;
  const logoUrl = `${APP_URL}/logo.png`;
  
  console.log('Generated URLs:', {
    signingUrl,
    logoUrl
  });

  // Use absolute path from the edge function root
  const templatePath = join(Deno.cwd(), '_shared', 'templates', 'signature-request.html');
  console.log('Reading template from:', templatePath);
  
  try {
    const template = await Deno.readTextFile(templatePath);
    console.log('Template read successfully, length:', template.length);
    
    const handlebars = new Handlebars();
    const compiledTemplate = handlebars.compile(template);
    console.log('Template compiled successfully');

    const templateData = {
      recipient_name: recipientName,
      sender_name: senderName,
      document_name: documentName,
      signing_url: signingUrl,
      logo_url: logoUrl,
      message: message
    };
    console.log('Template data:', templateData);

    const html = compiledTemplate(templateData);
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
      stack: error.stack,
      cwd: Deno.cwd(),
      files: await Deno.readDir(Deno.cwd())
    });
    throw error;
  }
} 