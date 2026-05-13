import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Megaphone,
  AlertTriangle,
  Building2,
  GraduationCap,
  Brain,
  UserCog,
  Inbox,
  ArrowRight,
  Plus,
  Filter,
  UserCheck,
  Play,
  CheckCircle2,
  Forward,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  source: string;
  priority: string;
  status: string | null;
  created_at: string;
  intervention_id: string | null;
  target_user_id: string | null;
  responsible_user_id: string | null;
  created_by: string | null;
  student_id?: string | null;
};

type ProfileLite = { id: string; full_name: string | null };
type StudentLite = { id: string; full_name: string };
type SchoolAnnouncementInsert = Database["public"]["Tables"]["school_announcements"]["Insert"];
type SchoolAnnouncementUpdate = Database["public"]["Tables"]["school_announcements"]["Update"];

const getErrorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const normalizeAnnouncement = (row: Partial<Announcement>): Announcement => ({
  id: row.id ?? "",
  title: row.title ?? "",
  content: row.content ?? "",
  audience: row.audience ?? "geral",
  source: row.source ?? "secretaria",
  priority: row.priority ?? "media",
  status: row.status ?? "aberto",
  created_at: row.created_at ?? new Date().toISOString(),
  intervention_id: row.intervention_id ?? null,
  target_user_id: row.target_user_id ?? null,
  responsible_user_id: row.responsible_user_id ?? null,
  created_by: row.created_by ?? null,
  student_id: row.student_id ?? null,
});

const PRIORITY_STYLES: Record<string, { wrap: string; bar: string; pill: string; label: string }> = {
  urgente: {
    wrap: "bg-rose-50/60 dark:bg-rose-500/5 hover:bg-rose-50",
    bar: "border-l-rose-600",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    label: "Crítica",
  },
  alta: {
    wrap: "bg-orange-50/50 dark:bg-orange-500/5 hover:bg-orange-50",
    bar: "border-l-orange-500",
    pill: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    label: "Alta",
  },
  media: {
    wrap: "bg-amber-50/40 dark:bg-amber-500/5 hover:bg-amber-50",
    bar: "border-l-amber-500",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    label: "Média",
  },
  baixa: {
    wrap: "bg-slate-50 dark:bg-muted/30 hover:bg-slate-100",
    bar: "border-l-slate-400",
    pill: "bg-slate-100 text-slate-700 dark:bg-muted/40 dark:text-slate-300",
    label: "Baixa",
  },
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  aberto: { label: "Aberto", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  em_andamento: { label: "Em andamento", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  aguardando: { label: "Aguardando", cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" },
  resolvido: { label: "Resolvido", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
};

const SOURCE_META: Record<string, { label: string; icon: LucideIcon; cls: string }> = {
  secretaria: { label: "Secretaria", icon: Building2, cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  coordenacao: { label: "Coordenação", icon: GraduationCap, cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  direcao: { label: "Direção", icon: Building2, cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  psicologia: { label: "Psicologia", icon: Brain, cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" },
  professor: { label: "Professor", icon: UserCog, cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  intervencao: { label: "Intervenção", icon: AlertTriangle, cls: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300" },
};

const AUDIENCE_LABEL: Record<string, string> = {
  geral: "Geral",
  professores: "Professores",
  psicologia: "Psicologia",
  professor: "Professor",
  secretaria: "Secretaria",
  coordenacao: "Coordenação",
  direcao: "Direção",
};

const CentralOperacional = () => {
  const { schoolId } = useSchoolId();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");

  const [newOpen, setNewOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<Announcement | null>(null);

  const queryKey = useMemo(() => ["central-operacional", schoolId] as const, [schoolId]);

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    enabled: !!schoolId,
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_announcements")
        .select(
          "id, title, content, audience, source, priority, status, created_at, intervention_id, target_user_id, responsible_user_id, created_by",
        )
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const announcements = ((data ?? []) as Announcement[]).map(normalizeAnnouncement);
      const interventionIds = Array.from(
        new Set(announcements.map((it) => it.intervention_id).filter(Boolean)),
      ) as string[];

      if (interventionIds.length === 0) return announcements;

      const { data: interventions } = await supabase
        .from("pedagogical_interventions")
        .select("id, student_id")
        .eq("school_id", schoolId!)
        .in("id", interventionIds);

      const map = new Map((interventions ?? []).map((i) => [i.id, i.student_id]));
      return announcements.map((it) => ({
        ...it,
        student_id: it.intervention_id ? map.get(it.intervention_id) ?? null : null,
      }));
    },
  });

  // Realtime
  useEffect(() => {
    if (!schoolId) return;
    const channel = supabase
      .channel(`central-op-${schoolId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_announcements", filter: `school_id=eq.${schoolId}` },
        (payload) => {
          queryClient.setQueryData<Announcement[]>(queryKey, (current = []) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as Partial<Announcement>)?.id;
              return oldId ? current.filter((item) => item.id !== oldId) : current;
            }

            const next = normalizeAnnouncement(payload.new as Partial<Announcement>);
            if (!next.id) return current;

            const exists = current.some((item) => item.id === next.id);
            const merged = exists
              ? current.map((item) => (item.id === next.id ? { ...item, ...next, student_id: item.student_id ?? next.student_id } : item))
              : [next, ...current];

            return merged
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 50);
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient, queryKey]);

  // Profiles batch fetch
  const profileIds = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.responsible_user_id) set.add(it.responsible_user_id);
      if (it.created_by) set.add(it.created_by);
    });
    return Array.from(set);
  }, [items]);

  const { data: profilesMap = new Map<string, ProfileLite>() } = useQuery({
    queryKey: ["central-op-profiles", profileIds.sort().join(",")],
    enabled: profileIds.length > 0,
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.id, p as ProfileLite]));
    },
  });

  // Filters
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterStatus !== "all" && (it.status ?? "aberto") !== filterStatus) return false;
      if (filterPriority !== "all" && it.priority !== filterPriority) return false;
      if (filterSource !== "all" && it.source !== filterSource) return false;
      if (filterAudience !== "all" && it.audience !== filterAudience) return false;
      return true;
    });
  }, [items, filterStatus, filterPriority, filterSource, filterAudience]);

  const visible = filtered.slice(0, 12);

  // Mutations
  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; patch: SchoolAnnouncementUpdate }) => {
      const { error } = await supabase
        .from("school_announcements")
        .update(payload.patch)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Erro ao atualizar")),
  });

  const handleAssumir = (it: Announcement) => {
    if (!user) return;
    updateMut.mutate(
      { id: it.id, patch: { responsible_user_id: user.id } },
      { onSuccess: () => toast.success("Demanda assumida") },
    );
  };
  const handleIniciar = (it: Announcement) => {
    updateMut.mutate(
      { id: it.id, patch: { status: "em_andamento", responsible_user_id: it.responsible_user_id ?? user?.id ?? null } },
      { onSuccess: () => toast.success("Demanda iniciada") },
    );
  };
  const handleConcluir = (it: Announcement) => {
    updateMut.mutate(
      { id: it.id, patch: { status: "resolvido" } },
      { onSuccess: () => toast.success("Demanda concluída") },
    );
  };

  const hasActiveFilter =
    filterStatus !== "all" || filterPriority !== "all" || filterSource !== "all" || filterAudience !== "all";

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              Central Operacional
              <span className="ml-2 text-xs font-semibold text-muted-foreground tabular-nums">
                ({filtered.length})
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              Demandas de Secretaria, Coordenação, Direção e Psicologia
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setNewOpen(true)}
          className="h-8 px-3 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Demanda
        </Button>
      </header>

      {/* Filtros */}
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filtros:
        </div>
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
          options={[
            { value: "all", label: "Todos status" },
            { value: "aberto", label: "Aberto" },
            { value: "em_andamento", label: "Em andamento" },
            { value: "aguardando", label: "Aguardando" },
            { value: "resolvido", label: "Resolvido" },
          ]}
        />
        <FilterSelect
          value={filterPriority}
          onChange={setFilterPriority}
          placeholder="Prioridade"
          options={[
            { value: "all", label: "Todas prioridades" },
            { value: "urgente", label: "Crítica" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Média" },
            { value: "baixa", label: "Baixa" },
          ]}
        />
        <FilterSelect
          value={filterSource}
          onChange={setFilterSource}
          placeholder="Origem"
          options={[
            { value: "all", label: "Todas origens" },
            { value: "secretaria", label: "Secretaria" },
            { value: "coordenacao", label: "Coordenação" },
            { value: "direcao", label: "Direção" },
            { value: "psicologia", label: "Psicologia" },
            { value: "professor", label: "Professor" },
            { value: "intervencao", label: "Intervenção" },
          ]}
        />
        <FilterSelect
          value={filterAudience}
          onChange={setFilterAudience}
          placeholder="Destino"
          options={[
            { value: "all", label: "Todos destinos" },
            { value: "geral", label: "Geral" },
            { value: "professores", label: "Professores" },
            { value: "psicologia", label: "Psicologia" },
            { value: "secretaria", label: "Secretaria" },
            { value: "coordenacao", label: "Coordenação" },
            { value: "direcao", label: "Direção" },
          ]}
        />
        {hasActiveFilter && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterStatus("all");
              setFilterPriority("all");
              setFilterSource("all");
              setFilterAudience("all");
            }}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">Carregando central operacional…</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {hasActiveFilter ? "Nenhuma demanda nos filtros atuais" : "Nenhuma demanda no momento"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Demandas de secretaria, coordenação, direção e psicologia aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {visible.map((it) => {
            const prio = PRIORITY_STYLES[it.priority] ?? PRIORITY_STYLES.media;
            const src = SOURCE_META[it.source] ?? SOURCE_META.secretaria;
            const status = STATUS_STYLES[it.status ?? "aberto"] ?? STATUS_STYLES.aberto;
            const SrcIcon = src.icon;
            const time = formatDistanceToNow(new Date(it.created_at), { addSuffix: true, locale: ptBR });
            const respName = it.responsible_user_id
              ? profilesMap.get(it.responsible_user_id)?.full_name ?? "—"
              : null;
            const isMine = user && it.responsible_user_id === user.id;
            const isResolved = (it.status ?? "aberto") === "resolvido";

            return (
              <li
                key={it.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-l-4 transition-colors",
                  prio.wrap,
                  prio.bar,
                  isResolved && "opacity-70",
                )}
              >
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 mt-0.5", src.cls)}>
                  <SrcIcon className="h-3 w-3" />
                  {src.label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-foreground truncate">{it.title}</p>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", prio.pill)}>
                      {prio.label}
                    </span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", status.cls)}>
                      {status.label}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      → {AUDIENCE_LABEL[it.audience] ?? it.audience}
                    </span>
                  </div>
                  {it.content && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{it.content}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px] text-muted-foreground">
                    <span>{time}</span>
                    {respName && (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <UserCheck className="h-3 w-3 text-emerald-600" />
                        {respName}
                        {isMine && <span className="text-emerald-600">(você)</span>}
                      </span>
                    )}
                    {!respName && !isResolved && (
                      <span className="italic">Sem responsável</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0 items-end">
                  {/* Ações operacionais */}
                  {!isResolved && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {!it.responsible_user_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssumir(it)}
                          className="h-6 px-2 text-[10px] gap-1"
                        >
                          <UserCheck className="h-3 w-3" /> Assumir
                        </Button>
                      )}
                      {(it.status ?? "aberto") === "aberto" && (
                        <Button
                          size="sm"
                          onClick={() => handleIniciar(it)}
                          className="h-6 px-2 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Play className="h-3 w-3" /> Iniciar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleConcluir(it)}
                        className="h-6 px-2 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setForwardTarget(it)}
                        className="h-6 px-2 text-[10px] gap-1"
                      >
                        <Forward className="h-3 w-3" /> Encaminhar
                      </Button>
                    </div>
                  )}

                  {it.student_id && (
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => navigate(`/admin/alunos/${it.student_id}/prontuario`)}
                      className="h-6 px-1 text-[10px] gap-1 text-primary"
                    >
                      Abrir ficha <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > visible.length && (
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/40 text-center">
          +{filtered.length - visible.length} demandas adicionais (use os filtros para refinar)
        </div>
      )}

      <NewAnnouncementModal
        open={newOpen}
        onOpenChange={setNewOpen}
        schoolId={schoolId}
        userId={user?.id ?? null}
        onCreated={() => queryClient.invalidateQueries({ queryKey })}
      />

      <ForwardModal
        announcement={forwardTarget}
        onOpenChange={(v) => !v && setForwardTarget(null)}
        schoolId={schoolId}
        onForwarded={() => {
          setForwardTarget(null);
          queryClient.invalidateQueries({ queryKey });
        }}
      />
    </section>
  );
};

/* ================== Filter Select ================== */
const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-7 w-auto min-w-[130px] text-[11px] bg-background">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} className="text-xs">
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/* ================== New Announcement Modal ================== */
const NewAnnouncementModal = ({
  open,
  onOpenChange,
  schoolId,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schoolId: string | null;
  userId: string | null;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("media");
  const [audience, setAudience] = useState("geral");
  const [source, setSource] = useState("secretaria");
  const [status, setStatus] = useState("aberto");
  const [responsibleId, setResponsibleId] = useState<string>("none");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentLite | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setPriority("media");
      setAudience("geral");
      setSource("secretaria");
      setStatus("aberto");
      setResponsibleId("none");
      setStudentSearch("");
      setSelectedStudent(null);
    }
  }, [open]);

  // Members (school profiles)
  const { data: members = [] } = useQuery({
    queryKey: ["central-op-members", schoolId],
    enabled: open && !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("school_id", schoolId!)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
  });

  // Students search
  const { data: students = [] } = useQuery({
    queryKey: ["central-op-students-search", schoolId, studentSearch],
    enabled: open && !!schoolId && studentSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("school_id", schoolId!)
        .ilike("full_name", `%${studentSearch}%`)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as StudentLite[];
    },
  });

  const handleSave = async () => {
    if (!schoolId || !title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    const payload: SchoolAnnouncementInsert = {
      school_id: schoolId,
      title: title.trim(),
      content: content.trim(),
      priority,
      audience,
      source,
      status,
      responsible_user_id: responsibleId === "none" ? null : responsibleId,
      created_by: userId,
    };
    const { error } = await supabase.from("school_announcements").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Demanda criada");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
          <DialogDescription>Cadastre uma demanda na central operacional</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="t-title" className="text-xs">Título *</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião com responsável" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="t-content" className="text-xs">Conteúdo</Label>
            <Textarea id="t-content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Detalhes da demanda…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Origem</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="coordenacao">Coordenação</SelectItem>
                  <SelectItem value="direcao">Direção</SelectItem>
                  <SelectItem value="psicologia">Psicologia</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Destino</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="professores">Professores</SelectItem>
                  <SelectItem value="psicologia">Psicologia</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="coordenacao">Coordenação</SelectItem>
                  <SelectItem value="direcao">Direção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Responsável</Label>
            <Select value={responsibleId} onValueChange={setResponsibleId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name ?? "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Aluno relacionado (opcional)</Label>
            {selectedStudent ? (
              <div className="flex items-center justify-between bg-muted/40 px-2 py-1.5 rounded text-xs">
                <span className="font-medium">{selectedStudent.full_name}</span>
                <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setSelectedStudent(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Digite o nome do aluno…"
                />
                {students.length > 0 && (
                  <ul className="border border-border rounded max-h-32 overflow-auto bg-popover">
                    {students.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentSearch("");
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          {s.full_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Criar demanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ================== Forward Modal ================== */
const ForwardModal = ({
  announcement,
  onOpenChange,
  schoolId,
  onForwarded,
}: {
  announcement: Announcement | null;
  onOpenChange: (v: boolean) => void;
  schoolId: string | null;
  onForwarded: () => void;
}) => {
  const [target, setTarget] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (announcement) setTarget("");
  }, [announcement]);

  const { data: members = [] } = useQuery({
    queryKey: ["central-op-members-fwd", schoolId],
    enabled: !!announcement && !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("school_id", schoolId!)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
  });

  const handleForward = async () => {
    if (!announcement || !target) return;
    setSaving(true);
    const { error } = await supabase
      .from("school_announcements")
      .update({ responsible_user_id: target, status: "aguardando" })
      .eq("id", announcement.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Demanda encaminhada");
    onForwarded();
  };

  return (
    <Dialog open={!!announcement} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Encaminhar demanda</DialogTitle>
          <DialogDescription>
            {announcement?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 py-2">
          <Label className="text-xs">Encaminhar para</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue placeholder="Selecione um responsável…" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.full_name ?? "Sem nome"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleForward} disabled={!target || saving}>
            {saving ? "Encaminhando…" : "Encaminhar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CentralOperacional;
