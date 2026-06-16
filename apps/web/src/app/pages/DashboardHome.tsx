import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Target, Clock, Flame, Award, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../auth/AuthContext";
import { primeiroNome } from "../auth/nome";

type WeekPoint = { day: string; hours: number };
type Badge = { name: string; icon: string };
type Activity = { id?: number; title: string; date: string; type: string; status: string };
type Streak = { atual: number; recorde: number };

const FALLBACK_WEEK: WeekPoint[] = [
  { day: "Seg", hours: 4 }, { day: "Ter", hours: 5 }, { day: "Qua", hours: 3 },
  { day: "Qui", hours: 6 }, { day: "Sex", hours: 4 }, { day: "Sáb", hours: 2 },
  { day: "Dom", hours: 1 },
];
const FALLBACK_BADGES: Badge[] = [
  { name: "Primeira Semana", icon: "🎓" },
  { name: "5 Horas de Estudo", icon: "📚" },
  { name: "Meta Cumprida", icon: "🎯" },
];
const FALLBACK_UPCOMING: Activity[] = [
  { title: "Revisão de Cálculo I", date: "13/03", type: "Estudo", status: "pending" },
  { title: "Trabalho de Programação", date: "15/03", type: "Entrega", status: "pending" },
  { title: "Sessão de Mentoria", date: "16/03", type: "Mentoria", status: "scheduled" },
  { title: "Avaliação de Bem-estar", date: "18/03", type: "Questionário", status: "pending" },
];

// Mapeia o tipo de atividade para a tela correspondente (H2 — navegação do dashboard).
function destinoPorTipo(tipo?: string): string {
  switch ((tipo ?? "").trim().toLowerCase()) {
    case "mentoria":
      return "/dashboard/mentoria";
    case "questionário":
    case "questionario":
      return "/dashboard/bem-estar";
    case "estudo":
    case "entrega":
      return "/dashboard/plano-estudos";
    default:
      return "/dashboard";
  }
}

export function DashboardHome() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const saudacaoNome = primeiroNome(usuario?.nome);
  const [weekData, setWeekData] = useState<WeekPoint[]>(FALLBACK_WEEK);
  const [recentBadges, setRecentBadges] = useState<Badge[]>(FALLBACK_BADGES);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>(FALLBACK_UPCOMING);
  const [streak, setStreak] = useState<Streak>({ atual: 12, recorde: 18 });

  useEffect(() => {
    fetch("/api/dashboard/week").then((r) => r.json()).then((j) => {
      if (Array.isArray(j?.data)) setWeekData(j.data);
    }).catch(() => {});
    fetch("/api/dashboard/badges").then((r) => r.json()).then((j) => {
      if (Array.isArray(j?.items)) setRecentBadges(j.items);
    }).catch(() => {});
    fetch("/api/dashboard/upcoming").then((r) => r.json()).then((j) => {
      if (Array.isArray(j?.items)) setUpcomingActivities(j.items);
    }).catch(() => {});
    fetch("/api/dashboard/streak").then((r) => r.json()).then((j) => {
      if (typeof j?.atual === "number") {
        setStreak({ atual: j.atual, recorde: j.recorde ?? j.atual });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Bem-vindo de volta, {saudacaoNome}! 👋</h1>
        <p className="text-muted-foreground">
          Aqui está um resumo do seu progresso acadêmico
        </p>
      </div>

      {/* Cards de Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/plano-estudos")}
          className="text-left bg-card rounded-lg shadow-sm p-6 border border-border transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="text-primary" size={24} />
            </div>
            <span className="text-2xl font-semibold text-foreground">85%</span>
          </div>
          <h3 className="text-lg mb-1 text-foreground">Metas da Semana</h3>
          <p className="text-sm text-muted-foreground">6 de 7 concluídas</p>
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/plano-estudos")}
          className="text-left bg-card rounded-lg shadow-sm p-6 border border-border transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Clock className="text-success" size={24} />
            </div>
            <span className="text-2xl font-semibold text-foreground">25h</span>
          </div>
          <h3 className="text-lg mb-1 text-foreground">Horas de Estudo</h3>
          <p className="text-sm text-muted-foreground">Esta semana</p>
          <p className="text-sm text-success mt-2">↑ 15% vs. semana anterior</p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/bem-estar")}
          className="text-left bg-card rounded-lg shadow-sm p-6 border border-border transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Flame className="text-warning" size={24} />
            </div>
            <span className="text-2xl font-semibold text-foreground">{streak.atual}</span>
          </div>
          <h3 className="text-lg mb-1 text-foreground">Sequência de Dias</h3>
          <p className="text-sm text-muted-foreground">Dias consecutivos (recorde: {streak.recorde})</p>
          <p className="text-sm text-warning mt-2">🔥 Continue assim!</p>
        </button>
      </div>

      {/* Gráfico de Horas de Estudo */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-primary" size={24} />
          <h2 className="text-xl text-foreground">Horas de Estudo Semanal</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="hours" fill="var(--primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Atividades */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-primary" size={24} />
            <h2 className="text-xl text-foreground">Próximas Atividades</h2>
          </div>
          <div className="space-y-4">
            {upcomingActivities.map((activity, index) => (
              <button
                key={index}
                type="button"
                onClick={() => navigate(destinoPorTipo(activity.type))}
                className="w-full text-left flex items-center gap-4 p-3 bg-muted rounded-lg border border-border transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {activity.date} • {activity.type}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === "scheduled"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {activity.status === "scheduled" ? "Agendado" : "Pendente"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Badges Recentes */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-primary" size={24} />
            <h2 className="text-xl text-foreground">Conquistas Recentes</h2>
          </div>
          <div className="space-y-4">
            {recentBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-success/10 rounded-lg border border-primary/20">
                <div className="text-4xl">{badge.icon}</div>
                <div>
                  <h4 className="font-medium text-foreground">{badge.name}</h4>
                  <p className="text-sm text-muted-foreground">Desbloqueado recentemente</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/perfil")}
            className="mt-4 w-full text-center text-primary hover:text-foreground py-2 border border-primary rounded-lg hover:bg-primary/5 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver Todas as Conquistas
          </button>
        </div>
      </div>
    </div>
  );
}