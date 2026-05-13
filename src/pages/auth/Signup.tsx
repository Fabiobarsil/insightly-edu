import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoCertus from "@/assets/logo-certus.png";

const SELECTABLE_ROLES = [
  { value: "secretaria", label: "Secretaria" },
  { value: "professor", label: "Professor(a)" },
  { value: "coordenador", label: "Coordenador(a)" },
  { value: "diretor", label: "Diretor(a)" },
  { value: "psicologo", label: "Psicólogo(a)" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "administracao", label: "Administração" },
  { value: "admin", label: "Administrador(a) da escola" },
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(128),
  schoolId: z.string().uuid("Selecione uma escola"),
  role: z.string().min(1, "Selecione um papel"),
});

export default function Signup() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", schoolId: "", role: "secretaria" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate("/", { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    supabase
      .from("schools")
      .select("id, name")
      .order("name")
      .then(({ data }) => setSchools(data ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    const { data: signUp, error: signErr } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName },
      },
    });

    if (signErr) {
      toast.error(signErr.message);
      setSubmitting(false);
      return;
    }

    // Tenta inserir solicitação de acesso pendente.
    // Se a confirmação de e-mail estiver ativa, pode não haver session ainda — neste caso
    // o usuário será orientado a confirmar e tentar novamente.
    if (signUp.session?.user) {
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: signUp.session.user.id,
        school_id: parsed.data.schoolId,
        role: parsed.data.role as never,
        requested_role: parsed.data.role as never,
        status: "pending",
        notes: parsed.data.fullName,
      });

      if (roleErr) {
        console.error("[Signup] erro ao criar solicitação:", roleErr);
        toast.error("Cadastro criado, mas falhou ao registrar solicitação de acesso. Faça login para tentar novamente.");
      } else {
        toast.success("Solicitação enviada! Aguarde aprovação da sua escola.");
      }
      navigate("/aguardando-aprovacao", { replace: true });
    } else {
      toast.success("Cadastro criado. Confirme seu e-mail e faça login para registrar sua solicitação de acesso.");
      navigate("/login", { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-primary">CertusEdu</span>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Solicitar acesso</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Preencha seus dados. Sua solicitação será enviada para aprovação da sua escola.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome completo</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                maxLength={120}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Mínimo 8 caracteres.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Escola</label>
              <select
                value={form.schoolId}
                onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione…</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Função desejada</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SELECTABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Enviar solicitação"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
