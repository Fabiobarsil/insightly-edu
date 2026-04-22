import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileDown, Eye, Plus, Pencil, Award, Search } from "lucide-react";
import { DocumentLayout } from "@/lib/documentLayout";
import CertificadoTemplate from "./CertificadoTemplate";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import html2pdf from "html2pdf.js";

interface CertificadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CertFormData {
  course_name: string;
  workload_hours: string;
  completion_year: string;
  city: string;
  state: string;
  issue_date: string;
  director_name: string;
  secretary_name: string;
  institution_name: string;
  establishment: string;
  registry_number: string;
  registry_book: string;
  registry_page: string;
  additional_skills: string;
  notes: string;
}

const emptyForm: CertFormData = {
  course_name: "",
  workload_hours: "",
  completion_year: new Date().getFullYear().toString(),
  city: "",
  state: "",
  issue_date: new Date().toISOString().split("T")[0],
  director_name: "",
  secretary_name: "",
  institution_name: "",
  establishment: "",
  registry_number: "",
  registry_book: "",
  registry_page: "",
  additional_skills: "",
  notes: "",
};

const CertificadoModal = ({ open, onOpenChange }: CertificadoModalProps) => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Sub-views
  const [view, setView] = useState<"list" | "form" | "preview">("list");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [form, setForm] = useState<CertFormData>(emptyForm);

  // --- Queries ---
  const { data: students = [] } = useQuery({
    queryKey: ["cert-students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, class_id, academic_year, classes(name)")
        .eq("school_id", schoolId)
        .eq("status", "ativo")
        .order("full_name");
      return data || [];
    },
    enabled: !!schoolId && open,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["cert-classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId && open,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["cert-list", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("student_certificates").select("*").eq("school_id", schoolId);
      return data || [];
    },
    enabled: !!schoolId && open,
  });

  const { data: school } = useQuery({
    queryKey: ["cert-school", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId).single();
      return data;
    },
    enabled: !!schoolId && open,
  });

  // Assinaturas institucionais (Configurações > Assinaturas)
  const { data: signatures } = useQuery({
    queryKey: ["cert-signatures", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase
        .from("message_templates")
        .select("content")
        .eq("school_id", schoolId)
        .eq("category", "assinaturas")
        .eq("title", "__assinaturas__")
        .maybeSingle();
      if (!data?.content) return null;
      try {
        return JSON.parse(data.content) as {
          diretor?: { nome?: string; registro?: string };
          coordenador?: { nome?: string; registro?: string };
          secretario?: { nome?: string; registro?: string };
        };
      } catch {
        return null;
      }
    },
    enabled: !!schoolId && open,
  });

  // --- Derived ---
  const certByStudent = useMemo(() => {
    const map: Record<string, any> = {};
    certificates.forEach((c: any) => {
      map[c.student_id] = c;
    });
    return map;
  }, [certificates]);

  const filteredStudents = useMemo(() => {
    return (students as any[]).filter((s) => {
      if (searchName && !s.full_name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterClass && s.class_id !== filterClass) return false;
      if (filterYear && String(s.academic_year) !== filterYear) return false;
      return true;
    });
  }, [students, searchName, filterClass, filterYear]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    (students as any[]).forEach((s) => {
      if (s.academic_year) years.add(String(s.academic_year));
    });
    return Array.from(years).sort().reverse();
  }, [students]);

  // Cursos ofertados pela escola (Configurações > Informações Institucionais)
  const courseOptions = useMemo(() => {
    if (!school) return [] as { value: string; label: string }[];
    const opts: { value: string; label: string }[] = [];
    if ((school as any).offers_ensino_fundamental)
      opts.push({ value: "Ensino Fundamental", label: "Ensino Fundamental" });
    if ((school as any).offers_ensino_medio) opts.push({ value: "Ensino Médio", label: "Ensino Médio" });
    if ((school as any).offers_eja)
      opts.push({ value: "Educação de Jovens e Adultos (EJA)", label: "Educação de Jovens e Adultos (EJA)" });
    if ((school as any).offers_curso_tecnico) opts.push({ value: "Curso Técnico", label: "Curso Técnico" });
    return opts;
  }, [school]);

  // Cidade e Estado extraídos do endereço institucional
  // Formato canônico: "Logradouro, Nº - Bairro, Cidade - UF, CEP"
  const institutionalLocation = useMemo(() => {
    const addr = (school as any)?.address as string | undefined;
    if (!addr) return { city: "", state: "" };
    // Tenta capturar "Cidade - UF" em qualquer posição da string
    const m = addr.match(/([A-Za-zÀ-ÿ\s\.'-]+?)\s*[-–]\s*([A-Z]{2})(?=\s*,|\s*$)/);
    if (m) {
      return { city: m[1].trim(), state: m[2].trim().toUpperCase() };
    }
    // Fallback: último segmento como cidade
    const parts = addr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return { city: parts[parts.length - 1] || "", state: "" };
  }, [school]);

  const cityOptions = useMemo(() => {
    return institutionalLocation.city ? [{ value: institutionalLocation.city, label: institutionalLocation.city }] : [];
  }, [institutionalLocation]);

  const stateOptions = useMemo(() => {
    return institutionalLocation.state
      ? [{ value: institutionalLocation.state, label: institutionalLocation.state }]
      : UF_OPTIONS;
  }, [institutionalLocation]);

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !selectedStudentId) throw new Error("Dados incompletos");
      const payload = {
        school_id: schoolId,
        student_id: selectedStudentId,
        course_name: form.course_name,
        workload_hours: form.workload_hours ? parseInt(form.workload_hours) : null,
        completion_year: parseInt(form.completion_year),
        city: form.city || null,
        state: form.state || null,
        issue_date: form.issue_date || null,
        director_name: form.director_name || null,
        secretary_name: form.secretary_name || null,
        institution_name: form.institution_name || null,
        establishment: form.establishment || null,
        registry_number: form.registry_number || null,
        registry_book: form.registry_book || null,
        registry_page: form.registry_page || null,
        additional_skills: form.additional_skills || null,
        notes: form.notes || null,
      };

      if (editingCertId) {
        const { error } = await supabase.from("student_certificates").update(payload).eq("id", editingCertId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("student_certificates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cert-list"] });
      toast.success(editingCertId ? "Certificado atualizado!" : "Certificado gerado!");
      setView("list");
      resetForm();
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  // --- Helpers ---
  const resetForm = () => {
    setForm(emptyForm);
    setSelectedStudentId("");
    setEditingCertId(null);
  };

  const openFormForStudent = (studentId: string, cert?: any) => {
    setSelectedStudentId(studentId);
    if (cert) {
      setEditingCertId(cert.id);
      setForm({
        course_name: cert.course_name || "",
        workload_hours: cert.workload_hours ? String(cert.workload_hours) : "",
        completion_year: String(cert.completion_year || new Date().getFullYear()),
        city: cert.city || "",
        state: cert.state || "",
        issue_date: cert.issue_date || new Date().toISOString().split("T")[0],
        director_name: cert.director_name || "",
        secretary_name: cert.secretary_name || "",
        institution_name: cert.institution_name || "",
        establishment: cert.establishment || "",
        registry_number: cert.registry_number || "",
        registry_book: cert.registry_book || "",
        registry_page: cert.registry_page || "",
        additional_skills: cert.additional_skills || "",
        notes: cert.notes || "",
      });
    } else {
      setEditingCertId(null);
      // Preenchimento automático: prioriza assinaturas cadastradas; cai para dados da escola
      const directorFromSig = signatures?.diretor?.nome;
      const secretaryFromSig = signatures?.secretario?.nome;
      setForm({
        ...emptyForm,
        director_name: directorFromSig || school?.director_name || "",
        secretary_name: secretaryFromSig || "",
        institution_name: school?.name || "",
        establishment: school?.name || "",
        city: institutionalLocation.city || (school as any)?.city || "",
        state: institutionalLocation.state || (school as any)?.state || "",
        completion_year: new Date().getFullYear().toString(),
      });
    }
    setView("form");
  };

  const openPreview = (studentId: string) => {
    setSelectedStudentId(studentId);
    setView("preview");
  };

 const handleGerarPDF = () => {
  const el = document.getElementById("certificado-pdf");
  if (!el) return;

  const student = (students as any[]).find((s) => s.id === selectedStudentId);
  const nomeArquivo = student?.full_name?.trim().replace(/\s+/g, "-").toLowerCase() || "aluno";

  html2pdf()
    .set({
      margin: 0,
      filename: `certificado-${nomeArquivo}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1123,      // Força a largura exata
        height: 1588,     // Força a altura exata (794 * 2 páginas)
        windowWidth: 1123,
      },
      jsPDF: {
        unit: "px",
        format: [1123, 794],
        orientation: "landscape",
      },
      // Isso aqui remove espaços vazios que o navegador cria entre as divs
      pagebreak: { mode: ['css', 'legacy'], before: '.pdf-page' }
    })
    .from(el)
    .save();
};

  const updateField = (key: keyof CertFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedStudent = (students as any[]).find((s) => s.id === selectedStudentId);

  // --- Render ---
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setView("list");
          resetForm();
        }
      }}
    >
      <DialogContent className="max-w-[1200px] w-[95vw] rounded-xl p-0 shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Award className="h-5 w-5 text-secondary" />
            Gestão de Certificados
          </DialogTitle>
        </DialogHeader>

        {/* ===== LIST VIEW ===== */}
        {view === "list" && (
          <div className="flex-1 overflow-auto px-6 pb-6">
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mt-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-muted-foreground mb-1">Buscar Aluno</label>
                <div className="flex items-center gap-2 border border-border rounded-[12px] px-3 py-2 bg-background">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Nome do aluno..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="min-w-[160px]">
                <label className="block text-xs font-bold text-muted-foreground mb-1">Turma</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Todas</option>
                  {(classes as any[]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="block text-xs font-bold text-muted-foreground mb-1">Ano Letivo</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Todos</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-accent/30">
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Turma
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Ano
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum aluno encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s: any) => {
                        const cert = certByStudent[s.id];
                        return (
                          <tr key={s.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{s.full_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.classes?.name || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{cert?.course_name || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {cert?.completion_year || s.academic_year || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={cert ? "active" : "inactive"} label={cert ? "Gerado" : "Pendente"} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {cert ? (
                                  <>
                                    <button
                                      onClick={() => openPreview(s.id)}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                      title="Visualizar"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => openFormForStudent(s.id, cert)}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openFormForStudent(s.id)}
                                    className="text-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Gerar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
                Mostrando {filteredStudents.length} aluno(s) · {certificates.length} certificado(s) gerado(s)
              </div>
            </div>
          </div>
        )}

        {/* ===== FORM VIEW ===== */}
        {view === "form" && (
          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="flex items-center gap-3 mt-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView("list");
                  resetForm();
                }}
              >
                ← Voltar
              </Button>
              <span className="text-sm font-bold text-primary">
                {editingCertId ? "Editar" : "Gerar"} Certificado — {selectedStudent?.full_name}
              </span>
            </div>

            <div className="space-y-6">
              {/* Dados do Certificado */}
              <fieldset className="border border-border/60 rounded-xl p-4">
                <legend className="text-xs font-bold text-secondary px-2 uppercase tracking-wider">
                  Dados do Certificado
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <FormSelect
                    label="Nome do Curso *"
                    value={form.course_name}
                    onChange={(v) => updateField("course_name", v)}
                    options={courseOptions}
                    placeholder={courseOptions.length ? "Selecione o curso" : "Nenhum curso ofertado pela escola"}
                  />
                  <FormInput
                    label="Carga Horária (h)"
                    value={form.workload_hours}
                    onChange={(v) => updateField("workload_hours", v)}
                    type="number"
                    placeholder="800"
                  />
                  <FormInput
                    label="Ano de Conclusão *"
                    value={form.completion_year}
                    onChange={(v) => updateField("completion_year", v)}
                    type="number"
                  />
                </div>
              </fieldset>

              {/* Dados Administrativos */}
              <fieldset className="border border-border/60 rounded-xl p-4">
                <legend className="text-xs font-bold text-secondary px-2 uppercase tracking-wider">
                  Dados Administrativos
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <FormSelect
                    label="Cidade"
                    value={form.city}
                    onChange={(v) => updateField("city", v)}
                    options={cityOptions}
                    placeholder={cityOptions.length ? "Selecione a cidade" : "Cadastre o endereço da escola"}
                  />
                  <FormSelect
                    label="Estado"
                    value={form.state}
                    onChange={(v) => updateField("state", v)}
                    options={stateOptions}
                    placeholder={institutionalLocation.state ? "Selecione o estado" : "Cadastre o endereço da escola"}
                  />
                  <FormInput
                    label="Data de Emissão"
                    value={form.issue_date}
                    onChange={(v) => updateField("issue_date", v)}
                    type="date"
                  />
                  <FormInput
                    label="Diretor(a)"
                    value={form.director_name}
                    onChange={(v) => updateField("director_name", v)}
                  />
                  <FormInput
                    label="Secretário(a)"
                    value={form.secretary_name}
                    onChange={(v) => updateField("secretary_name", v)}
                  />
                  <FormInput
                    label="Instituição"
                    value={form.institution_name}
                    onChange={(v) => updateField("institution_name", v)}
                  />
                </div>
              </fieldset>

              {/* Dados de Registro (Verso) */}
              <fieldset className="border border-border/60 rounded-xl p-4">
                <legend className="text-xs font-bold text-secondary px-2 uppercase tracking-wider">
                  Registro (Verso)
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <FormInput
                    label="Estabelecimento"
                    value={form.establishment}
                    onChange={(v) => updateField("establishment", v)}
                  />
                  <FormInput
                    label="Nº de Registro"
                    value={form.registry_number}
                    onChange={(v) => updateField("registry_number", v)}
                  />
                  <FormInput
                    label="Livro"
                    value={form.registry_book}
                    onChange={(v) => updateField("registry_book", v)}
                  />
                  <FormInput
                    label="Folha"
                    value={form.registry_page}
                    onChange={(v) => updateField("registry_page", v)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      Habilidades Adicionais
                    </label>
                    <textarea
                      value={form.additional_skills}
                      onChange={(e) => updateField("additional_skills", e.target.value)}
                      rows={3}
                      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Observações</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      rows={3}
                      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setView("list");
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!form.course_name || !form.completion_year || saveMutation.isPending}
                >
                  <Award className="h-4 w-4 mr-2" />
                  {saveMutation.isPending
                    ? "Salvando..."
                    : editingCertId
                      ? "Atualizar Certificado"
                      : "Gerar Certificado"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PREVIEW VIEW ===== */}
        {view === "preview" &&
          selectedStudent &&
          (() => {
            const cert = certByStudent[selectedStudent.id] || {};
            const directorName = cert.director_name || signatures?.diretor?.nome || school?.director_name || "";
            const secretaryName = cert.secretary_name || signatures?.secretario?.nome || "";
            const certData = {
              full_name: selectedStudent.full_name,
              school_name: cert.institution_name || school?.name,
              modality: cert.course_name,
              education_type: cert.course_name?.toLowerCase().includes("eja") ? "eja" : undefined,
              year: cert.completion_year || selectedStudent.academic_year,
              director: directorName,
              secretary: secretaryName,
            };
            return (
              <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="flex items-center justify-between mt-4 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setView("list")}>
                    ← Voltar
                  </Button>
                  <Button onClick={handleGerarPDF} size="sm">
                    <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
                  </Button>
                </div>
                <div className="flex justify-center overflow-auto bg-muted/40">
                  <div style={{ transform: "scale(0.7)", transformOrigin: "top center" }}>
                   <div id="certificado-pdf" style={{ width: "1123px", overflow: "hidden" }}>
                    {/* PÁGINA 1 - FRENTE */}
                    <div className="pdf-page" style={{ width: "1123px", height: "794px", position: "relative", overflow: "hidden" }}>
                      <CertificadoTemplate data={certData} />
                    </div>

                    {/* PÁGINA 2 - VERSO */}
                    <div className="pdf-page" style={{
                      width: "1123px",
                      height: "794px",
                      background: "#fff",
                      padding: "50px 70px",
                      boxSizing: "border-box",
                      fontFamily: "'Times New Roman', serif",
                      color: "#0f2a44",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <h2 style={{ textAlign: "center", fontSize: "22px", margin: "0 0 20px", letterSpacing: "1px" }}>
                        REGISTRO DO CERTIFICADO
                      </h2>

                      {/* Tabela de disciplinas */}
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "20px" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={{ border: "1px solid #0f2a44", padding: "6px", textAlign: "left" }}>Disciplinas / Componentes Curriculares</th>
                            <th style={{ border: "1px solid #0f2a44", padding: "6px", width: "140px" }}>Carga Horária</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i}>
                              <td style={{ border: "1px solid #0f2a44", padding: "6px", height: "26px" }}>&nbsp;</td>
                              <td style={{ border: "1px solid #0f2a44", padding: "6px", textAlign: "center" }}>&nbsp;</td>
                            </tr>
                          ))}
                          <tr>
                            <td style={{ border: "1px solid #0f2a44", padding: "6px", textAlign: "right", fontWeight: "bold" }}>Total de Horas</td>
                            <td style={{ border: "1px solid #0f2a44", padding: "6px", textAlign: "center", fontWeight: "bold" }}>
                              {cert.workload_hours ? `${cert.workload_hours}h` : "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ fontSize: "13px", lineHeight: 1.8, marginBottom: "20px" }}>
                        <div><strong>Estabelecimento:</strong> {cert.establishment || school?.name || "—"}</div>
                        <div><strong>Habilidades Adicionais:</strong> {cert.additional_skills || "—"}</div>
                        <div><strong>Observações:</strong> {cert.notes || "—"}</div>
                      </div>

                      <div style={{ border: "2px solid #0f2a44", padding: "14px 18px", fontSize: "13px", lineHeight: 1.8, marginBottom: "auto" }}>
                        <div style={{ fontWeight: "bold", marginBottom: "8px", letterSpacing: "1px" }}>REGISTRO</div>
                        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                          <div><strong>Nº de Registro:</strong> {cert.registry_number || "—"}</div>
                          <div><strong>Livro:</strong> {cert.registry_book || "—"}</div>
                          <div><strong>Folha:</strong> {cert.registry_page || "—"}</div>
                          <div>
                            <strong>Data de Emissão:</strong> {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString("pt-BR") : "—"}
                          </div>
                        </div>
                        <div style={{ marginTop: "8px" }}><strong>Local:</strong> {cert.city || "—"} / {cert.state || "—"}</div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "60px" }}>
                        <div style={{ width: "300px", textAlign: "center" }}>
                          <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
                          <div style={{ fontSize: "13px", fontWeight: "bold" }}>{secretaryName || "—"}</div>
                          <div style={{ fontSize: "11px" }}>Secretário(a) Escolar</div>
                        </div>
                        <div style={{ width: "300px", textAlign: "center" }}>
                          <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
                          <div style={{ fontSize: "13px", fontWeight: "bold" }}>{directorName || "—"}</div>
                          <div style={{ fontSize: "11px" }}>Diretor(a)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </DialogContent>
    </Dialog>
  );
};

// --- Small helper component ---
function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
      >
        <option value="">{placeholder || "Selecione"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
      </select>
    </div>
  );
}

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
].map((uf) => ({ value: uf, label: uf }));

export default CertificadoModal;
