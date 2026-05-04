import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NoAccess = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <i className="ri-shield-cross-line text-2xl text-destructive" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">Acesso não autorizado</h1>

        <p className="text-sm text-muted-foreground mb-6">
          Sua conta foi autenticada, mas ainda não possui permissão para acessar este sistema. Entre em contato com o
          administrador.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSignOut}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Sair
          </button>

          <Link to="/login" className="text-xs text-muted-foreground hover:text-primary">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
