export function generateSignatureRequestEmail(
  recipientName: string,
  senderName: string,
  documentName: string,
  documentId: string,
  recipientEmail: string
) {
  const APP_URL = Deno.env.get('APP_URL') || '';
  const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipientEmail)}`;

  return {
    subject: `${senderName} has requested your signature`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Signature Request</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0066cc;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h2>Hello ${recipientName},</h2>
          <p>${senderName} has requested your signature on the document "${documentName}".</p>
          <p>Please click the button below to review and sign the document:</p>
          <a href="${signingUrl}" class="button">Review & Sign Document</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${signingUrl}</p>
          <div class="footer">
            <p>This is an automated message from FreeSign. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${recipientName},

${senderName} has requested your signature on the document "${documentName}".

Please visit the following link to review and sign the document:
${signingUrl}

This is an automated message from FreeSign. Please do not reply to this email.
    `.trim()
  };
} 