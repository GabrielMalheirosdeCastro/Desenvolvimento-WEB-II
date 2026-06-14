import { Bot, Loader2, Send, ShieldAlert, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

// --------------------------------------------------------------
// Chatbot de Acolhimento (Bloco B — item B2 / RF16)
// Conversa com o assistente de acolhimento da FAESA. As respostas
// são geradas por um motor curado local no backend (sem LLM externa),
// adaptadas por faixa etária (17–20, 21–25, 26+), e persistidas em
// chatbot_conversas/chatbot_mensagens via API /api/chatbot.
// --------------------------------------------------------------

type Origem = "usuario" | "bot";

type Mensagem = {
  id: string | number;
  origem: Origem;
  conteudo: string;
  intencao?: string | null;
  crise?: boolean;
};

const FAIXAS: { valor: string; rotulo: string }[] = [
  { valor: "", rotulo: "Automática (pelo cadastro)" },
  { valor: "17-20", rotulo: "17 a 20 anos" },
  { valor: "21-25", rotulo: "21 a 25 anos" },
  { valor: "26+", rotulo: "26 anos ou mais" },
];

const MENSAGEM_BOAS_VINDAS: Mensagem = {
  id: "boas-vindas",
  origem: "bot",
  conteudo:
    "Olá! Eu sou o assistente de acolhimento da FAESA. Estou aqui para te ouvir e ajudar " +
    "com estudos, organização, bem-estar e adaptação à universidade. Como você está se " +
    "sentindo hoje?",
};

export function ChatbotPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_BOAS_VINDAS]);
  const [entrada, setEntrada] = useState("");
  const [faixa, setFaixa] = useState("");
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fimRef = useRef<HTMLDivElement | null>(null);

  // Rola para a última mensagem sempre que a lista muda.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // Hidrata o histórico da conversa mais recente do usuário.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/chatbot/historico", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!ativo) return;
        const itens: Mensagem[] = Array.isArray(json.mensagens)
          ? json.mensagens.map((m: Record<string, unknown>) => ({
              id: m.id as number,
              origem: (m.origem as Origem) ?? "bot",
              conteudo: String(m.conteudo ?? ""),
              intencao: (m.intencao as string) ?? null,
              crise: m.sentimento === "critico",
            }))
          : [];
        if (itens.length > 0) {
          setMensagens(itens);
          if (typeof json.conversaId === "number") setConversaId(json.conversaId);
        }
      } catch {
        // Sem histórico ou banco indisponível: mantém só a saudação.
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const texto = entrada.trim();
    if (!texto || enviando) return;

    setErro(null);
    setEnviando(true);
    const minhaMsg: Mensagem = {
      id: `u-${Date.now()}`,
      origem: "usuario",
      conteudo: texto,
    };
    setMensagens((prev) => [...prev, minhaMsg]);
    setEntrada("");

    try {
      const res = await fetch("/api/chatbot/mensagem", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: texto,
          faixaEtaria: faixa || undefined,
          conversaId: conversaId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (typeof json.conversaId === "number") setConversaId(json.conversaId);
      const respostaBot: Mensagem = {
        id: `b-${Date.now()}`,
        origem: "bot",
        conteudo: String(json.resposta?.conteudo ?? ""),
        intencao: json.resposta?.intencao ?? null,
        crise: json.crise === true,
      };
      setMensagens((prev) => [...prev, respostaBot]);
    } catch {
      setErro("Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Cabeçalho */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#003366] text-white flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-2xl text-[#003366]">Acolhimento FAESA</h1>
            <p className="text-sm text-gray-600">
              Assistente de apoio estudantil — respostas adaptadas à sua faixa etária
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de faixa etária */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <label htmlFor="faixa" className="text-gray-600">
          Faixa etária:
        </label>
        <select
          id="faixa"
          value={faixa}
          onChange={(ev) => setFaixa(ev.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
        >
          {FAIXAS.map((f) => (
            <option key={f.valor || "auto"} value={f.valor}>
              {f.rotulo}
            </option>
          ))}
        </select>
      </div>

      {/* Janela de conversa */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {carregando ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <Loader2 className="animate-spin mr-2" size={20} /> Carregando conversa...
          </div>
        ) : (
          mensagens.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.origem === "usuario" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.origem === "usuario"
                    ? "bg-[#0066CC] text-white"
                    : m.crise
                      ? "bg-red-600 text-white"
                      : "bg-[#003366] text-white"
                }`}
              >
                {m.origem === "usuario" ? (
                  <UserIcon size={16} />
                ) : m.crise ? (
                  <ShieldAlert size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.origem === "usuario"
                    ? "bg-[#0066CC] text-white rounded-tr-sm"
                    : m.crise
                      ? "bg-red-50 text-red-900 border border-red-200 rounded-tl-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}
              >
                {m.conteudo}
              </div>
            </div>
          ))
        )}
        {enviando && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin" size={16} /> O assistente está digitando...
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

      {/* Campo de envio */}
      <form onSubmit={enviar} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={entrada}
          onChange={(ev) => setEntrada(ev.target.value)}
          placeholder="Escreva como você está se sentindo..."
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

      <p className="mt-2 text-xs text-gray-500">
        Este assistente oferece apoio e orientação, mas não substitui atendimento profissional.
        Em caso de crise, ligue para o CVV no <strong>188</strong> (24h, gratuito e sigiloso).
      </p>
    </div>
  );
}
