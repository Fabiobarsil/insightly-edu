import { useState } from "react";
import { Search } from "lucide-react";
import StudentSearchModal from "./StudentSearchModal";

/**
 * Barra de busca no topo da Secretaria Digital.
 * Abre o modal global de busca de alunos.
 */
const SecretaryTopBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full max-w-md px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
        >
          <Search className="w-4 h-4" />
          <span>Buscar aluno...</span>
        </button>
      </div>
      <StudentSearchModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SecretaryTopBar;
