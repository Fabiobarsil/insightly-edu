import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_ROLES = ["owner", "admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { member_id, role, department, access_type, access_expires_at } = body ?? {};

    if (!member_id || !role) {
      return new Response(JSON.stringify({ error: "member_id e role são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Caller's account + role
    const { data: caller, error: callerErr } = await adminClient
      .from("account_members")
      .select("account_id, role")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Caller sem account_member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Superadmin bypass
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_superadmin")
      .eq("id", callerId)
      .maybeSingle();

    const isSuper = profile?.is_superadmin === true;

    if (!isSuper && !ADMIN_ROLES.includes(caller.role)) {
      return new Response(
        JSON.stringify({ error: "Apenas owner/admin podem alterar acessos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Target row
    const { data: target, error: targetErr } = await adminClient
      .from("account_members")
      .select("id, account_id")
      .eq("id", member_id)
      .maybeSingle();

    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: "Membro não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isSuper && target.account_id !== caller.account_id) {
      return new Response(JSON.stringify({ error: "Membro de outra conta" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: Record<string, unknown> = {
      role,
      department: department ?? null,
      access_type: access_type ?? "permanent",
      access_expires_at: access_type === "temporary" ? access_expires_at ?? null : null,
    };

    const { data: updated, error: updateErr } = await adminClient
      .from("account_members")
      .update(payload)
      .eq("id", member_id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ member: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
