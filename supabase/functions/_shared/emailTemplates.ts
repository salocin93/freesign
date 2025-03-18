import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { recipientEmail, recipientName, senderName, documentName, documentId, message } = await req.json();

  const APP_URL = Deno.env.get('APP_URL') || '';
  const signingUrl = `${APP_URL}/sign/${documentId}?recipient=${encodeURIComponent(recipientEmail)}`;
  const logoUrl = `${APP_URL}/logo.png`;

  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
  const TEMPLATE_ID = Deno.env.get("SENDGRID_TEMPLATE_ID")!;

  const emailPayload = {
    personalizations: [{
      to: [{ email: recipientEmail }],
      dynamic_template_data: {
        recipient_name: recipientName,
        sender_name: senderName,
        document_name: documentName,
        signing_url: signingUrl,
        logo_url: logoUrl,
        message: message
      }
    }],
    from: { email: "nicolasvonrosen@gmail.com", name: "FreeSign" },
    template_id: TEMPLATE_ID
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(emailPayload)
  });

  if (response.status === 202) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } else {
    const error = await response.text();
    console.error("SendGrid Error:", error);
    return new Response(JSON.stringify({ success: false, error }), { status: 500 });
  }
});
