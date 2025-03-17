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

  // Use a simpler template path
  const templatePath = './_shared/templates/signature-request.html';
  console.log('Reading template from:', templatePath);
  
  try {
    // First try to read the template file
    let template: string;
    try {
      template = await Deno.readTextFile(templatePath);
      console.log('Template read successfully, length:', template.length);
    } catch (readError) {
      console.error('Failed to read template file:', readError);
      // Fallback to inline template if file read fails
      template = `
<!DOCTYPE html>
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
      <img src="{{logo_url}}" alt="FreeSign" class="logo">
      <h1>Document Ready for Signature</h1>
    </div>

    <p>Hello {{recipient_name}},</p>

    <p>{{sender_name}} has sent you a document to sign: <strong>{{document_name}}</strong></p>

    {{#if message}}
    <div class="message-box">
      <p style="margin-top: 0;">Message from sender:</p>
      <blockquote style="margin: 0; font-style: italic;">{{message}}</blockquote>
    </div>
    {{/if}}

    <p>Click the button below to review and sign the document:</p>

    <div style="text-align: center;">
      <a href="{{signing_url}}" class="button">Review & Sign Document</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p class="link">{{signing_url}}</p>

    <div class="footer">
      <p>This email was sent via FreeSign. If you did not expect to receive this email, please ignore it or contact support.</p>
    </div>
  </div>
</body>
</html>`;
      console.log('Using fallback template');
    }
    
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