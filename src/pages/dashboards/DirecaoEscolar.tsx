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
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  aberto: { label: "Aberto", class: "bg-blue-100 text-blue-700" },
  pendente: { label: "Aberto", class: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  "em andamento": { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  concluido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
  resolvido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
};

const isOpen = (s: string) => s === "aberto" || s === "pendente";
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
        .select("id, status, created_at, student_id, student_name, request_type, priority")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis = useMemo(() => {
    const abertas = requests.filter((r) => isOpen(r.status)).length;
    const andamento = requests.filter((r) => isInProgress(r.status)).length;
    const concluidas = requests.filter((r) => isDone(r.status)).length;
    return { abertas, andamento, concluidas };
  }, [requests]);

  const atrasadas = useMemo(
    () =>
      requests.filter(
        (r) => !isDone(r.status) && differenceInDays(new Date(), new Date(r.created_at)) > 3
      ),
    [requests]
  );

  const lista = useMemo(
    () => requests.filter((r) => !isDone(r.status)).slice(0, 20),
    [requests]
  );

  const loading = loadingSchool || isLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Direção Escolar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Painel de acompanhamento das demandas operacionais da secretaria.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demandas Abertas</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{loading ? "—" : kpis.abertas}</div>
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
              {lista.map((r) => {
                const days = differenceInDays(new Date(), new Date(r.created_at));
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.aberto;
                const overdue = !isDone(r.status) && days > 3;
                return (
                  <li
                    key={r.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.student_name || "Aluno não identificado"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.request_type || "Demanda"}
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
                        disabled={!r.student_id}
                        onClick={() => navigate(`/secretaria/matricula/${r.student_id}`)}
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
