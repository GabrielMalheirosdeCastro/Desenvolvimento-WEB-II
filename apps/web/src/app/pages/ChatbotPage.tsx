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
          <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-2xl text-foreground">Acolhimento FAESA</h1>
            <p className="text-sm text-muted-foreground">
              Assistente de apoio estudantil — respostas adaptadas à sua faixa etária
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de faixa etária */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <label htmlFor="faixa" className="text-muted-foreground">
          Faixa etária:
        </label>
        <select
          id="faixa"
          value={faixa}
          onChange={(ev) => setFaixa(ev.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {FAIXAS.map((f) => (
            <option key={f.valor || "auto"} value={f.valor}>
              {f.rotulo}
            </option>
          ))}
        </select>
      </div>

      {/* Janela de conversa */}
      <div className="flex-1 overflow-y-auto bg-card rounded-xl border border-border p-4 space-y-4">
        {carregando ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
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
                    ? "bg-secondary text-secondary-foreground"
                    : m.crise
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
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
                    ? "bg-secondary text-secondary-foreground rounded-tr-sm"
                    : m.crise
                      ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-tl-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                {m.conteudo}
              </div>
            </div>
          ))
        )}
        {enviando && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="animate-spin" size={16} /> O assistente está digitando...
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

      {/* Campo de envio */}
      <form onSubmit={enviar} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={entrada}
          onChange={(ev) => setEntrada(ev.target.value)}
          placeholder="Escreva como você está se sentindo..."
          maxLength={2000}
          className="flex-1 border border-border rounded-full px-5 py-3 bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={enviando || !entrada.trim()}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          {enviando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Este assistente oferece apoio e orientação, mas não substitui atendimento profissional.
        Em caso de crise, ligue para o CVV no <strong>188</strong> (24h, gratuito e sigiloso).
      </p>
    </div>
  );
}
