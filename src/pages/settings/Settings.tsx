import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import StatusBadge from "@/components/shared/StatusBadge";
import OfficialDocumentHeader from "@/components/documents/OfficialDocumentHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TeacherRegistrationTab from "@/components/settings/TeacherRegistrationTab";
import TemplatesTab from "@/components/settings/TemplatesTab";

const tabs = [
  { id: "escola", label: "Dados da Escola", icon: "ri-building-line" },
  { id: "professores", label: "Cadastro de Professor", icon: "ri-user-star-line" },
  { id: "templates", label: "Mensagens e Templates", icon: "ri-chat-3-line" },
  { id: "documentos", label: "Cabeçalho Oficial", icon: "ri-draft-line" },
  { id: "assinaturas", label: "Assinaturas", icon: "ri-quill-pen-line" },
  { id: "usuarios", label: "Usuários e Papéis", icon: "ri-shield-user-line" },
];

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

const accessLabels: Record<string, string> = {
  permanent: "Permanente",
  temporary: "Temporário",
};

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  access_type: string;
  access_expires_at: string | null;
  created_at: string;
}

interface UserFormData {
  email: string;
  role: string;
  access_type: string;
  access_expires_at: string;
}

const emptyForm: UserFormData = { email: "", role: "editor", access_type: "permanent", access_expires_at: "" };

const Settings = () => {
  const [tab, setTab] = useState("escola");
  const { schoolId } = useSchoolId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- School data ---
  const { data: school } = useQuery({
    queryKey: ["school-admin", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase.from("schools").select("*").eq("id", schoolId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const [form, setForm] = useState({
    name: "", address: "", complement: "", cnpj: "", mec_authorization_code: "",
    director_name: "", director_role: "", logo_url: "",
    offers_ensino_fundamental: false, offers_ensino_medio: true, offers_eja: false, offers_curso_tecnico: false,
  });

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name || "", address: school.address || "", complement: (school as any).complement || "", cnpj: school.cnpj || "",
        mec_authorization_code: school.mec_authorization_code || "", director_name: school.director_name || "",
        director_role: school.director_role || "", logo_url: school.logo_url || "",
        offers_ensino_fundamental: (school as any).offers_ensino_fundamental ?? false,
        offers_ensino_medio: (school as any).offers_ensino_medio ?? true,
        offers_eja: (school as any).offers_eja ?? false,
        offers_curso_tecnico: (school as any).offers_curso_tecnico ?? false,
      });
    }
  }, [school]);

  const toggleOffer = (key: "offers_ensino_medio" | "offers_eja" | "offers_curso_tecnico") =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!schoolId) throw new Error("Escola não encontrada");
      const { error } = await supabase.from("schools").update(data).eq("id", schoolId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["school-admin"] }); toast.success("Dados salvos!"); },
    onError: () => toast.error("Erro ao salvar dados"),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;
    const ext = file.name.split(".").pop();
    const path = `logos/${schoolId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("school-assets").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao fazer upload da logo."); return; }
    const { data: urlData } = supabase.storage.from("school-assets").getPublicUrl(path);
    setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    toast.success("Logo carregada! Salve para confirmar.");
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // --- Users tab ---
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["account-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("account_members").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MemberRow[];
    },
    enabled: tab === "usuarios",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditingMember(null); setUserForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: MemberRow) => {
    setEditingMember(m);
    setUserForm({ email: "", role: m.role, access_type: m.access_type, access_expires_at: m.access_expires_at?.slice(0, 10) || "" });
    setModalOpen(true);
  };

  const handleCreateUser = async () => {
    if (!userForm.email.trim()) { toast.error("Informe o e-mail"); return; }
    if (userForm.access_type === "temporary" && !userForm.access_expires_at) { toast.error("Informe a data de expiração"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: userForm.email.trim(),
          role: userForm.role,
          access_type: userForm.access_type,
          access_expires_at: userForm.access_type === "temporary" ? userForm.access_expires_at : null,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setSaving(false); return; }
      toast.success(data?.message || "Usuário criado!");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["account-members"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally { setSaving(false); }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    if (userForm.access_type === "temporary" && !userForm.access_expires_at) { toast.error("Informe a data de expiração"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("account_members").update({
        role: userForm.role,
        access_type: userForm.access_type,
        access_expires_at: userForm.access_type === "temporary" ? userForm.access_expires_at : null,
      }).eq("id", editingMember.id);
      if (error) throw error;
      toast.success("Usuário atualizado!");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["account-members"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally { setSaving(false); }
  };

  const handleUserFormChange = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
  };

  const isExpired = (m: MemberRow) => m.access_type === "temporary" && m.access_expires_at && new Date(m.access_expires_at) < new Date();

  return (
    <AppLayout title="Administração" breadcrumbs={[{ label: "Administração" }]}>
      <PageHeader title="Administração" description="Configure os dados institucionais e identidade oficial da escola" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
            tab === t.id ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted hover:bg-accent"
          )}>
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* ========== ESCOLA ========== */}
      {tab === "escola" && (
        <div className="space-y-6">
          <FormCard title="Informações Institucionais" onSubmit={() => updateMutation.mutate(form)} submitLabel="Salvar Dados">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome da Escola</label>
                <input value={form.name} onChange={handleChange("name")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">CNPJ</label>
                <input value={form.cnpj} onChange={handleChange("cnpj")} placeholder="00.000.000/0000-00" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Endereço Completo</label>
                <input value={form.address} onChange={handleChange("address")} placeholder="Rua, número, bairro, cidade - UF, CEP" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Complemento</label>
                <input value={form.complement} onChange={handleChange("complement")} placeholder="Sala, Bloco, Andar..." className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Portaria / Ato de Autorização</label>
                <input value={form.mec_authorization_code} onChange={handleChange("mec_authorization_code")} placeholder="Ex: Portaria SEE nº 1234/2020" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Diretor(a) Responsável</label>
                <input value={form.director_name} onChange={handleChange("director_name")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Entidade Mantenedora / Cargo</label>
                <input value={form.director_role} onChange={handleChange("director_role")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-2">Modalidades Oferecidas</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: "offers_ensino_medio" as const, label: "Ensino Médio" },
                    { key: "offers_eja" as const, label: "Educação de Jovens e Adultos (EJA)" },
                    { key: "offers_curso_tecnico" as const, label: "Curso Técnico" },
                  ].map((m) => (
                    <label
                      key={m.key}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-[12px] border cursor-pointer transition-colors text-sm",
                        form[m.key]
                          ? "border-secondary bg-secondary/10 text-primary font-bold"
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form[m.key]}
                        onChange={() => toggleOffer(m.key)}
                        className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Marque todas as modalidades disponíveis na escola. Elas aparecerão na matrícula do aluno.
                </p>
              </div>
            </div>
          </FormCard>
          <FormCard title="Logo da Escola" onSubmit={() => updateMutation.mutate(form)} submitLabel="Salvar Logo">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded-xl border border-border bg-background p-1" />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-accent/30">
                    <i className="ri-image-add-line text-2xl mb-1" /><span className="text-[10px]">Sem logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground">Usada apenas em documentos oficiais.</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold border border-border hover:bg-accent transition-colors">
                  <i className="ri-upload-2-line" /> Enviar Logo
                </button>
                {form.logo_url && (
                  <button onClick={() => setForm((p) => ({ ...p, logo_url: "" }))} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors ml-2">
                    <i className="ri-delete-bin-line" /> Remover
                  </button>
                )}
              </div>
            </div>
          </FormCard>
        </div>
      )}

      {/* ========== PROFESSORES ========== */}
      {tab === "professores" && <TeacherRegistrationTab schoolId={schoolId} />}

      {/* ========== TEMPLATES ========== */}
      {tab === "templates" && <TemplatesTab schoolId={schoolId} />}

      {/* ========== DOCUMENTOS ========== */}
      {tab === "documentos" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2"><i className="ri-eye-line" /> Pré-visualização</h3>
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              <OfficialDocumentHeader school={form} />
              <p className="text-xs text-muted-foreground italic text-center mt-4">Cabeçalho aplicado automaticamente nos documentos oficiais.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== ASSINATURAS ========== */}
      {tab === "assinaturas" && (
        <div className="space-y-4">
          {["Diretor(a)", "Coordenador(a)", "Secretário(a)"].map((cargo, i) => (
            <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
              <h4 className="text-sm font-bold text-primary mb-4">{cargo}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome</label>
                  <input placeholder={`Nome do(a) ${cargo}`} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Registro</label>
                  <input placeholder="Número do registro" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== USUÁRIOS ========== */}
      {tab === "usuarios" && (
        <>
          <div className="bg-card border border-border/60 rounded-xl certus-shadow">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Usuários do Sistema</span>
              <button onClick={openCreate} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                <i className="ri-add-line mr-1" /> Novo Usuário
              </button>
            </div>

            {membersLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum usuário encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">User ID</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Papel</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Tipo de Acesso</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Expira em</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Criado em</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{m.user_id.slice(0, 8)}…</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold bg-accent px-2.5 py-1 rounded-full text-primary">
                            {roleLabels[m.role] || m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">{accessLabels[m.access_type] || m.access_type}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{formatDate(m.access_expires_at)}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{formatDate(m.created_at)}</td>
                        <td className="px-4 py-3">
                          {isExpired(m) ? (
                            <StatusBadge status="inactive" label="Expirado" />
                          ) : (
                            <StatusBadge status="active" label="Ativo" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="Editar">
                            <i className="ri-pencil-line" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
              {members.length} usuário(s)
            </div>
          </div>

          {/* Modal Criar / Editar */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {!editingMember && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">E-mail</label>
                    <input type="email" value={userForm.email} onChange={handleUserFormChange("email")} placeholder="usuario@email.com" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Papel</label>
                  <select value={userForm.role} onChange={handleUserFormChange("role")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                    <option value="owner">Proprietário</option>
                    <option value="admin">Administrador</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Tipo de Acesso</label>
                  <select value={userForm.access_type} onChange={handleUserFormChange("access_type")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                    <option value="permanent">Permanente</option>
                    <option value="temporary">Temporário</option>
                  </select>
                </div>
                {userForm.access_type === "temporary" && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Data de Expiração</label>
                    <input type="date" value={userForm.access_expires_at} onChange={handleUserFormChange("access_expires_at")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
                  </div>
                )}
                <button onClick={editingMember ? handleUpdateMember : handleCreateUser} disabled={saving} className="w-full py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? "Salvando..." : editingMember ? "Salvar Alterações" : "Criar Usuário"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppLayout>
  );
};

export default Settings;
