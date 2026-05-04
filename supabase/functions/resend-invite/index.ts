import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const callerId = userData.user.id;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Permission check: only owner/admin/secretaria/superadmin can resend
    const { data: callerMember } = await adminClient
      .from("account_members")
      .select("role")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    let callerRole = (callerMember?.role || "").toLowerCase();
    if (!["owner", "admin", "secretaria", "superadmin"].includes(callerRole)) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", callerId)
        .maybeSingle();
      if (profile?.role && ["superadmin", "admin"].includes(profile.role)) {
        callerRole = profile.role;
      }
    }

    if (!["owner", "admin", "secretaria", "superadmin"].includes(callerRole)) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para reenviar convites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build redirect URL pointing to the accept-invite page
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const redirectBase = origin.match(/^https?:\/\/[^/]+/)?.[0] || "";
    const redirectTo = redirectBase ? `${redirectBase}/aceitar-convite` : undefined;
    console.log("[resend-invite] redirectTo:", redirectTo);

    // Try to re-send the invite email (works for users who haven't completed signup)
    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    );

    if (!inviteErr) {
      return new Response(
        JSON.stringify({ success: true, message: "Convite reenviado com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: user already confirmed → send a recovery (password reset) link
    console.warn("[resend-invite] invite failed, falling back to recovery:", inviteErr.message);
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      console.error("[resend-invite] generateLink failed:", linkErr);
      return new Response(
        JSON.stringify({ error: `Erro ao reenviar: ${linkErr.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Convite reenviado com sucesso",
        action_link: linkData?.properties?.action_link || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
