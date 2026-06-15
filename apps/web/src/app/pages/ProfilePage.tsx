import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Award,
  Settings,
  Bell,
  Trophy,
  TrendingUp,
  Download,
  Trash2,
  ShieldCheck,
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

interface ConquistaItem {
  codigo: string;
  titulo: string;
  descricao: string | null;
  icone: string | null;
  pontos: number;
  earned: boolean;
  conquistadaEm: string | null;
}

interface HistoricoItem {
  acao: string;
  pontos: number;
  data: string;
}

interface GamificacaoPerfil {
  source: string;
  pontosTotais: number;
  rankingPosicao: number | null;
  streakAtual: number;
  streakRecorde: number;
  conquistas: ConquistaItem[];
  historico: HistoricoItem[];
}

interface RankingItem {
  posicao: number;
  nome: string;
  pontos: number;
  eu: boolean;
}

export function ProfilePage() {
  const { usuario, recarregar, logout } = useAuth();
  const { tema, definirTema } = useTheme();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Gamificação (RF13) — perfil de pontos/conquistas e ranking entre alunos.
  const [gamPerfil, setGamPerfil] = useState<GamificacaoPerfil | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  // Campos editaveis (controlados).
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Privacidade / LGPD (D7 / RNF09): exportacao e exclusao de dados.
  const [exportando, setExportando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [privacidadeFeedback, setPrivacidadeFeedback] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);

  // Exporta os dados pessoais do titular como arquivo JSON (download local).
  async function exportarDados() {
    setExportando(true);
    setPrivacidadeFeedback(null);
    try {
      const res = await fetch("/api/usuario/dados", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("falha");
      const dados = await res.json();
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-faesa-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPrivacidadeFeedback({ tipo: "ok", texto: "Dados exportados com sucesso." });
    } catch {
      setPrivacidadeFeedback({
        tipo: "erro",
        texto: "Não foi possível exportar os dados agora.",
      });
    } finally {
      setExportando(false);
    }
  }

  // Exclui (anonimiza) a conta do titular. Operacao irreversivel.
  async function excluirConta() {
    setExcluindo(true);
    setPrivacidadeFeedback(null);
    try {
      const res = await fetch("/api/usuario/conta", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmar: true }),
      });
      if (!res.ok) throw new Error("falha");
      // Sessao ja foi encerrada no servidor; limpa o estado e volta ao login.
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setExcluindo(false);
      setConfirmandoExclusao(false);
      setPrivacidadeFeedback({
        tipo: "erro",
        texto: "Não foi possível excluir a conta agora.",
      });
    }
  }

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

  // Carrega gamificação e ranking (degrada silenciosamente quando indisponível).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [resPerfil, resRanking] = await Promise.all([
          fetch("/api/gamificacao/perfil", {
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/gamificacao/ranking", {
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
        ]);
        if (ativo && resPerfil.ok) {
          const data = (await resPerfil.json()) as GamificacaoPerfil;
          setGamPerfil(data);
        }
        if (ativo && resRanking.ok) {
          const data = await resRanking.json();
          setRanking(Array.isArray(data?.items) ? data.items : []);
        }
      } catch {
        // Mantém os valores de fallback já renderizados.
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

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

  const temGamificacao = gamPerfil != null && gamPerfil.source === "db";

  const badges =
    temGamificacao && gamPerfil!.conquistas.length > 0
      ? gamPerfil!.conquistas.map((c) => ({
          name: c.titulo,
          icon: c.icone || "🏅",
          earned: c.earned,
        }))
      : [
          { name: "Primeira Semana", icon: "🎓", earned: true },
          { name: "5 Horas de Estudo", icon: "📚", earned: true },
          { name: "Meta Cumprida", icon: "🎯", earned: true },
          { name: "Mentor Ativo", icon: "👨‍🏫", earned: perfil?.eMentor ?? false },
          { name: "10 Posts no Fórum", icon: "💬", earned: false },
          { name: "Sequência 30 Dias", icon: "🔥", earned: false },
        ];

  const conquistasGanhas = temGamificacao
    ? gamPerfil!.conquistas.filter((c) => c.earned).length
    : 3;

  const stats = [
    { label: "Pontos Totais", value: String(gamPerfil?.pontosTotais ?? 850), icon: Trophy },
    { label: "Conquistas", value: String(conquistasGanhas), icon: Award },
    { label: "Dias Consecutivos", value: String(gamPerfil?.streakAtual ?? 12), icon: Calendar },
    { label: "Recorde de Sequência", value: String(gamPerfil?.streakRecorde ?? 18), icon: TrendingUp },
  ];

  const pointsHistory =
    temGamificacao && gamPerfil!.historico.length > 0
      ? gamPerfil!.historico.map((h) => ({
          action: h.acao,
          points: h.pontos,
          date: h.data,
        }))
      : [
          { action: "Meta concluída", points: 50, date: "Hoje" },
          { action: "Sessão Pomodoro", points: 25, date: "Hoje" },
          { action: "Post no fórum", points: 10, date: "Ontem" },
          { action: "Avaliação de bem-estar", points: 15, date: "Ontem" },
        ];

  const totalPoints = gamPerfil?.pontosTotais ?? 850;
  const nextBadgePoints = Math.max(1000, Math.ceil((totalPoints + 1) / 500) * 500);
  const pointsToNextBadge = Math.max(0, nextBadgePoints - totalPoints);
  const progressPercentage = Math.min(100, (totalPoints / nextBadgePoints) * 100);

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

      {/* Ranking entre alunos (RF13) */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="text-[#0066CC]" size={24} />
          <h2 className="text-xl text-[#003366]">Ranking entre Alunos</h2>
        </div>
        {ranking.length === 0 ? (
          <p className="text-sm text-[#6C757D]">
            O ranking ficará disponível assim que houver pontuação registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {ranking.map((item) => (
              <div
                key={item.posicao}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  item.eu
                    ? "bg-gradient-to-r from-[#003366]/10 to-[#0066CC]/10 border border-[#0066CC]/30"
                    : "bg-[#F5F7FA]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      item.posicao === 1
                        ? "bg-[#FFD700] text-white"
                        : item.posicao === 2
                          ? "bg-[#C0C0C0] text-white"
                          : item.posicao === 3
                            ? "bg-[#CD7F32] text-white"
                            : "bg-[#003366]/10 text-[#003366]"
                    }`}
                  >
                    {item.posicao}
                  </div>
                  <span className="text-[#003366] font-medium">
                    {item.nome}
                    {item.eu && (
                      <span className="ml-2 text-xs text-[#0066CC]">(você)</span>
                    )}
                  </span>
                </div>
                <span className="font-semibold text-[#28A745]">{item.pontos} pts</span>
              </div>
            ))}
          </div>
        )}
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

        {/* Privacidade / LGPD (D7 / RNF09) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Privacidade</h2>
          </div>
          <p className="text-sm text-[#6C757D] mb-6">
            Exerça seus direitos previstos na LGPD (Lei 13.709/2018): exporte uma cópia dos seus
            dados pessoais ou solicite a exclusão definitiva da sua conta.
          </p>

          {privacidadeFeedback && (
            <p
              role="status"
              aria-live="polite"
              className={`mb-4 text-sm ${
                privacidadeFeedback.tipo === "ok" ? "text-green-700" : "text-red-700"
              }`}
            >
              {privacidadeFeedback.texto}
            </p>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={exportarDados}
              disabled={exportando}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
            >
              <Download size={18} aria-hidden="true" />
              <span>{exportando ? "Exportando…" : "Exportar meus dados (JSON)"}</span>
            </button>

            {!confirmandoExclusao ? (
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={18} aria-hidden="true" />
                <span>Excluir minha conta</span>
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-sm text-red-800">
                  Esta ação é <strong>irreversível</strong>. Seus dados pessoais serão anonimizados
                  e você perderá o acesso. Deseja confirmar?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={excluirConta}
                    disabled={excluindo}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                  >
                    {excluindo ? "Excluindo…" : "Confirmar exclusão"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    disabled={excluindo}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#003366]/20 text-[#003366] hover:bg-[#003366]/5 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}