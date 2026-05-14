import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const MOTIVATIONAL_QUOTES = [
  "Organização hoje, tranquilidade amanhã.",
  "Resolver pendências cedo economiza tempo depois.",
  "Documentos em dia, rotina em paz.",
  "Hoje é um bom dia para fechar ciclos.",
  "Cada tarefa concluída melhora o dia de alguém.",
  "Pequenos passos geram grandes resultados.",
  "Uma escola organizada transforma vidas.",
  "Planejamento é o primeiro passo para o sucesso.",
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const Topbar = ({ title, breadcrumbs }: TopbarProps) => {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [motivationalQuote] = useState(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setProfileName(data.full_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const firstName = profileName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário";
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 bg-sidebar px-8 py-4 flex items-center justify-between z-[5] max-[900px]:px-5 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
      <div>
        <h2 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
          {getGreeting()}, {firstName}
        </h2>
        <p className="text-[12px] text-sidebar-foreground/60 mt-0.5 capitalize">{today} · {motivationalQuote}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right max-[640px]:hidden">
          <p className="text-sm font-medium text-sidebar-foreground">{profileName || firstName}</p>
          <p className="text-[11px] text-sidebar-foreground/50">{user?.email}</p>
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={firstName}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-sidebar-foreground/15"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-sidebar-foreground/10 flex items-center justify-center text-sidebar-foreground font-semibold text-sm ring-1 ring-sidebar-foreground/15">
            {firstName[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
