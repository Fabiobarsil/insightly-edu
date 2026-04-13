import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onDataRefresh: () => void;
}

const DashboardHeader = ({ selectedYear, onYearChange, onDataRefresh }: DashboardHeaderProps) => {
  const [promoting, setPromoting] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const { data, error } = await supabase.rpc("promote_students", {
        p_year: selectedYear,
      });
      if (error) throw error;
      toast.success(`Promoção concluída com sucesso! ${data ?? 0} aluno(s) promovido(s).`);
      onDataRefresh();
    } catch (err: any) {
      toast.error("Erro ao promover alunos: " + (err.message || "Tente novamente."));
    } finally {
      setPromoting(false);
    }
  };

  const handleCloseYear = () => {
    toast.info("Funcionalidade de fechamento de ano será habilitada após validação.");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 justify-end">
      <Select
        value={String(selectedYear)}
        onValueChange={(v) => onYearChange(Number(v))}
      >
        <SelectTrigger className="w-[140px] rounded-2xl border-border/60 bg-card shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handlePromote}
        disabled={promoting}
        className="rounded-2xl shadow-sm px-5"
      >
        {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Promover Alunos
      </Button>

      <Button
        variant="outline"
        onClick={handleCloseYear}
        className="rounded-2xl shadow-sm px-5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
      >
        Fechar Ano
      </Button>
    </div>
  );
};

export default DashboardHeader;
