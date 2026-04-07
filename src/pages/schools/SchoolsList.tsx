import { useEffect, useState } from "react";
import RoleLayout from "@/components/layout/RoleLayout";

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SchoolRow {
  id: string;
  name: string;
  created_at: string | null;
  status: "ativo" | "inativo"; // mock
}

const SchoolsList = () => {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolRow | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching schools:", error);
    }
    const rows: SchoolRow[] = (data ?? []).map((s) => ({
      ...s,
      status: "ativo" as const, // mock
    }));
    setSchools(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const openCreate = () => {
    setEditingSchool(null);
    setFormName("");
    setModalOpen(true);
  };

  const openEdit = (school: SchoolRow) => {
    setEditingSchool(school);
    setFormName(school.name);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Informe o nome da escola.");
      return;
    }
    setSaving(true);
    if (editingSchool) {
      const { error } = await supabase
        .from("schools")
        .update({ name: formName.trim() })
        .eq("id", editingSchool.id);
      if (error) {
        toast.error("Erro ao atualizar escola.");
        console.error(error);
      } else {
        toast.success("Escola atualizada com sucesso!");
      }
    } else {
      const { error } = await supabase
        .from("schools")
        .insert({ name: formName.trim() });
      if (error) {
        toast.error("Erro ao criar escola.");
        console.error(error);
      } else {
        toast.success("Escola criada com sucesso!");
      }
    }
    setSaving(false);
    setModalOpen(false);
    fetchSchools();
  };

  const handleDeactivate = (school: SchoolRow) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.id === school.id
          ? { ...s, status: s.status === "ativo" ? "inativo" : "ativo" }
          : s
      )
    );
    toast.success(
      school.status === "ativo"
        ? "Escola desativada (mock)."
        : "Escola reativada (mock)."
    );
  };

  const filtered = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleLayout title="Superadmin">
      <div className="flex items-start justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Escolas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as escolas cadastradas na plataforma.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-[14px] font-bold text-sm hover:bg-secondary/90 transition-colors"
        >
          <i className="ri-add-line" /> Nova Escola
        </button>
      </div>

      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-2 border border-border rounded-[12px] px-3 py-2 bg-background max-w-sm">
            <i className="ri-search-line text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Buscar escola..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Criada em
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma escola encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((school) => (
                  <tr
                    key={school.id}
                    className="border-b border-border/20 hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {school.name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {school.created_at
                        ? format(new Date(school.created_at), "dd/MM/yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.status === "ativo"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {school.status === "ativo" ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(school)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Editar"
                        >
                          <i className="ri-pencil-line" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(school)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={school.status === "ativo" ? "Desativar" : "Reativar"}
                        >
                          <i
                            className={
                              school.status === "ativo"
                                ? "ri-forbid-line"
                                : "ri-checkbox-circle-line"
                            }
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
          Mostrando {filtered.length} de {schools.length} escolas
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? "Editar Escola" : "Nova Escola"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Nome da escola
              </label>
              <input
                className="w-full border border-border rounded-[12px] px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: Escola Municipal São Paulo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="opacity-50">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                CNPJ <span className="text-xs text-muted-foreground">(em breve)</span>
              </label>
              <input
                className="w-full border border-border rounded-[12px] px-3 py-2 text-sm bg-muted outline-none cursor-not-allowed"
                placeholder="00.000.000/0000-00"
                disabled
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-[12px] text-sm font-medium border border-border hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-[12px] text-sm font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RoleLayout>
  );
};

export default SchoolsList;
