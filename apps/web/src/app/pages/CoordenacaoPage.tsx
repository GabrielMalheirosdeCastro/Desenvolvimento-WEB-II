import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  HeartPulse,
  MessageSquare,
  Library,
  ClipboardList,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// --------------------------------------------------------------
// Painel de Coordenação (RF14 / A4 RBAC)
// Consome GET /api/coordenacao/overview — endpoint protegido por
// requireRole('COORDENADOR') no backend. Esta tela só é alcançável
// por usuários COORDENADOR (RoleRoute), mas trata 403 defensivamente
// caso a sessão perca o papel.
// --------------------------------------------------------------

type Metricas = {
  totalAlunos: number;
  totalMentores: number;
  totalPlanos: number;
  totalAtividades: number;
  totalBemEstar: number;
  totalTopicosForum: number;
  totalRecursos: number;
};

type Estado =
  | { status: "carregando" }
  | { status: "negado" }
  | { status: "erro" }
  | { status: "ok"; metricas: Metricas; source: string };

export function CoordenacaoPage() {
  const [estado, setEstado] = useState<Estado>({ status: "carregando" });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/coordenacao/overview", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!ativo) return;
        if (res.status === 403) {
          setEstado({ status: "negado" });
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setEstado({
          status: "ok",
          metricas: json.metricas as Metricas,
          source: typeof json.source === "string" ? json.source : "db",
        });
      } catch {
        if (ativo) setEstado({ status: "erro" });
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (estado.status === "carregando") {
    return (
      <div className="flex items-center justify-center py-20 text-foreground">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Carregando indicadores…</span>
      </div>
    );
  }

  if (estado.status === "negado") {
    return (
      <div className="max-w-md mx-auto mt-10 bg-card rounded-xl border border-warning/30 p-8 text-center">
        <ShieldAlert className="mx-auto text-warning mb-3" size={40} />
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Acesso restrito
        </h2>
        <p className="text-sm text-muted-foreground">
          Este painel é exclusivo para a Coordenação.
        </p>
      </div>
    );
  }

  if (estado.status === "erro") {
    return (
      <div className="max-w-md mx-auto mt-10 bg-card rounded-xl border border-destructive/30 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Não foi possível carregar
        </h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro ao buscar os indicadores. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  const { metricas, source } = estado;

  const cards = [
    { icon: GraduationCap, label: "Alunos cadastrados", valor: metricas.totalAlunos },
    { icon: Users, label: "Mentores ativos", valor: metricas.totalMentores },
    { icon: BookOpen, label: "Planos de estudo", valor: metricas.totalPlanos },
    { icon: ClipboardList, label: "Atividades de estudo", valor: metricas.totalAtividades },
    { icon: HeartPulse, label: "Avaliações de bem-estar", valor: metricas.totalBemEstar },
    { icon: MessageSquare, label: "Tópicos no fórum", valor: metricas.totalTopicosForum },
    { icon: Library, label: "Recursos na biblioteca", valor: metricas.totalRecursos },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Painel de Coordenação
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indicadores institucionais agregados do Site de Acolhimento.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-card rounded-xl border border-border p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
              <c.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{c.valor}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {source === "fallback" && (
        <p className="text-xs text-warning">
          Indicadores indisponíveis no momento — exibindo valores padrão.
        </p>
      )}
    </div>
  );
}
