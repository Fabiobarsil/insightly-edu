import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

const MESSAGES = [
  "Lembre-se de beber água 💧",
  "Que tal uma pausa de 2 minutos para respirar? 🌿",
  "Você está fazendo um ótimo trabalho! ✨",
  "Alongue os ombros por um instante 🧘",
  "Respire fundo. Uma tarefa de cada vez 🌤️",
  "Pequenos progressos também contam 🌱",
  "Sorria — alguém precisa do seu sorriso hoje 😊",
  "Hidrate-se e descanse os olhos por 20s 👀",
  "Organização tranquila vence pressa ansiosa 🧩",
  "Você cuida de muita gente. Cuide de você também 💛",
];

const pickRandom = (exclude?: string) => {
  const pool = exclude ? MESSAGES.filter((m) => m !== exclude) : MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
};

const MomentoCertus = () => {
  const [message, setMessage] = useState<string>(() => pickRandom());

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage((prev) => pickRandom(prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">
            Momento Certus
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMessage((prev) => pickRandom(prev))}
          className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label="Nova mensagem"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      <p className="text-sm font-light italic text-muted-foreground leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default MomentoCertus;
