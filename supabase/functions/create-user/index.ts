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
      console.error("[create-user] getUser failed:", userErr);
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

    const body = await req.json();
    const { email, name, role, department, access_type, access_expires_at } = body;

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email e nível de acesso são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (access_type === "temporary" && !access_expires_at) {
      return new Response(
        JSON.stringify({ error: "Acesso temporário requer data de expiração" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Caller's account_id + role check
    const { data: callerMember } = await adminClient
      .from("account_members")
      .select("account_id, role")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    if (!callerMember?.account_id) {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada para o usuário logado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedInviters = ["owner", "admin", "secretaria"];
    if (!allowedInviters.includes((callerMember.role || "").toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para convidar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountId = callerMember.account_id;

    // Owner limit: only one owner per account
    if (role === "owner") {
      const { count } = await adminClient
        .from("account_members")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId)
        .eq("role", "owner");
      if ((count ?? 0) >= 1) {
        return new Response(
          JSON.stringify({ error: "Já existe um proprietário nesta conta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if user already exists by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // SaaS invite flow → user receives email and sets own password
      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          data: name ? { full_name: name } : undefined,
        }
      );

      if (inviteErr || !invited?.user) {
        return new Response(
          JSON.stringify({ error: `Erro ao enviar convite: ${inviteErr?.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = invited.user.id;
    }

    // Already a member of this account?
    const { data: existingMember } = await adminClient
      .from("account_members")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      const { error: updateErr } = await adminClient
        .from("account_members")
        .update({
          role,
          department: department || null,
          access_type: access_type || "permanent",
          access_expires_at: access_expires_at || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMember.id);

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar: ${updateErr.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Usuário já era membro — acesso atualizado", user_id: userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertErr } = await adminClient
      .from("account_members")
      .insert({
        account_id: accountId,
        user_id: userId,
        role,
        department: department || null,
        access_type: access_type || "permanent",
        access_expires_at: access_expires_at || null,
        invited_by: callerId,
      });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: `Erro ao inserir membro: ${insertErr.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Best-effort: update profile name
    if (name) {
      await adminClient.from("profiles").update({ full_name: name }).eq("id", userId);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Convite enviado com sucesso", user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
