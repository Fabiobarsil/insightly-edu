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

    // Verify caller
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const callerId = claimsData.claims.sub as string;

    // Admin client for user creation
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { email, role, access_type, access_expires_at } = body;

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email e role são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (access_type === "temporary" && !access_expires_at) {
      return new Response(
        JSON.stringify({ error: "Acesso temporário requer data de expiração" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's account_id
    const { data: callerMember } = await adminClient
      .from("account_members")
      .select("account_id")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    if (!callerMember?.account_id) {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada para o usuário logado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountId = callerMember.account_id;

    // Admin limit check
    if (role === "admin") {
      const { count } = await adminClient
        .from("account_members")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId)
        .eq("role", "admin");

      if ((count ?? 0) >= 3) {
        return new Response(
          JSON.stringify({ error: "Limite de 3 administradores atingido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create or get user in auth
    let userId: string;

    // Check if user already exists by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new auth user with random password
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createErr || !newUser?.user) {
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário: ${createErr?.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = newUser.user.id;
    }

    // Check if already a member of account
    const { data: existingMember } = await adminClient
      .from("account_members")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      // Update existing
      const { error: updateErr } = await adminClient
        .from("account_members")
        .update({
          role,
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
        JSON.stringify({ success: true, message: "Usuário atualizado (já existia)", user_id: userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new member
    const { error: insertErr } = await adminClient
      .from("account_members")
      .insert({
        account_id: accountId,
        user_id: userId,
        role,
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

    return new Response(
      JSON.stringify({ success: true, message: "Usuário criado com sucesso", user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
