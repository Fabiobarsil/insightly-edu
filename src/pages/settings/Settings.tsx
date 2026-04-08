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
import { toast } from "sonner";

const tabs = [
  { id: "escola", label: "Dados da Escola", icon: "ri-building-line" },
  { id: "documentos", label: "Cabeçalho Oficial", icon: "ri-draft-line" },
  { id: "assinaturas", label: "Assinaturas", icon: "ri-quill-pen-line" },
  { id: "usuarios", label: "Usuários e Papéis", icon: "ri-shield-user-line" },
];

const users = [
  { nome: "Admin Principal", email: "admin@certus.edu.br", papel: "Administrador", status: "active" },
  { nome: "Maria Oliveira", email: "maria@certus.edu.br", papel: "Professor", status: "active" },
  { nome: "João Santos", email: "joao@certus.edu.br", papel: "Professor", status: "active" },
  { nome: "Ana Coord.", email: "ana@certus.edu.br", papel: "Coordenador", status: "active" },
  { nome: "Carlos Sec.", email: "carlos@certus.edu.br", papel: "Secretário", status: "inactive" },
];

const Settings = () => {
  const [tab, setTab] = useState("escola");
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: school, isLoading } = useQuery({
    queryKey: ["school-admin", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const [form, setForm] = useState({
    name: "",
    address: "",
    cnpj: "",
    mec_authorization_code: "",
    director_name: "",
    director_role: "",
    logo_url: "",
  });

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name || "",
        address: school.address || "",
        cnpj: school.cnpj || "",
        mec_authorization_code: school.mec_authorization_code || "",
        director_name: school.director_name || "",
        director_role: school.director_role || "",
        logo_url: school.logo_url || "",
      });
    }
  }, [school]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!schoolId) throw new Error("Escola não encontrada");
      const { error } = await supabase
        .from("schools")
        .update({
          name: data.name,
          address: data.address,
          cnpj: data.cnpj,
          mec_authorization_code: data.mec_authorization_code,
          director_name: data.director_name,
          director_role: data.director_role,
          logo_url: data.logo_url,
        })
        .eq("id", schoolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-admin"] });
      toast.success("Dados da escola salvos com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar dados da escola"),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    const ext = file.name.split(".").pop();
    const path = `logos/${schoolId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("school-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao fazer upload da logo. Verifique se o bucket 'school-assets' existe.");
      return;
    }

    const { data: urlData } = supabase.storage.from("school-assets").getPublicUrl(path);
    setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    toast.success("Logo carregada! Salve para confirmar.");
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

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
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Portaria / Ato de Autorização / Resolução</label>
                <input value={form.mec_authorization_code} onChange={handleChange("mec_authorization_code")} placeholder="Ex: Portaria SEE nº 1234/2020 · Resolução CEE nº 56/2019" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Diretor(a) Responsável</label>
                <input value={form.director_name} onChange={handleChange("director_name")} placeholder="Nome completo para assinatura" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Entidade Mantenedora / Cargo</label>
                <input value={form.director_role} onChange={handleChange("director_role")} placeholder="Ex: Associação Educacional XYZ" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
              </div>
            </div>
          </FormCard>

          <FormCard title="Logo da Escola (para documentos oficiais)" onSubmit={() => updateMutation.mutate(form)} submitLabel="Salvar Logo">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo da Escola" className="w-24 h-24 object-contain rounded-xl border border-border bg-background p-1" />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-accent/30">
                    <i className="ri-image-add-line text-2xl mb-1" />
                    <span className="text-[10px]">Sem logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Esta logo será usada <strong>apenas em documentos oficiais</strong> (declarações, históricos, boletins).
                  Não será exibida no sistema.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold border border-border hover:bg-accent transition-colors"
                >
                  <i className="ri-upload-2-line" /> Enviar Logo
                </button>
                {form.logo_url && (
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors ml-2"
                  >
                    <i className="ri-delete-bin-line" /> Remover
                  </button>
                )}
              </div>
            </div>
          </FormCard>
        </div>
      )}

      {tab === "documentos" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-eye-line" /> Pré-visualização do Cabeçalho Oficial
            </h3>
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              <OfficialDocumentHeader school={form} />
              <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground italic">
                  Este cabeçalho será aplicado automaticamente em todos os documentos oficiais gerados pelo sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-information-line" /> Informações
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• O cabeçalho é gerado automaticamente com os dados cadastrados na aba "Dados da Escola".</p>
              <p>• Inclui o Brasão da República, dados da instituição e a logo da escola.</p>
              <p>• Utilizado em: Declarações, Histórico Escolar, Boletim, Transferência e demais documentos oficiais.</p>
              <p>• Para alterar, vá até a aba "Dados da Escola" e atualize as informações.</p>
            </div>
          </div>
        </div>
      )}

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

      {tab === "usuarios" && (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <span className="text-sm font-bold text-primary">Usuários do Sistema</span>
            <button className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold">
              <i className="ri-add-line mr-1" /> Novo Usuário
            </button>
          </div>
          {users.map((u, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary">
                  {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{u.nome}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted bg-accent px-2.5 py-1 rounded-full">{u.papel}</span>
                <StatusBadge status={u.status} label={u.status === "active" ? "Ativo" : "Inativo"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Settings;
