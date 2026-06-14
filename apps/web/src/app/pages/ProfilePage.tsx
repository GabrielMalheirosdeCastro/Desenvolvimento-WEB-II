import { useEffect, useState } from "react";
import {
  User,
  Book,
  Calendar,
  Award,
  Settings,
  Bell,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme, type Tema } from "../theme/ThemeContext";
import { iniciaisNome } from "../auth/nome";

interface Perfil {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  tipo: string;
  eMentor: boolean;
  dataNascimento: string | null;
  curso: string | null;
  periodo: number | null;
  cra: number | null;
}

export function ProfilePage() {
  const { usuario, recarregar } = useAuth();
  const { tema, definirTema } = useTheme();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Campos editaveis (controlados).
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro(null);
      try {
        const res = await fetch("/api/usuario/perfil", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("falha");
        const data = await res.json();
        if (!ativo) return;
        const p: Perfil = data.perfil;
        setPerfil(p);
        setNome(p.nome ?? "");
        setEmail(p.email ?? "");
      } catch {
        if (!ativo) return;
        // Degrada para os dados ja presentes na sessao (useAuth).
        if (usuario) {
          setNome(usuario.nome ?? "");
          setEmail(usuario.email ?? "");
        }
        setErro("Não foi possível carregar todos os dados do perfil.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [usuario]);

  const nomeAtual = perfil?.nome ?? usuario?.nome ?? "";
  const emailAtual = perfil?.email ?? usuario?.email ?? "";
  const alterado = nome.trim() !== nomeAtual || email.trim() !== emailAtual;

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!alterado || salvando) return;
    setSalvando(true);
    setFeedback(null);

    const payload: { nome?: string; email?: string } = {};
    if (nome.trim() !== nomeAtual) payload.nome = nome.trim();
    if (email.trim() !== emailAtual) payload.email = email.trim();

    try {
      const res = await fetch("/api/usuario/perfil", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const cod = data?.error;
        const msg =
          cod === "email_em_uso"
            ? "Este e-mail já está em uso por outra conta."
            : cod === "email_invalido"
              ? "Informe um e-mail institucional FAESA válido."
              : cod === "nome_invalido"
                ? "O nome informado é inválido."
                : "Não foi possível salvar as alterações.";
        setFeedback({ tipo: "erro", texto: msg });
        return;
      }
      if (data?.perfil) {
        setPerfil(data.perfil);
        setNome(data.perfil.nome ?? "");
        setEmail(data.perfil.email ?? "");
      }
      await recarregar();
      setFeedback({ tipo: "ok", texto: "Perfil atualizado com sucesso." });
    } catch {
      setFeedback({ tipo: "erro", texto: "Falha de conexão ao salvar." });
    } finally {
      setSalvando(false);
    }
  }

  const iniciais = iniciaisNome(nomeAtual, emailAtual);
  const periodoLabel = perfil?.periodo != null ? `${perfil.periodo}º Período` : "—";
  const craLabel = perfil?.cra != null ? String(perfil.cra) : "—";

  const badges = [
    { name: "Primeira Semana", icon: "🎓", earned: true },
    { name: "5 Horas de Estudo", icon: "📚", earned: true },
    { name: "Meta Cumprida", icon: "🎯", earned: true },
    { name: "Mentor Ativo", icon: "👨‍🏫", earned: perfil?.eMentor ?? false },
    { name: "10 Posts no Fórum", icon: "💬", earned: false },
    { name: "Sequência 30 Dias", icon: "🔥", earned: false },
  ];

  const stats = [
    { label: "Horas de Estudo Total", value: "142h", icon: Book },
    { label: "Metas Cumpridas", value: "38", icon: Award },
    { label: "Dias Consecutivos", value: "12", icon: Calendar },
    { label: "Sessões de Mentoria", value: "5", icon: User },
  ];

  const pointsHistory = [
    { action: "Meta concluída", points: 50, date: "Hoje" },
    { action: "Sessão Pomodoro", points: 25, date: "Hoje" },
    { action: "Post no fórum", points: 10, date: "Ontem" },
    { action: "Avaliação de bem-estar", points: 15, date: "Ontem" },
  ];

  const totalPoints = 850;
  const nextBadgePoints = 1000;
  const pointsToNextBadge = nextBadgePoints - totalPoints;
  const progressPercentage = (totalPoints / nextBadgePoints) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-[#003366]">Meu Perfil</h1>
        <p className="text-[#6C757D]">Gerencie suas informações e preferências</p>
      </div>

      {/* Card de Pontuação */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0066CC] rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pontuação Total</h3>
              <p className="text-white/80 text-sm">Sistema de Gamificação</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-white/80 text-sm">pontos</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso para próximo badge</span>
            <span>{pointsToNextBadge} pontos restantes</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Informações do Perfil */}
      <form
        onSubmit={salvarPerfil}
        className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-[#003366] rounded-full flex items-center justify-center text-white text-4xl">
              {iniciais}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={carregando || salvando}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Matrícula</label>
                <input
                  type="text"
                  value={perfil?.matricula ?? usuario?.matricula ?? "—"}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={carregando || salvando}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Curso</label>
                <input
                  type="text"
                  value={perfil?.curso ?? "—"}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Período</label>
                <input
                  type="text"
                  value={periodoLabel}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">CRA</label>
                <input
                  type="text"
                  value={craLabel}
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
            </div>

            {erro && <p className="text-sm text-[#FF8C00]">{erro}</p>}
            {feedback && (
              <p
                className={`text-sm ${
                  feedback.tipo === "ok" ? "text-[#28A745]" : "text-[#dc2626]"
                }`}
              >
                {feedback.texto}
              </p>
            )}

            <button
              type="submit"
              disabled={!alterado || salvando || carregando}
              className="bg-[#003366] hover:bg-[#004080] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </form>

      {/* Estatísticas e Histórico de Pontos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-[#003366]/10 text-center">
              <div className="w-10 h-10 bg-[#0066CC]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <stat.icon className="text-[#0066CC]" size={20} />
              </div>
              <div className="text-2xl font-semibold text-[#003366] mb-1">{stat.value}</div>
              <div className="text-xs text-[#6C757D]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Histórico de Pontos Recentes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#0066CC]" size={20} />
            <h3 className="font-semibold text-[#003366]">Pontos Recentes</h3>
          </div>
          <div className="space-y-3">
            {pointsHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-[#003366]">{item.action}</div>
                  <div className="text-xs text-[#6C757D]">{item.date}</div>
                </div>
                <div className="font-semibold text-[#28A745]">+{item.points}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conquistas */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
        <div className="flex items-center gap-2 mb-6">
          <Award className="text-[#0066CC]" size={24} />
          <h2 className="text-xl text-[#003366]">Minhas Conquistas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg text-center transition-all ${
                badge.earned
                  ? "bg-gradient-to-br from-[#FFD700]/20 to-[#FF8C00]/20 border-2 border-[#FFD700]/50"
                  : "bg-[#F5F7FA] opacity-50"
              }`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className="text-sm font-medium text-[#003366]">{badge.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Notificações</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Notificações por e-mail</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Lembretes de metas</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Atualizações do fórum</span>
              <input type="checkbox" className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Sessões de mentoria</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Preferências</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6C757D] mb-2">Tema</label>
              <select
                value={tema}
                onChange={(e) => definirTema(e.target.value as Tema)}
                className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
              >
                <option value="claro">Claro</option>
                <option value="escuro">Escuro</option>
                <option value="auto">Automático</option>
              </select>
              <p className="mt-1 text-xs text-[#6C757D]">
                A preferência é salva neste dispositivo.
              </p>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Perfil público</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}