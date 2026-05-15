import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, dashboardRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !session) return;
    if (dashboardRole) {
      navigate(getDashboardPath(dashboardRole), { replace: true });
    } else {
      navigate("/sem-acesso", { replace: true });
    }
  }, [authLoading, session, dashboardRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Limpa apenas o cache local de auth antes do login, sem chamar signOut remoto.
    // Isso evita reutilizar refresh_token antigo/inválido e não dispara eventos duplicados.
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.warn("[Login] limpeza local de sessão falhou:", err);
    }

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

  // if (session && !dashboardRole) {
  // navigate("/sem-acesso", { replace: true });
  // return null;
  // }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Branding panel (hidden on mobile) */}
      <aside className="hidden lg:flex lg:w-[45%] bg-[hsl(222_47%_11%)] relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-64 h-64 bg-primary-foreground/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-primary-foreground">
          <div className="flex items-center gap-3">
            <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto rounded-[10px]" />
            <span className="text-xl font-bold">CertusEdu</span>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Plataforma SaaS
              </span>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Gestão escolar
              <br />
              <span className="text-secondary">inteligente</span> e completa.
            </h2>
            <p className="text-base text-primary-foreground/70 leading-relaxed">
              Centralize secretaria, pedagógico, documentos e comunicação em uma única plataforma feita para escolas que
              querem crescer.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-check-fill text-secondary text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold">100% LGPD</p>
                  <p className="text-xs text-primary-foreground/55">Dados protegidos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <i className="ri-flashlight-fill text-secondary text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Tempo real</p>
                  <p className="text-xs text-primary-foreground/55">Sincronização ativa</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <i className="ri-file-shield-2-fill text-secondary text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Documentos</p>
                  <p className="text-xs text-primary-foreground/55">Emissão oficial</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <i className="ri-team-fill text-secondary text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Multiusuário</p>
                  <p className="text-xs text-primary-foreground/55">Por papel</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/45">© 2026 CertusEdu • Uma solução do ecossistema Certus</p>
        </div>
      </aside>

      {/* Right side — Login form */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="flex items-center gap-2.5 mb-2">
              <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-primary">CertusEdu</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">Sistema de Gestão Escolar Inteligente</p>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h1>
              <p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Email</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="w-full border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Senha</label>
                <div className="relative">
                  <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    <i className={showPassword ? "ri-eye-off-line text-base" : "ri-eye-line text-base"} />
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <i className="ri-arrow-right-line text-base" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60">
              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem uma conta?{" "}
                <Link to="/landing" className="text-primary font-semibold hover:underline">
                  Conheça o CertusEdu
                </Link>
              </p>
            </div>
          </div>

          <footer className="mt-6 text-center text-[11px] text-muted-foreground/60 space-y-0.5 lg:hidden">
            <p>CertusEdu © 2026 • Innove Digital Service</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Login;
