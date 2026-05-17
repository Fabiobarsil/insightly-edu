import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, History, Loader2, Upload, Eye, Download, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";

const REQUIRED_DOCS: { type: string; label: string }[] = [
  { type: "certidao_nascimento", label: "Certidão de Nascimento" },
  { type: "rg", label: "RG" },
  { type: "cpf", label: "CPF" },
  { type: "comprovante_residencia", label: "Comprovante de Residência" },
  { type: "historico_escolar", label: "Histórico Escolar" },
  { type: "declaracao_transferencia", label: "Declaração de Transferência" },
  { type: "foto_3x4", label: "Foto 3x4" },
  { type: "cartao_vacina", label: "Cartão de Vacina" },
  { type: "rg_responsavel", label: "RG do Responsável" },
  { type: "cpf_responsavel", label: "CPF do Responsável" },
];

const ACTION_LABEL: Record<string, string> = {
  iniciou: "Iniciou atendimento",
  concluiu: "Concluiu atendimento",
  retornou: "Devolveu para fila",
  reabriu: "Reabriu",
  alterou: "Alterou status",
  observacao: "Registrou observação",
  documento_aprovado: "Documento aprovado",
  auto_concluido: "Concluído automaticamente",
};

const ACTION_BADGE: Record<string, string> = {
  concluiu: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  documento_aprovado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  auto_concluido: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  iniciou: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  retornou: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  reabriu: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const StudentsDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const docInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Aluno
  const { data: student } = useQuery({
    queryKey: ["student-basic", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, photo_url, classes:class_id(name, grade)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Documentos do aluno
  const { data: studentDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["student-documents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", id!);
      if (error) throw error;
      return data || [];
    },
  });

  // Histórico de atendimentos do aluno (todas as ações secretaria_actions)
  const { data: history = [] } = useQuery({
    queryKey: ["student-attendance-history", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_actions")
        .select("id, action_type, from_status, to_status, notes, created_at, request_id")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const normalizeType = (t: string) =>
    (t || "").toString().trim().toLowerCase().replace(/\s+/g, "_");

  const findRecord = (type: string) =>
    (studentDocs as any[]).find((d) => normalizeType(d.document_type) === normalizeType(type)) || null;

  const STATUS_LABEL: Record<string, string> = {
    pendente: "● Pendente",
    em_analise: "⏳ Em análise",
    aprovado: "✔ Aprovado",
    rejeitado: "✖ Rejeitado",
  };

  const STATUS_CLASS: Record<string, string> = {
    pendente: "bg-muted text-muted-foreground",
    em_analise: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    aprovado: "bg-secondary/15 text-secondary",
    rejeitado: "bg-destructive/10 text-destructive",
  };

  const docsChecklist = REQUIRED_DOCS.map((req) => {
    const found = findRecord(req.type);
    const hasFile = !!(found?.file_path || found?.file_url);
    let status: string = found?.status || "pendente";
    // Documento sem arquivo nunca pode aparecer como aprovado
    if (!hasFile && status === "aprovado") status = "pendente";
    return {
      type: req.type,
      label: req.label,
      record: found,
      hasFile,
      status,
    };
  });

  const totalEntregues = docsChecklist.filter((d) => d.hasFile).length;
  const totalPendentes = docsChecklist.length - totalEntregues;

  // Upload
  const uploadDocMutation = useMutation({
    mutationFn: async ({ file, docType }: { file: File; docType: string }) => {
      if (!schoolId) throw new Error("Sem escola vinculada");
      const typeKey = normalizeType(docType);
      setUploadingType(typeKey);

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || null;

      const ext = (file.name.split(".").pop() || "bin")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const cleanFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      const filePath = `${schoolId}/${id}/${typeKey}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("student-documents")
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;

      const existing = findRecord(typeKey);
      const payload = {
        file_path: filePath,
        file_name: cleanFileName,
        status: "em_analise",
        document_type: typeKey,
        uploaded_at: new Date().toISOString(),
        uploaded_by: userId,
      } as any;

      if (existing) {
        const { error } = await supabase
          .from("student_documents")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("student_documents").insert({
          school_id: schoolId,
          student_id: id!,
          ...payload,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance-history", id] });
      queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
      setUploadingType(null);
      toast.success("Documento enviado! Aguardando análise.");
    },
    onError: (err: any) => {
      setUploadingType(null);
      toast.error(err.message || "Erro ao enviar documento");
    },
  });

  const setDocStatus = useMutation({
    mutationFn: async ({ item, status }: { item: { type: string; record: any | null; hasFile: boolean }; status: "aprovado" | "rejeitado" | "em_analise" | "pendente" }) => {
      if (!item.record) throw new Error("É necessário enviar o arquivo antes.");
      if ((status === "aprovado" || status === "rejeitado") && !item.hasFile) {
        throw new Error("Documento sem arquivo não pode ser aprovado/rejeitado.");
      }
      const { error } = await supabase
        .from("student_documents")
        .update({ status })
        .eq("id", item.record.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("student-documents")
      .createSignedUrl(filePath, 60);
    if (error) return null;
    return data?.signedUrl;
  };

  const handlePreview = async (doc: any) => {
    if (!doc?.file_path) return;
    const url = await getSignedUrl(doc.file_path);
    if (!url) return;
    setPreviewDoc({ ...doc, file_url: url });
  };

  const handleDownload = async (doc: any) => {
    if (!doc?.file_path) return;
    const url = await getSignedUrl(doc.file_path);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.file_name || "documento";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectFile = (docType: string) => {
    pendingTypeRef.current = docType;
    docInputRef.current?.click();
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docType = pendingTypeRef.current;
    if (file && docType) uploadDocMutation.mutate({ file, docType });
    if (docInputRef.current) docInputRef.current.value = "";
    pendingTypeRef.current = null;
  };

  const last5 = history.slice(0, 5);

  return (
    <AppLayout
      title="Entrega de Documentos"
      breadcrumbs={[
        { label: "Alunos", href: "/admin/alunos" },
        { label: student?.full_name || "Aluno", href: `/admin/alunos/${id}` },
        { label: "Entrega de Documentos" },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {student?.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-secondary/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
              <i className="ri-user-line text-2xl text-secondary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-primary">{student?.full_name || "—"}</h1>
            <p className="text-sm text-muted-foreground">
              {(student as any)?.classes?.name || "Sem turma"}
            </p>
          </div>
        </div>
        <Link
          to={`/admin/alunos/${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-card border border-border text-primary text-sm font-bold hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Ficha
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4 text-secondary" />
                  Checklist de Documentos
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Faça upload, baixe ou marque como entregue.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-muted-foreground">Entregues</div>
                <div className="text-lg font-bold text-secondary">
                  {totalEntregues}/{docsChecklist.length}
                </div>
                {totalPendentes > 0 && (
                  <div className="text-[10px] font-bold text-destructive flex items-center gap-1 justify-end mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {totalPendentes} pendente{totalPendentes > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              onChange={handleDocUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />

            {docsLoading ? (
              <div className="py-8 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {docsChecklist.map((item) => {
                  const aprovado = item.status === "aprovado";
                  const hasFile = !!item.record?.file_path;
                  const isUploading = uploadingType === item.type;
                  return (
                    <div
                      key={item.type}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/40 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <i
                          className={`ri-file-line text-lg ${aprovado ? "text-secondary" : "text-muted-foreground"}`}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-primary truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {hasFile ? item.record.file_name : "Nenhum arquivo enviado"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleDocStatus.mutate(item)}
                          disabled={toggleDocStatus.isPending}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors disabled:opacity-60",
                            aprovado
                              ? "bg-secondary/15 text-secondary hover:bg-secondary/25"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20",
                          )}
                          title="Alternar status"
                        >
                          {aprovado ? "✔ Aprovado" : "● Pendente"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectFile(item.type)}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border border-border text-xs font-bold text-primary hover:bg-accent transition-colors disabled:opacity-60"
                        >
                          {isUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          {hasFile ? "Trocar" : "Upload"}
                        </button>

                        {hasFile && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreview(item.record)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border border-border text-xs font-bold text-primary hover:bg-accent transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(item.record)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" /> Baixar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Histórico de atendimentos */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <History className="h-4 w-4 text-secondary" />
                Últimos Atendimentos
              </h4>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {last5.length}/{history.length}
              </span>
            </div>

            {last5.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Nenhum atendimento registrado para este aluno.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {last5.map((h: any) => (
                  <li key={h.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                          ACTION_BADGE[h.action_type] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {ACTION_LABEL[h.action_type] ?? h.action_type}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {h.notes && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                        "{h.notes}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="px-4 py-3 border-t border-border/40">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => setHistoryOpen(true)}
                disabled={history.length === 0}
              >
                Ver histórico completo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal histórico completo */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-secondary" />
              Histórico completo — {student?.full_name}
            </DialogTitle>
            <DialogDescription>
              Todos os atendimentos registrados pela secretaria para este aluno.
            </DialogDescription>
          </DialogHeader>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum atendimento registrado.
            </p>
          ) : (
            <ScrollArea className="max-h-[60vh] -mx-6 px-6">
              <ul className="divide-y divide-border/40">
                {history.map((h: any) => (
                  <li key={h.id} className="py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                          ACTION_BADGE[h.action_type] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {ACTION_LABEL[h.action_type] ?? h.action_type}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {h.from_status && h.to_status && (
                      <p className="text-[11px] text-muted-foreground">
                        {h.from_status} → {h.to_status}
                      </p>
                    )}
                    {h.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">"{h.notes}"</p>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview de documento */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.file_name || "Documento"}</DialogTitle>
          </DialogHeader>
          {previewDoc?.file_url && (
            <iframe
              src={previewDoc.file_url}
              className="flex-1 w-full rounded-lg border border-border"
              title="Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StudentsDocuments;
