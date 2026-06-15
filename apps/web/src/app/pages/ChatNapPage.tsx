import {
  HeartHandshake,
  Loader2,
  Plus,
  Send,
  ShieldAlert,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

// --------------------------------------------------------------
// Chat com o NAP (Bloco B — item B3 / RF15)
// Canal direto de mensageria entre o aluno e o Núcleo de Apoio
// Psicopedagógico (NAP). Transporte por POLLING HTTP simples (sem
// Socket.io): RF15 não exige tempo real e o polling dispensa nova
// dependência/WebSocket no Traefik. O atendente NAP é um usuário
// COORDENADOR; a autorização real é imposta no backend (anti-IDOR).
// --------------------------------------------------------------

type Ticket = {
  id: number;
  usuarioId: number;
  usuarioNome: string | null;
  atendenteId: number | null;
  titulo: string | null;
  status: string;
  dataCriacao: string | null;
  dataFechamento: string | null;
  totalMensagens: number;
  ultimaMensagem: string | null;
  ultimaEm: string | null;
};

type Mensagem = {
  id: number | string;
  ticketId: number;
  autorId: number;
  autorNome: string | null;
  autorEhNap: boolean;
  mensagem: string;
  dataEnvio: string | null;
};

const INTERVALO_TICKETS = 12000;
const INTERVALO_MENSAGENS = 5000;

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rotuloStatus(status: string): string {
  const mapa: Record<string, string> = {
    aberto: "Aguardando atendimento",
    em_atendimento: "Em atendimento",
    fechado: "Encerrado",
  };
  return mapa[status] || status;
}

export function ChatNapPage() {
  const { temPapel } = useAuth();
  const ehNap = temPapel("COORDENADOR");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoTickets, setCarregandoTickets] = useState(true);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoCrise, setAvisoCrise] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");

  const fimRef = useRef<HTMLDivElement | null>(null);

  const carregarTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/tickets", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTickets(Array.isArray(json.items) ? json.items : []);
    } catch {
      // mantém o estado atual em caso de falha pontual de rede
    } finally {
      setCarregandoTickets(false);
    }
  }, []);

  const carregarMensagens = useCallback(async (ticketId: number) => {
    try {
      const res = await fetch(`/api/chat/tickets/${ticketId}/mensagens`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMensagens(Array.isArray(json.mensagens) ? json.mensagens : []);
    } catch {
      // ignora falha pontual; o próximo polling tenta de novo
    }
  }, []);

  // Carga inicial + polling da lista de tickets.
  useEffect(() => {
    carregarTickets();
    const t = setInterval(carregarTickets, INTERVALO_TICKETS);
    return () => clearInterval(t);
  }, [carregarTickets]);

  // Polling das mensagens da conversa selecionada.
  useEffect(() => {
    if (selecionado === null) {
      setMensagens([]);
      return;
    }
    carregarMensagens(selecionado);
    const t = setInterval(() => carregarMensagens(selecionado), INTERVALO_MENSAGENS);
    return () => clearInterval(t);
  }, [selecionado, carregarMensagens]);

  // Rola para a última mensagem quando a lista muda.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const ticketAtual = tickets.find((t) => t.id === selecionado) || null;
  const fechado = ticketAtual?.status === "fechado";

  async function abrirTicket(e: FormEvent) {
    e.preventDefault();
    const titulo = novoTitulo.trim();
    const mensagem = novaMensagem.trim();
    if (!titulo || !mensagem || enviando) return;

    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/chat/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, mensagem }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAvisoCrise(json.avisoCrise ?? null);
      setNovoTitulo("");
      setNovaMensagem("");
      setNovoAberto(false);
      await carregarTickets();
      if (json.ticket?.id) setSelecionado(json.ticket.id);
    } catch {
      setErro("Não foi possível abrir o atendimento. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault();
    const mensagem = entrada.trim();
    if (!mensagem || enviando || selecionado === null) return;

    setErro(null);
    setEnviando(true);
    const otimista: Mensagem = {
      id: `tmp-${Date.now()}`,
      ticketId: selecionado,
      autorId: -1,
      autorNome: null,
      autorEhNap: ehNap,
      mensagem,
      dataEnvio: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, otimista]);
    setEntrada("");
    try {
      const res = await fetch(`/api/chat/tickets/${selecionado}/mensagens`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAvisoCrise(json.avisoCrise ?? null);
      await carregarMensagens(selecionado);
      await carregarTickets();
    } catch {
      setErro("Não foi possível enviar sua mensagem. Tente novamente.");
      setMensagens((prev) => prev.filter((m) => m.id !== otimista.id));
    } finally {
      setEnviando(false);
    }
  }

  async function fecharTicket() {
    if (selecionado === null) return;
    try {
      await fetch(`/api/chat/tickets/${selecionado}/fechar`, {
        method: "POST",
        credentials: "include",
      });
      await carregarTickets();
      await carregarMensagens(selecionado);
    } catch {
      setErro("Não foi possível encerrar o atendimento.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#003366] text-white flex items-center justify-center">
            <HeartHandshake size={22} />
          </div>
          <div>
            <h1 className="text-2xl text-[#003366]">Chat com o NAP</h1>
            <p className="text-sm text-gray-600">
              {ehNap
                ? "Atendimentos do Núcleo de Apoio Psicopedagógico"
                : "Converse com o Núcleo de Apoio Psicopedagógico da FAESA"}
            </p>
          </div>
        </div>
        {!ehNap && (
          <button
            type="button"
            onClick={() => setNovoAberto(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2.5 text-sm text-white hover:bg-[#00264d] transition-colors"
          >
            <Plus size={18} /> Novo atendimento
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-4 min-h-0">
        {/* Lista de conversas */}
        <aside className="bg-white rounded-xl border border-gray-200 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-[#003366]">
            {ehNap ? "Todos os atendimentos" : "Meus atendimentos"}
          </div>
          {carregandoTickets ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="animate-spin mr-2" size={18} /> Carregando...
            </div>
          ) : tickets.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">
              {ehNap
                ? "Nenhum atendimento aberto no momento."
                : "Você ainda não iniciou nenhum atendimento."}
            </p>
          ) : (
            <ul>
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(t.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selecionado === t.id ? "bg-[#E6EEF5]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#003366] truncate">
                        {t.titulo || "Atendimento"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          t.status === "fechado"
                            ? "bg-gray-100 text-gray-500"
                            : t.status === "em_atendimento"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {rotuloStatus(t.status)}
                      </span>
                    </div>
                    {ehNap && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {t.usuarioNome || `Aluno #${t.usuarioId}`}
                      </p>
                    )}
                    {t.ultimaMensagem && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{t.ultimaMensagem}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Janela de conversa */}
        <section className="bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
          {ticketAtual === null ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
              Selecione um atendimento ao lado para ver as mensagens.
            </div>
          ) : (
            <>
              <header className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-[#003366] truncate">
                    {ticketAtual.titulo || "Atendimento"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {ehNap ? ticketAtual.usuarioNome || `Aluno #${ticketAtual.usuarioId}` : "NAP FAESA"}
                    {" · "}
                    {rotuloStatus(ticketAtual.status)}
                  </p>
                </div>
                {!fechado && (
                  <button
                    type="button"
                    onClick={fecharTicket}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X size={14} /> Encerrar
                  </button>
                )}
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mensagens.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.autorEhNap ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        m.autorEhNap ? "bg-[#003366] text-white" : "bg-[#0066CC] text-white"
                      }`}
                    >
                      {m.autorEhNap ? <HeartHandshake size={16} /> : <UserIcon size={16} />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.autorEhNap
                          ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                          : "bg-[#0066CC] text-white rounded-tr-sm"
                      }`}
                    >
                      <p className="text-[11px] opacity-70 mb-0.5">
                        {m.autorEhNap ? m.autorNome || "NAP" : m.autorNome || "Você"}
                        {m.dataEnvio ? ` · ${formatarData(m.dataEnvio)}` : ""}
                      </p>
                      {m.mensagem}
                    </div>
                  </div>
                ))}
                <div ref={fimRef} />
              </div>

              {avisoCrise && (
                <div className="mx-4 mb-2 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{avisoCrise}</span>
                </div>
              )}

              {erro && <p className="px-4 pb-1 text-sm text-red-600">{erro}</p>}

              {fechado ? (
                <p className="px-5 py-4 text-sm text-gray-500 border-t border-gray-100">
                  Este atendimento foi encerrado.
                </p>
              ) : (
                <form
                  onSubmit={enviarMensagem}
                  className="px-4 py-3 border-t border-gray-100 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={entrada}
                    onChange={(ev) => setEntrada(ev.target.value)}
                    placeholder="Escreva sua mensagem..."
                    maxLength={2000}
                    className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                  <button
                    type="submit"
                    disabled={enviando || !entrada.trim()}
                    className="w-12 h-12 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#00264d] transition-colors disabled:opacity-50"
                    aria-label="Enviar mensagem"
                  >
                    {enviando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        O NAP oferece apoio psicopedagógico humano. Em caso de crise ou risco imediato, ligue para o
        CVV no <strong>188</strong> (24h, gratuito e sigiloso) ou para o SAMU <strong>192</strong>.
      </p>

      {/* Modal: abrir novo atendimento (apenas aluno) */}
      {novoAberto && !ehNap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#003366]">Novo atendimento com o NAP</h2>
              <button
                type="button"
                onClick={() => setNovoAberto(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={abrirTicket} className="space-y-4">
              <div>
                <label htmlFor="novo-titulo" className="block text-sm text-gray-600 mb-1">
                  Assunto
                </label>
                <input
                  id="novo-titulo"
                  type="text"
                  value={novoTitulo}
                  onChange={(ev) => setNovoTitulo(ev.target.value)}
                  placeholder="Ex.: Ansiedade antes das provas"
                  maxLength={120}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
              <div>
                <label htmlFor="nova-mensagem" className="block text-sm text-gray-600 mb-1">
                  Como podemos ajudar?
                </label>
                <textarea
                  id="nova-mensagem"
                  value={novaMensagem}
                  onChange={(ev) => setNovaMensagem(ev.target.value)}
                  placeholder="Descreva brevemente o que você está sentindo..."
                  maxLength={2000}
                  rows={4}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNovoAberto(false)}
                  className="rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !novoTitulo.trim() || !novaMensagem.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2.5 text-sm text-white hover:bg-[#00264d] transition-colors disabled:opacity-50"
                >
                  {enviando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Iniciar atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
