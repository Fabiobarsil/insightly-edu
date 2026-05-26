import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Link de recuperação enviado. Verifique seu email.");
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
            <h1 className="text-2xl font-bold text-foreground mb-1">Recuperar senha</h1>
            <p className="text-sm text-muted-foreground">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-4 text-sm text-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </div>
              <Link
                to="/login"
                className="block text-center w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-all"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-xs text-primary hover:underline font-medium">
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
