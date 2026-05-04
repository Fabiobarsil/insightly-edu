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

    let body: any = {};
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("[create-user] invalid JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Body inválido. Envie JSON com email, name, role." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { email, name, full_name, role, department, access_type, access_expires_at } = body;
    const userName = name || full_name || null;
    console.log("[create-user] payload:", { email, name, role, department, access_type });

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
    const { data: callerMember, error: callerErr } = await adminClient
      .from("account_members")
      .select("account_id, role")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();
    console.log("[create-user] callerMember:", callerMember, "err:", callerErr);

    let accountId = callerMember?.account_id as string | undefined;
    let callerRole = (callerMember?.role || "").toLowerCase();

    // Fallback: superadmin/admin via profiles
    if (!callerRole || !accountId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", callerId)
        .maybeSingle();
      console.log("[create-user] profile fallback:", profile);
      if (profile?.role && ["superadmin", "admin"].includes(profile.role)) {
        callerRole = callerRole || profile.role;
      }
    }

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada para o usuário logado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedInviters = ["owner", "admin", "secretaria", "superadmin"];
    if (!allowedInviters.includes(callerRole)) {
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para convidar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    let inviteWarning: string | null = null;

    if (existingUser) {
      userId = existingUser.id;
      console.log("[create-user] user already exists:", userId);
    } else {
      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        { data: name ? { full_name: name } : undefined }
      );

      if (invited?.user) {
        userId = invited.user.id;
        console.log("[create-user] invited new user:", userId);
      } else {
        console.warn("[create-user] inviteUserByEmail failed:", inviteErr?.message);
        // Fallback: create user with temp password (no email needed)
        const tempPassword = crypto.randomUUID() + "Aa1!";
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: name ? { full_name: name } : undefined,
        });
        if (createErr || !created?.user) {
          console.error("[create-user] createUser fallback failed:", createErr);
          return new Response(
            JSON.stringify({ error: `Erro ao criar usuário: ${createErr?.message || inviteErr?.message || "desconhecido"}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = created.user.id;
        inviteWarning = "Usuário criado. O envio do e-mail falhou — peça para o usuário usar 'Esqueci a senha' na tela de login.";
      }
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
      console.error("[create-user] insert account_members failed:", insertErr);
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
      JSON.stringify({
        success: true,
        message: inviteWarning || "Convite enviado com sucesso",
        warning: inviteWarning,
        user_id: userId,
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
