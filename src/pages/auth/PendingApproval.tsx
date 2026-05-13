import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logoCertus from "@/assets/logo-certus.png";

export default function PendingApproval() {
  const { signOut, refreshAccess, status } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-primary">CertusEdu</span>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-8">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <i className="ri-time-line text-2xl" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Aguardando aprovação</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua solicitação de acesso foi enviada para a coordenação da escola. Você receberá acesso assim que for aprovada.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => refreshAccess()}
              className="w-full border border-border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Verificar novamente
            </button>
            <button
              onClick={() => signOut()}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Sair
            </button>
          </div>

          {status && status !== "pending" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Status atual: <strong>{status}</strong>.{" "}
              <Link to="/" className="text-primary underline">
                Ir para o sistema
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
