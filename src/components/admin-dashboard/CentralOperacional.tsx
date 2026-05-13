import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  source: string;
  priority: string;
  created_at: string;
  intervention_id: string | null;
  target_user_id: string | null;
  student_id?: string | null;
};

const PRIORITY_STYLES: Record<string, { wrap: string; bar: string; pill: string; label: string }> = {
  urgente: {
    wrap: "bg-rose-50/60 dark:bg-rose-500/5 hover:bg-rose-50",
    bar: "border-l-rose-600",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    label: "Urgente",
  },
  alta: {
    wrap: "bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-50",
    bar: "border-l-rose-500",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    label: "Alta",
  },
  media: {
    wrap: "bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50",
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
};

const CentralOperacional = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["central-operacional", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_announcements")
        .select("id, title, content, audience, source, priority, created_at, intervention_id, target_user_id")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      const announcements = (data ?? []) as Announcement[];
      const interventionIds = Array.from(
        new Set(announcements.map((item) => item.intervention_id).filter(Boolean)),
      ) as string[];

      if (interventionIds.length === 0) return announcements;

      const { data: interventions, error: interventionsError } = await supabase
        .from("pedagogical_interventions")
        .select("id, student_id")
        .eq("school_id", schoolId!)
        .in("id", interventionIds);

      if (interventionsError) throw interventionsError;

      const studentByIntervention = new Map(
        (interventions ?? []).map((intervention) => [intervention.id, intervention.student_id]),
      );

      return announcements.map((item) => ({
        ...item,
        student_id: item.intervention_id ? studentByIntervention.get(item.intervention_id) ?? null : null,
      }));
    },
  });

  const visible = useMemo(() => items.slice(0, 8), [items]);

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Central Operacional
              <span className="ml-2 text-xs font-semibold text-muted-foreground tabular-nums">
                ({items.length})
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Demandas, avisos e comunicação institucional
            </p>
          </div>
        </div>
        {items.length > visible.length && (
          <span className="text-[11px] font-medium text-muted-foreground">
            +{items.length - visible.length} mais
          </span>
        )}
      </header>

      {isLoading ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">Carregando central operacional…</div>
      ) : items.length === 0 ? (
        <div className="px-4 py-10 flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Nenhum aviso no momento</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Quando a secretaria, coordenação, direção ou psicologia publicarem demandas e avisos, eles
            aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {visible.map((it) => {
            const prio = PRIORITY_STYLES[it.priority] ?? PRIORITY_STYLES.media;
            const src = SOURCE_META[it.source] ?? SOURCE_META.secretaria;
            const SrcIcon = src.icon;
            const time = formatDistanceToNow(new Date(it.created_at), { addSuffix: true, locale: ptBR });
            return (
              <li
                key={it.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-l-4 transition-colors",
                  prio.wrap,
                  prio.bar,
                )}
              >
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 mt-0.5", src.cls)}>
                  <SrcIcon className="h-3 w-3" />
                  {src.label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground truncate">{it.title}</p>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", prio.pill)}>
                      {prio.label}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {AUDIENCE_LABEL[it.audience] ?? it.audience}
                    </span>
                  </div>
                  {it.content && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {it.content}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{time}</p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {(() => {
                    const studentId = it.student_id ?? null;
                    if (studentId) {
                      return (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/alunos/${studentId}/prontuario`)}
                          className="h-7 px-2.5 text-[11px] gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                          Abrir ficha <ArrowRight className="h-3 w-3" />
                        </Button>
                      );
                    }
                    if (it.intervention_id) {
                      return (
                        <Button
                          size="sm"
                          onClick={() => navigate("/admin/coordenacao")}
                          className="h-7 px-2.5 text-[11px] gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                          Abrir <ArrowRight className="h-3 w-3" />
                        </Button>
                      );
                    }
                    return (
                      <Button
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById("kanban-section");
                          el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="h-7 px-2.5 text-[11px] gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        Ver detalhes <ArrowRight className="h-3 w-3" />
                      </Button>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CentralOperacional;
