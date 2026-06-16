import { useEffect, useState } from "react";
import { Users, Calendar, Star, Search, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface Mentor {
  id: number | string;
  nome: string;
  curso?: string;
  periodo?: string;
  cra?: number;
  especialidades?: string[];
  email?: string;
  rating?: number;
  sessoes?: number;
}

interface Sessao {
  id: number;
  mentorId: number;
  mentorNome: string;
  tema: string;
  dataInicio: string;
}

export function MentorshipPage() {
  const { usuario, recarregar } = useAuth();
  const [modo, setModo] = useState<"buscar" | "mentor">("buscar");
  const [souMentor, setSouMentor] = useState(false);
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);

  const [mentores, setMentores] = useState<Mentor[]>([]);
  const [carregandoMentores, setCarregandoMentores] = useState(true);
  const [busca, setBusca] = useState("");

  // Solicitacoes de mentoria do usuario logado (mentor_id ja solicitados).
  const [solicitados, setSolicitados] = useState<Set<number>>(new Set());
  const [enviandoSolic, setEnviandoSolic] = useState<number | null>(null);
  const [avisoSolic, setAvisoSolic] = useState<string | null>(null);

  // Sessoes agendadas (status 'agendada' na tabela mentorias).
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [carregandoSessoes, setCarregandoSessoes] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formMentorId, setFormMentorId] = useState("");
  const [formTema, setFormTema] = useState("");
  const [formData, setFormData] = useState("");
  const [salvandoSessao, setSalvandoSessao] = useState(false);
  const [cancelandoSessao, setCancelandoSessao] = useState<number | null>(null);
  const [avisoSessao, setAvisoSessao] = useState<string | null>(null);

  // Hidrata o estado inicial a partir da sessao (e_mentor do JWT).
  useEffect(() => {
    if (usuario?.eMentor) setSouMentor(true);
  }, [usuario]);

  // Carrega a lista real de mentores cadastrados.
  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregandoMentores(true);
      try {
        const r = await fetch("/api/mentorias?papel=mentor", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const j = await r.json();
        if (!ativo) return;
        const items: Mentor[] = Array.isArray(j?.items)
          ? j.items.map((m: Record<string, unknown>) => ({
              id: (m.id as number | string) ?? (m.matricula as string) ?? (m.nome as string),
              nome: String(m.nome ?? ""),
              curso: (m.curso as string) ?? (m.tipo as string) ?? undefined,
              periodo: m.periodo != null ? String(m.periodo) : undefined,
              cra: typeof m.cra === "number" ? m.cra : undefined,
              especialidades: Array.isArray(m.especialidades)
                ? (m.especialidades as string[])
                : undefined,
              email: (m.email as string) ?? undefined,
            }))
          : [];
        setMentores(items);
      } catch {
        if (ativo) setMentores([]);
      } finally {
        if (ativo) setCarregandoMentores(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Hidrata os botoes com as solicitacoes ja registradas pelo usuario.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const r = await fetch("/api/mentorias/minhas", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!r.ok) return;
        const j = await r.json();
        if (!ativo) return;
        const ids: number[] = Array.isArray(j?.items)
          ? j.items
              .map((i: { mentorId: number }) => Number(i.mentorId))
              .filter((n: number) => Number.isFinite(n))
          : [];
        setSolicitados(new Set(ids));
      } catch {
        // Sem sessao ou banco indisponivel: mantem estado vazio.
      }
    })();
    return () => {
      ativo = false;
    };
  }, [usuario]);

  async function solicitarMentoria(mentor: Mentor) {
    const mid = Number(mentor.id);
    if (!Number.isFinite(mid) || solicitados.has(mid) || enviandoSolic != null) return;
    setEnviandoSolic(mid);
    setAvisoSolic(null);
    try {
      const r = await fetch(`/api/mentorias/${mid}/solicitar`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (r.status === 401) {
        setAvisoSolic("Entre na sua conta para solicitar mentoria.");
        return;
      }
      if (!r.ok) {
        setAvisoSolic("Nao foi possivel enviar a solicitacao. Tente novamente.");
        return;
      }
      setSolicitados((atual) => new Set(atual).add(mid));
    } catch {
      setAvisoSolic("Falha de conexao ao solicitar mentoria.");
    } finally {
      setEnviandoSolic(null);
    }
  }

  async function cancelarSolicitacao(mentor: Mentor) {
    const mid = Number(mentor.id);
    if (!Number.isFinite(mid) || !solicitados.has(mid) || enviandoSolic != null) return;
    setEnviandoSolic(mid);
    setAvisoSolic(null);
    try {
      const r = await fetch(`/api/mentorias/${mid}/solicitar`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (r.status === 401) {
        setAvisoSolic("Entre na sua conta para gerenciar suas solicitacoes.");
        return;
      }
      if (!r.ok) {
        setAvisoSolic("Nao foi possivel cancelar a solicitacao. Tente novamente.");
        return;
      }
      setSolicitados((atual) => {
        const novo = new Set(atual);
        novo.delete(mid);
        return novo;
      });
    } catch {
      setAvisoSolic("Falha de conexao ao cancelar a solicitacao.");
    } finally {
      setEnviandoSolic(null);
    }
  }

  async function cadastrarComoMentor() {
    setEnviandoCadastro(true);
    try {
      const r = await fetch("/api/mentorias/cadastro-mentor", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const j = await r.json();
      if (j?.eMentor) {
        setSouMentor(true);
        await recarregar();
      }
    } catch {
      // Sem persistencia confirmada: nao marca otimisticamente.
    } finally {
      setEnviandoCadastro(false);
    }
  }

  const mentoresFiltrados = mentores.filter((m) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      m.nome.toLowerCase().includes(termo) ||
      (m.curso ?? "").toLowerCase().includes(termo) ||
      (m.especialidades ?? []).some((e) => e.toLowerCase().includes(termo))
    );
  });

  // Apenas mentores com id numerico podem ser agendados (registros reais do banco).
  const mentoresAgendaveis = mentores.filter(
    (m) => Number.isFinite(Number(m.id)) && Number(m.id) > 0,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Sistema de Mentoria</h1>
        <p className="text-muted-foreground">
          Conecte-se com veteranos experientes para orientação acadêmica
        </p>
      </div>

      {/* Toggle Buscar Mentor / Sou Mentor (Sprint 8c — GP-1 / US04) */}
      <div className="bg-card rounded-lg shadow-sm p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setModo("buscar")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            modo === "buscar"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-accent"
          }`}
        >
          Buscar mentor
        </button>
        <button
          type="button"
          onClick={() => setModo("mentor")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            modo === "mentor"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-accent"
          }`}
        >
          Sou mentor(a)
        </button>
      </div>

      {modo === "mentor" && (
        <div className="bg-card rounded-lg shadow-sm p-6 border-2 border-primary/10">
          <h2 className="text-xl mb-4 flex items-center gap-2 text-foreground">
            <Users className="text-primary" size={20} />
            Painel do(a) Mentor(a)
          </h2>
          {souMentor ? (
            <div className="flex items-start gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
              <CheckCircle2 className="text-success mt-0.5" size={20} />
              <div>
                <p className="font-medium text-foreground">
                  Você já está cadastrado(a) como mentor(a).
                </p>
                <p className="text-sm text-muted-foreground">
                  Outros estudantes já conseguem te encontrar na busca de mentoria.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-4">
                Ao se cadastrar como mentor(a), seu perfil passa a aparecer na busca de
                outros estudantes. Requisitos institucionais: 5º período ou superior com CRA ≥ 7,0.
              </p>
              <button
                type="button"
                onClick={cadastrarComoMentor}
                disabled={enviandoCadastro}
                className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
              >
                {enviandoCadastro ? "Cadastrando..." : "Cadastrar-me como mentor(a)"}
              </button>
            </>
          )}
        </div>
      )}

      {modo === "buscar" && (
        <>
      {/* Minhas Sessões */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            <h2 className="text-xl text-foreground">Minhas Sessões Agendadas</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setMostrarForm((v) => !v);
              setAvisoSessao(null);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
          >
            {mostrarForm ? <XCircle size={18} /> : <Plus size={18} />}
            {mostrarForm ? "Fechar" : "Agendar sessão"}
          </button>
        </div>

        {mostrarForm && (
          <form
            onSubmit={agendarSessao}
            className="mb-6 grid grid-cols-1 gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div>
              <label htmlFor="sessao-mentor" className="block text-sm text-foreground mb-1">
                Mentor
              </label>
              <select
                id="sessao-mentor"
                value={formMentorId}
                onChange={(e) => setFormMentorId(e.target.value)}
                className="w-full px-4 py-3 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              >
                <option value="">Selecione um mentor</option>
                {mentoresAgendaveis.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nome}
                  </option>
                ))}
              </select>
              {mentoresAgendaveis.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhum mentor disponível para agendamento no momento.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="sessao-tema" className="block text-sm text-foreground mb-1">
                Tema da sessão
              </label>
              <input
                id="sessao-tema"
                type="text"
                value={formTema}
                onChange={(e) => setFormTema(e.target.value)}
                maxLength={200}
                placeholder="Ex: Estruturas de dados avançadas"
                className="w-full px-4 py-3 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="sessao-data" className="block text-sm text-foreground mb-1">
                Data e hora
              </label>
              <input
                id="sessao-data"
                type="datetime-local"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                className="w-full px-4 py-3 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={salvandoSessao || mentoresAgendaveis.length === 0}
                className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
              >
                {salvandoSessao ? "Agendando..." : "Confirmar agendamento"}
              </button>
            </div>
          </form>
        )}

        {avisoSessao && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {avisoSessao}
          </p>
        )}

        <div className="space-y-4">
          {carregandoSessoes ? (
            <p className="text-muted-foreground">Carregando sessões...</p>
          ) : sessoes.length === 0 ? (
            <p className="text-muted-foreground">
              Você ainda não tem sessões agendadas. Use “Agendar sessão” para criar uma.
            </p>
          ) : (
            sessoes.map((session) => (
              <div
                key={session.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium mb-1 text-foreground">{session.tema}</h3>
                  <p className="text-sm text-muted-foreground">com {session.mentorNome}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {new Date(session.dataInicio).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-foreground">
                      {new Date(session.dataInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelarSessao(session.id)}
                    disabled={cancelandoSessao === session.id}
                    aria-label={`Cancelar sessão ${session.tema}`}
                    className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-60 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    {cancelandoSessao === session.id ? "Cancelando..." : "Cancelar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Buscar Mentores */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6 text-foreground">Encontre um Mentor</h2>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por especialidade, curso ou nome..."
              className="w-full pl-10 pr-4 py-3 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
            />
          </div>
        </div>

        {avisoSolic && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {avisoSolic}
          </p>
        )}

        {carregandoMentores ? (
          <p className="text-muted-foreground">Carregando mentores...</p>
        ) : mentoresFiltrados.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum mentor cadastrado ainda. Seja o primeiro: use a aba “Sou mentor(a)”.
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentoresFiltrados.map((mentor) => (
            <div key={mentor.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl">
                  {mentor.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                {mentor.rating != null && (
                  <div className="flex items-center gap-1 text-warning">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm text-foreground">{mentor.rating}</span>
                  </div>
                )}
              </div>

              <h3 className="font-medium mb-1 text-foreground">{mentor.nome}</h3>
              {mentor.curso && <p className="text-sm text-muted-foreground mb-1">{mentor.curso}</p>}
              {(mentor.periodo || mentor.cra != null) && (
                <p className="text-sm text-muted-foreground mb-3">
                  {mentor.periodo ? `${mentor.periodo}º Período` : ""}
                  {mentor.periodo && mentor.cra != null ? " • " : ""}
                  {mentor.cra != null ? `CRA: ${mentor.cra}` : ""}
                </p>
              )}

              {mentor.especialidades && mentor.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.especialidades.map((especialidade, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {especialidade}
                    </span>
                  ))}
                </div>
              )}

              {(() => {
                const mid = Number(mentor.id);
                const solicitado = Number.isFinite(mid) && solicitados.has(mid);
                const enviando = enviandoSolic === mid;
                return (
                  <button
                    type="button"
                    onClick={() =>
                      solicitado ? cancelarSolicitacao(mentor) : solicitarMentoria(mentor)
                    }
                    disabled={enviando}
                    aria-label={
                      solicitado
                        ? `Cancelar solicitacao de mentoria com ${mentor.nome}`
                        : `Solicitar mentoria com ${mentor.nome}`
                    }
                    className={`group w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
                      solicitado
                        ? "bg-success/10 text-success border border-success/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    {enviando ? (
                      solicitado ? (
                        "Cancelando..."
                      ) : (
                        "Enviando..."
                      )
                    ) : solicitado ? (
                      <>
                        <CheckCircle2 size={16} className="group-hover:hidden" />
                        <span className="group-hover:hidden">Solicitacao enviada</span>
                        <XCircle size={16} className="hidden group-hover:inline" />
                        <span className="hidden group-hover:inline">Cancelar solicitacao</span>
                      </>
                    ) : (
                      "Solicitar Mentoria"
                    )}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
        )}
      </div>
        </>
      )}

      {/* Banner Torne-se Mentor */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 text-white">
            <h2 className="text-2xl mb-4">Seja um Mentor!</h2>
            <p className="mb-6">
              Compartilhe seu conhecimento e ajude calouros a terem sucesso. 
              Requisitos: 5º período ou superior com CRA ≥ 7,0.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Desenvolva habilidades de liderança
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Ganhe pontos e badges exclusivos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Faça networking com outros estudantes
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setModo("mentor")}
              className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors"
            >
              Candidatar-se como Mentor
            </button>
          </div>
          <div className="h-64 md:h-auto">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1759755486391-d7bd120924f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50b3JzaGlwJTIwY29udmVyc2F0aW9uJTIwZ3VpZGFuY2V8ZW58MXx8fHwxNzczMzQwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Mentoria"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
