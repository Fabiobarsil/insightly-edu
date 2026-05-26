import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Subscribe FIRST so we don't miss PASSWORD_RECOVERY/SIGNED_IN events
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED"))) {
        setReady(true);
        setLinkError(null);
      }
    });

    const init = async () => {
      // Parse hash params (recovery links from Supabase use the URL fragment)
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const hashParams = new URLSearchParams(hash);
      const search = new URLSearchParams(window.location.search);

      const errorDesc = hashParams.get("error_description") || search.get("error_description");
      if (errorDesc) {
        setLinkError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        return;
      }

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!cancelled) {
          if (error) setLinkError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
          else if (data.session) setReady(true);
          // Clean URL
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }

      // PKCE/code flow fallback
      const code = search.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) setLinkError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
          else if (data.session) setReady(true);
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }

      // No tokens in URL — check for existing recovery session
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) {
        setReady(true);
        return;
      }

      // Timeout fallback
      setTimeout(() => {
        if (!cancelled) {
          setReady((r) => {
            if (!r) setLinkError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
            return r;
          });
        }
      }, 4000);

      // Suppress unused-var warning in production builds
      void type;
    };

    init();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada com sucesso!");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-primary">CertusEdu</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Definir nova senha</h1>
            <p className="text-sm text-muted-foreground">Escolha uma nova senha para acessar sua conta.</p>
          </div>

          {linkError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{linkError}</p>
              <button
                onClick={() => navigate("/forgot-password", { replace: true })}
                className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-all"
              >
                Solicitar nova recuperação
              </button>
            </div>
          ) : !ready ? (
            <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Atualizando..." : "Atualizar senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
