import { useEffect, useState } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface SchoolRow {
  id: string;
  name: string;
  created_at: string | null;
}

const SuperadminDashboard = () => {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [schoolsRes, usersRes] = await Promise.all([
        supabase.from("schools").select("*"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (usersRes.count !== null) setTotalUsers(usersRes.count);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalSchools = schools.length;
  // Mock active/inactive status based on created_at existence
  const activeSchools = schools.filter((s) => s.created_at).length;
  const inactiveSchools = totalSchools - activeSchools;

  const kpis = [
    { label: "Total de Escolas", value: totalSchools, icon: "ri-building-2-line", color: "text-primary" },
    { label: "Escolas Ativas", value: activeSchools, icon: "ri-checkbox-circle-line", color: "text-emerald-500" },
    { label: "Escolas Inativas", value: inactiveSchools, icon: "ri-close-circle-line", color: "text-destructive" },
    { label: "Total de Usuários", value: totalUsers, icon: "ri-group-line", color: "text-primary" },
  ];

  return (
    <RoleLayout title="Superadmin">
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-foreground">Painel do Superadmin</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <i className={`${kpi.icon} ${kpi.color} text-xl`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "—" : kpi.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schools Table */}
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="p-5 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">Escolas Cadastradas</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : schools.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma escola encontrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>
                        {school.created_at
                          ? format(new Date(school.created_at), "dd/MM/yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                          Ativa
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleLayout>
  );
};

export default SuperadminDashboard;
