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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callerMember } = await adminClient
      .from("account_members")
      .select("account_id")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    if (!callerMember?.account_id) {
      return new Response(JSON.stringify({ members: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: members, error: memErr } = await adminClient
      .from("account_members")
      .select("*")
      .eq("account_id", callerMember.account_id)
      .order("created_at", { ascending: true });

    if (memErr) {
      return new Response(JSON.stringify({ error: memErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usersList } = await adminClient.auth.admin.listUsers();
    const userIndex = new Map<string, { email: string | null; name: string | null }>();
    (usersList?.users || []).forEach((u: any) => {
      userIndex.set(u.id, {
        email: u.email ?? null,
        name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          null,
      });
    });

    const userIds = (members || []).map((m: any) => m.user_id);
    let profileIndex = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      (profiles || []).forEach((p: any) => profileIndex.set(p.id, p.full_name));
    }

    const enriched = (members || []).map((m: any) => {
      const u = userIndex.get(m.user_id);
      return {
        ...m,
        email: u?.email ?? null,
        full_name: profileIndex.get(m.user_id) || u?.name || null,
      };
    });

    return new Response(JSON.stringify({ members: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
