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

    if (!documentId || !token) {
      return new Response(JSON.stringify({ error: "Missing documentId or token" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch document + check if recipient token is valid
    const { data, error } = await supabase
      .from("documents")
      .select(`
        id, name, status,
        recipients!inner ( id, name, email, status, access_token, token_expiry ),
        signing_elements ( id, type, position, size, value, required, recipient_id, label )
      `)
      .eq("id", documentId)
      .eq("recipients.access_token", token)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid token or document not found" }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    // Optional: Check expiry
    const recipient = data.recipients.find(r => r.access_token === token);
    if (recipient.token_expiry && new Date(recipient.token_expiry) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    return new Response(JSON.stringify({ document: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
