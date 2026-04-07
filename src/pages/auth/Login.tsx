import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, dashboardRole, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("Carregando...");

  // Debug: fetch raw session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      const info: Record<string, unknown> = {
        session_exists: !!data.session,
        user_id: data.session?.user?.id ?? null,
        error: error?.message ?? null,
      };

      if (data.session?.user?.id) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();
        info.profile = profile;
        info.profile_error = profErr?.message ?? null;

        const { data: membership, error: memErr } = await supabase
          .from("school_memberships")
          .select("*")
          .eq("user_id", data.session.user.id)
          .limit(1)
          .single();
        info.membership = membership;
        info.membership_error = memErr?.message ?? null;
      }

      console.log("[DEBUG LOGIN]", info);
      setDebugInfo(JSON.stringify(info, null, 2));
    });
  }, []);

  useEffect(() => {
    if (!authLoading && session && dashboardRole) {
      console.log("[Login] redirecting to", getDashboardPath(dashboardRole));
      navigate(getDashboardPath(dashboardRole), { replace: true });
    }
  }, [authLoading, session, dashboardRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (session && !dashboardRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-foreground mb-2">Sessão ativa mas sem role definida.</p>
        <p className="text-sm text-muted-foreground mb-4">AuthContext role: {role ?? "null"} | dashboardRole: {dashboardRole ?? "null"}</p>
        <pre className="bg-muted text-xs p-4 rounded-xl max-w-lg overflow-auto max-h-64 w-full">{debugInfo}</pre>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-destructive hover:underline">
          Fazer logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="bg-card border border-border/60 rounded-2xl shadow-lg p-8 w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-2">
              <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-primary">CertusEdu</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sistema de Gestão Escolar Inteligente
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* DEBUG temporário */}
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">Debug info</summary>
            <pre className="bg-muted text-xs p-2 rounded mt-1 overflow-auto max-h-40">{debugInfo}</pre>
          </details>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Ainda não tem uma conta?{" "}
            <Link to="/landing" className="text-primary font-medium hover:underline">
              Conheça o CertusEdu
            </Link>
          </p>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground/60 space-y-0.5">
        <p>CertusEdu © 2026</p>
        <p>Uma solução do ecossistema Certus</p>
        <p>Desenvolvido por Innove Digital Service</p>
      </footer>
    </div>
  );
};

export default Login;
