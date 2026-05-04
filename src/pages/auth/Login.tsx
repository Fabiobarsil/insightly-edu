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
    if (!authLoading && session && dashboardRole) {
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://certusedu.lovable.app",
      },
    });

    if (error) {
      console.error("[Login Google] erro:", error);
      toast.error(error.message || "Erro ao entrar com Google");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (session && !dashboardRole) {
    navigate("/sem-acesso", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Branding panel (hidden on mobile) */}
      <aside className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden">
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
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full border border-border bg-background text-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-muted/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
                  />
                </svg>
                Entrar com Google
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
