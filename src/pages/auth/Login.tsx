import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";
import { AppRole, getDashboardPath } from "@/contexts/AuthContext";

const roleToDashboard: Record<AppRole, "superadmin" | "admin" | "secretaria" | "professor"> = {
  owner: "superadmin",
  admin: "admin",
  coordenador: "admin",
  secretaria: "secretaria",
  auxiliar: "secretaria",
  professor: "professor",
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const userId = authData.user?.id ?? authData.session?.user?.id;

      if (!userId) {
        toast.error("Erro ao obter dados do usuário");
        navigate("/", { replace: true });
        setLoading(false);
        return;
      }

      // Small delay to let onAuthStateChange release the navigator lock
      await new Promise((r) => setTimeout(r, 100));

      // Check profiles.role for superadmin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      console.log("[Login] profile for", userId, ":", profile);

      if (profile?.role === "superadmin") {
        toast.success("Login realizado com sucesso!");
        navigate("/superadmin/dashboard", { replace: true });
        setLoading(false);
        return;
      }

      // Fallback to school_memberships
      const { data: membership } = await supabase
        .from("school_memberships")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .single();

      toast.success("Login realizado com sucesso!");

      if (membership?.role) {
        const dashRole = roleToDashboard[membership.role as AppRole];
        navigate(getDashboardPath(dashRole), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("[Login] unexpected error:", err);
      toast.error("Erro inesperado no login");
    }

    setLoading(false);
  };

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
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                Email
              </label>
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
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
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
