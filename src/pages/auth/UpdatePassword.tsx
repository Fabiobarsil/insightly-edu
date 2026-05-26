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

  useEffect(() => {
    // Supabase recovery flow places tokens in the URL hash; detectSessionInUrl handles it.
    // We just confirm a session exists (recovery session) before allowing update.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
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

          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Validando link de recuperação... Se você abriu esta página fora do link recebido por email, solicite uma
              nova recuperação.
            </p>
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
