import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, UserPlus, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import StudentSearchModal from "./StudentSearchModal";

interface SecretaryQuickActionsBarProps {
  context: string;
  onContextChange: (value: string) => void;
  onNewRequest?: () => void;
}

/**
 * Barra horizontal de Ações Rápidas + Seletor de Contexto.
 * Substitui o painel vertical lateral e a busca de aluno do topo.
 */
const SecretaryQuickActionsBar = ({
  context,
  onContextChange,
  onNewRequest,
}: SecretaryQuickActionsBarProps) => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ["secretary-context-classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade")
        .eq("school_id", schoolId)
        .order("name", { ascending: true });
      return data || [];
    },
    enabled: !!schoolId,
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => onNewRequest?.()}
            className="gap-2"
          >
            <FilePlus2 className="h-4 w-4" />
            Nova Solicitação
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/alunos/novo")}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nova Matrícula
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Gerenciar Alunos
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/documentos")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Novo Documento
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Contexto:
          </span>
          <Select value={context} onValueChange={onContextChange}>
            <SelectTrigger className="h-9 w-[240px] text-sm">
              <SelectValue placeholder="Selecionar contexto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visão Geral (Toda a Escola)</SelectItem>
              {classes.length > 0 && (
                <>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.grade ? ` · ${c.grade}` : ""}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StudentSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default SecretaryQuickActionsBar;
