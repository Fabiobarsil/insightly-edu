import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import StudentsList from "./pages/students/StudentsList.tsx";
import StudentsCreate from "./pages/students/StudentsCreate.tsx";
import StudentsEdit from "./pages/students/StudentsEdit.tsx";
import StudentsDetail from "./pages/students/StudentsDetail.tsx";

import GuardiansList from "./pages/guardians/GuardiansList.tsx";
import GuardiansCreate from "./pages/guardians/GuardiansCreate.tsx";
import GuardiansDetail from "./pages/guardians/GuardiansDetail.tsx";

import TeachersList from "./pages/teachers/TeachersList.tsx";
import TeachersCreate from "./pages/teachers/TeachersCreate.tsx";
import TeachersDetail from "./pages/teachers/TeachersDetail.tsx";

import ClassesList from "./pages/classes/ClassesList.tsx";
import ClassesCreate from "./pages/classes/ClassesCreate.tsx";

import GradeEntry from "./pages/grades/GradeEntry.tsx";
import GradeHistory from "./pages/grades/GradeHistory.tsx";

import AttendanceRecord from "./pages/attendance/AttendanceRecord.tsx";
import AttendanceView from "./pages/attendance/AttendanceView.tsx";
import AttendanceReports from "./pages/attendance/AttendanceReports.tsx";

import Documents from "./pages/documents/Documents.tsx";
import OfficialDocuments from "./pages/documents/OfficialDocuments.tsx";

import Communication from "./pages/communication/Communication.tsx";
import Settings from "./pages/settings/Settings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          <Route path="/alunos" element={<StudentsList />} />
          <Route path="/alunos/novo" element={<StudentsCreate />} />
          <Route path="/alunos/:id" element={<StudentsDetail />} />
          <Route path="/alunos/:id/editar" element={<StudentsEdit />} />

          <Route path="/responsaveis" element={<GuardiansList />} />
          <Route path="/responsaveis/novo" element={<GuardiansCreate />} />
          <Route path="/responsaveis/:id" element={<GuardiansDetail />} />
          <Route path="/responsaveis/:id/editar" element={<GuardiansCreate />} />

          <Route path="/professores" element={<TeachersList />} />
          <Route path="/professores/novo" element={<TeachersCreate />} />
          <Route path="/professores/:id" element={<TeachersDetail />} />
          <Route path="/professores/:id/editar" element={<TeachersCreate />} />

          <Route path="/turmas" element={<ClassesList />} />
          <Route path="/turmas/novo" element={<ClassesCreate />} />
          <Route path="/turmas/:id/editar" element={<ClassesCreate />} />

          <Route path="/notas" element={<GradeEntry />} />
          <Route path="/notas/historico" element={<GradeHistory />} />

          <Route path="/frequencia" element={<AttendanceRecord />} />
          <Route path="/frequencia/consulta" element={<AttendanceView />} />
          <Route path="/frequencia/relatorios" element={<AttendanceReports />} />

          <Route path="/documentos" element={<Documents />} />
          <Route path="/documentos-oficiais" element={<OfficialDocuments />} />

          <Route path="/comunicacao" element={<Communication />} />
          <Route path="/configuracoes" element={<Settings />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
