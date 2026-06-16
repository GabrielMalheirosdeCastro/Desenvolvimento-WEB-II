import { HeartPulse, Loader2, Plus, X, Smile, Activity, Moon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

// --------------------------------------------------------------
// Avaliação de Bem-estar (Bloco B — item B1 / RF11)
// Questionário periódico de autoavaliação, persistido via API
// /api/bem-estar (cookie httpOnly). Os registros mapeiam para a
// tabela questionarios_bem_estar no Postgres.
// --------------------------------------------------------------

type Avaliacao = {
  id: number;
  humor: number | null;
  estresse: number | null;
  sono: number | null;
  resultado: "positivo" | "atencao" | "critico" | null;
  observacoes: string;
  dataAplicacao: string | null;
};

// Metadados de apresentação de cada classificação de resultado.
const RESULTADO_INFO: Record<
  NonNullable<Avaliacao["resultado"]>,
  { rotulo: string; classe: string }
> = {
  positivo: { rotulo: "Positivo", classe: "bg-success/15 text-success-strong" },
  atencao: { rotulo: "Atenção", classe: "bg-warning/15 text-warning-strong" },
  critico: { rotulo: "Crítico", classe: "bg-destructive/15 text-destructive" },
};

// Escalas do questionário (1 a 5).
const ESCALA = [1, 2, 3, 4, 5];

export function WellbeingPage() {
  const [registros, setRegistros] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [humor, setHumor] = useState(3);
  const [estresse, setEstresse] = useState(3);
  const [sono, setSono] = useState(3);
  const [observacoes, setObservacoes] = useState("");

  async function carregarRegistros() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/bem-estar", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setRegistros(Array.isArray(json.items) ? json.items : []);
    } catch {
      setErro("Não foi possível carregar seu histórico. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  async function enviarAvaliacao(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/bem-estar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humor,
          estresse,
          sono,
          observacoes: observacoes.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.registro) {
        setRegistros((prev) => [json.registro as Avaliacao, ...prev]);
      }
      setHumor(3);
      setEstresse(3);
      setSono(3);
      setObservacoes("");
      setFormAberto(false);
    } catch {
      setErro("Não foi possível registrar sua avaliação. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const totalRegistros = registros.length;
  const ultimo = registros[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">Avaliação de Bem-estar</h1>
          <p className="text-muted-foreground">
            Faça uma autoavaliação periódica e acompanhe como você está
          </p>
        </div>
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors"
        >
          {formAberto ? <X size={20} /> : <Plus size={20} />}
          {formAberto ? "Cancelar" : "Nova Avaliação"}
        </button>
      </div>

      {erro && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3">
          {erro}
        </div>
      )}

      {/* Formulário de nova avaliação */}
      {formAberto && (
        <form
          onSubmit={enviarAvaliacao}
          className="bg-card rounded-lg shadow-sm p-6 space-y-6"
        >
          <h2 className="text-xl text-foreground">Como você está hoje?</h2>

          <EscalaCampo
            id="humor"
            icone={<Smile className="text-primary" size={20} />}
            titulo="Humor"
            descricao="1 = muito baixo · 5 = ótimo"
            valor={humor}
            onChange={setHumor}
          />
          <EscalaCampo
            id="estresse"
            icone={<Activity className="text-primary" size={20} />}
            titulo="Nível de estresse"
            descricao="1 = tranquilo · 5 = muito estressado"
            valor={estresse}
            onChange={setEstresse}
          />
          <EscalaCampo
            id="sono"
            icone={<Moon className="text-primary" size={20} />}
            titulo="Qualidade do sono"
            descricao="1 = muito ruim · 5 = excelente"
            valor={sono}
            onChange={setSono}
          />

          <div>
            <label
              className="block text-sm text-muted-foreground mb-1"
              htmlFor="bem-estar-obs"
            >
              Observações (opcional)
            </label>
            <textarea
              id="bem-estar-obs"
              maxLength={500}
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Algo que queira registrar sobre o seu dia..."
              className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              {enviando && <Loader2 size={18} className="animate-spin" />}
              Registrar Avaliação
            </button>
          </div>
        </form>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <HeartPulse className="text-primary" size={20} />
            </div>
            <h3 className="text-lg text-foreground">Avaliações Registradas</h3>
          </div>
          <p className="text-3xl text-foreground">{totalRegistros}</p>
          <p className="text-sm text-muted-foreground mt-1">No seu histórico</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Smile className="text-primary" size={20} />
            </div>
            <h3 className="text-lg text-foreground">Última Avaliação</h3>
          </div>
          {ultimo && ultimo.resultado ? (
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${RESULTADO_INFO[ultimo.resultado].classe}`}
            >
              {RESULTADO_INFO[ultimo.resultado].rotulo}
            </span>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma ainda</p>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6 text-foreground">Histórico</h2>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 size={20} className="animate-spin" />
            Carregando histórico...
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <HeartPulse className="mx-auto mb-4 text-muted-foreground/50" size={48} />
            <p className="mb-4">Você ainda não registrou nenhuma avaliação.</p>
            <button
              onClick={() => setFormAberto(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Fazer primeira avaliação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((registro) => (
              <div
                key={registro.id}
                className="p-4 rounded-lg border-2 border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm text-muted-foreground">
                    {registro.dataAplicacao
                      ? new Date(registro.dataAplicacao).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "2-digit", year: "numeric" },
                        )
                      : "Data não informada"}
                  </span>
                  {registro.resultado && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${RESULTADO_INFO[registro.resultado].classe}`}
                    >
                      {RESULTADO_INFO[registro.resultado].rotulo}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-foreground">
                  <span className="flex items-center gap-1">
                    <Smile size={14} className="text-muted-foreground" />
                    Humor: {registro.humor ?? "—"}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity size={14} className="text-muted-foreground" />
                    Estresse: {registro.estresse ?? "—"}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <Moon size={14} className="text-muted-foreground" />
                    Sono: {registro.sono ?? "—"}/5
                  </span>
                </div>
                {registro.observacoes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {registro.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Campo de escala 1..5 reutilizado pelas três dimensões do questionário.
function EscalaCampo({
  id,
  icone,
  titulo,
  descricao,
  valor,
  onChange,
}: {
  id: string;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <fieldset>
      <legend className="flex items-center gap-2 mb-1">
        {icone}
        <span className="font-medium text-foreground">{titulo}</span>
      </legend>
      <p className="text-sm text-muted-foreground mb-2">{descricao}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={titulo}>
        {ESCALA.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${titulo}: ${n}`}
            onClick={() => onChange(n)}
            className={`w-12 h-12 rounded-lg border-2 transition-colors ${
              valor === n
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-foreground hover:border-primary/40"
            }`}
            id={`${id}-${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
