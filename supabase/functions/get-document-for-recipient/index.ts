import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { documentId, token } = await req.json();

    console.log("Incoming request:");
    console.log("Document ID:", documentId);
    console.log("Token:", token);

    if (!documentId || !token) {
      console.error("Missing documentId or token");
      return new Response(JSON.stringify({ error: "Missing documentId or token" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // DEBUG: Query the recipient table to see if token exists
    const { data: tokenRecipient, error: tokenError } = await supabase
      .from('recipients')
      .select('id, name, email, document_id, access_token')
      .eq('access_token', token)
      .maybeSingle();

    console.log("Token recipient check:", tokenRecipient, tokenError);

    if (!tokenRecipient) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    // Fetch document + check recipient token match
    const { data, error } = await supabase
      .from("documents")
      .select(`
        id, name, status, storage_path,
        recipients!inner ( id, name, email, status, access_token, token_expiry ),
        signing_elements ( id, type, position, size, value, required, recipient_id, label )
      `)
      .match({ id: documentId, "recipients.access_token": token })
      .maybeSingle();

    console.log("Document fetch result:", data, error);

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid token or document not found" }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    // Optional: Check expiry
    const recipient = data.recipients.find(r => r.access_token === token);
    if (recipient.token_expiry && new Date(recipient.token_expiry) < new Date()) {
      console.error("Token expired");
      return new Response(JSON.stringify({ error: "Token expired" }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    console.log("Returning document...");
    return new Response(JSON.stringify({ document: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
