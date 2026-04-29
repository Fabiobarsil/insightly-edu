import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ClipboardList, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import RoleLayout from "@/components/layout/RoleLayout";

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  aberto: { label: "Pendente", class: "bg-blue-100 text-blue-700" },
  pendente: { label: "Pendente", class: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  "em andamento": { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  concluido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
  resolvido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
};

const PRIORITY_LABEL: Record<string, { label: string; class: string }> = {
  urgente: { label: "Urgente", class: "bg-destructive/15 text-destructive" },
  alta: { label: "Alta", class: "bg-orange-500/15 text-orange-700" },
  media: { label: "Média", class: "bg-blue-500/15 text-blue-700" },
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
};

const isPending = (s: string) => s === "aberto" || s === "pendente";
const isInProgress = (s: string) => s === "em_andamento" || s === "em andamento";
const isDone = (s: string) => s === "concluido" || s === "resolvido";

export default function DirecaoEscolar() {
  const navigate = useNavigate();
  const { schoolId, loading: loadingSchool } = useSchoolId();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["direcao-secretary-requests", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis = useMemo(() => {
    const pendentes = requests.filter((r) => isPending(r.status)).length;
    const andamento = requests.filter((r) => isInProgress(r.status)).length;
    const concluidas = requests.filter((r) => isDone(r.status)).length;
    return { pendentes, andamento, concluidas };
  }, [requests]);

  const atrasadas = useMemo(
    () =>
      requests.filter(
        (r) => !isDone(r.status) && differenceInDays(new Date(), new Date(r.created_at)) > 3
      ),
    [requests]
  );

  const lista = useMemo(
    () =>
      requests
        .filter((r) => !isDone(r.status))
        .sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .slice(0, 20),
    [requests]
  );

  const loading = loadingSchool || isLoading;

  return (
    <RoleLayout title="Direção Escolar">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <header>
          <p className="text-sm text-muted-foreground">
            Painel de acompanhamento das demandas operacionais da secretaria.
          </p>
        </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demandas Pendentes</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? "—" : kpis.pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? "—" : kpis.andamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? "—" : kpis.concluidas}</div>
          </CardContent>
        </Card>
      </section>

      {/* Alerta */}
      {atrasadas.length > 0 && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ⚠️ {atrasadas.length} {atrasadas.length === 1 ? "demanda" : "demandas"} com mais de 3 dias em aberto
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Ação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Ação</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando demandas...</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma demanda pendente no momento.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lista.map((r: any) => {
                const days = differenceInDays(new Date(), new Date(r.created_at));
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.pendente;
                const pr = PRIORITY_LABEL[r.priority] || PRIORITY_LABEL.media;
                const overdue = !isDone(r.status) && days > 3;
                return (
                  <li
                    key={r.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {r.student_name || "Aluno não identificado"}
                        </p>
                        <Badge variant="secondary" className={pr.class}>
                          {pr.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {r.request_type}
                        {r.description ? ` · ${r.description}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Criada em {format(new Date(r.created_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className={st.class}>
                        {st.label}
                      </Badge>
                      <span
                        className={`text-xs ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                      >
                        {days === 0
                          ? "hoje"
                          : `${days} ${days === 1 ? "dia" : "dias"}`}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => navigate(`/secretaria/atendimento/${r.id}`)}
                        className="gap-1"
                      >
                        Atender <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
