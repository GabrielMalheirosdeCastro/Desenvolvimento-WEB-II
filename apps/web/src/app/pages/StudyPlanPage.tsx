import { Plus, Calendar, Target, Trash2, Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useI18n } from "../i18n/LanguageContext";

// --------------------------------------------------------------
// Plano de Estudos (Bloco H — item H3)
// CRUD real de metas, persistido via API /api/metas (cookie httpOnly).
// As metas mapeiam para a tabela atividades_estudo no Postgres.
// --------------------------------------------------------------

type Meta = {
  id: number;
  title: string;
  subject: string;
  deadline: string | null;
  completed: boolean;
};

export function StudyPlanPage() {
  const { t, idioma } = useI18n();
  const [goals, setGoals] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaMateria, setNovaMateria] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");

  async function carregarMetas() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/metas", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setGoals(Array.isArray(json.items) ? json.items : []);
    } catch {
      setErro(t("estudos.erros.carregar"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMetas();
  }, []);

  async function adicionarMeta(e: FormEvent) {
    e.preventDefault();
    const title = novoTitulo.trim();
    if (!title) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/metas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject: novaMateria.trim(),
          deadline: novoPrazo || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.meta) {
        setGoals((prev) => [json.meta as Meta, ...prev]);
      }
      setNovoTitulo("");
      setNovaMateria("");
      setNovoPrazo("");
      setFormAberto(false);
    } catch {
      setErro(t("estudos.erros.criar"));
    } finally {
      setEnviando(false);
    }
  }

  async function alternarMeta(meta: Meta) {
    setBusyId(meta.id);
    setErro(null);
    try {
      const res = await fetch(`/api/metas/${meta.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !meta.completed }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.meta) {
        setGoals((prev) =>
          prev.map((g) => (g.id === meta.id ? (json.meta as Meta) : g)),
        );
      }
    } catch {
      setErro(t("estudos.erros.atualizar"));
    } finally {
      setBusyId(null);
    }
  }

  async function excluirMeta(id: number) {
    setBusyId(id);
    setErro(null);
    try {
      const res = await fetch(`/api/metas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setErro(t("estudos.erros.excluir"));
    } finally {
      setBusyId(null);
    }
  }

  const totalGoals = goals.length;
  const completed = goals.filter((g) => g.completed).length;
  const pending = totalGoals - completed;
  const percentual = totalGoals > 0 ? Math.round((completed / totalGoals) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">{t("estudos.titulo")}</h1>
          <p className="text-muted-foreground">
            {t("estudos.subtitulo")}
          </p>
        </div>
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors"
        >
          {formAberto ? <X size={20} /> : <Plus size={20} />}
          {formAberto ? t("estudos.cancelar") : t("estudos.novaMeta")}
        </button>
      </div>

      {erro && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3">
          {erro}
        </div>
      )}

      {/* Formulário de nova meta */}
      {formAberto && (
        <form
          onSubmit={adicionarMeta}
          className="bg-card rounded-lg shadow-sm p-6 space-y-4"
        >
          <h2 className="text-xl text-foreground">{t("estudos.novaMeta")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm text-muted-foreground mb-1" htmlFor="meta-titulo">
                {t("estudos.tituloLabel")} <span className="text-destructive">*</span>
              </label>
              <input
                id="meta-titulo"
                type="text"
                required
                maxLength={200}
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                placeholder={t("estudos.tituloPlaceholder")}
                className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1" htmlFor="meta-materia">
                {t("estudos.materiaLabel")}
              </label>
              <input
                id="meta-materia"
                type="text"
                maxLength={100}
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                placeholder={t("estudos.materiaPlaceholder")}
                className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1" htmlFor="meta-prazo">
                {t("estudos.prazoLabel")}
              </label>
              <input
                id="meta-prazo"
                type="date"
                value={novoPrazo}
                onChange={(e) => setNovoPrazo(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviando || !novoTitulo.trim()}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              {enviando && <Loader2 size={18} className="animate-spin" />}
              {t("estudos.salvarMeta")}
            </button>
          </div>
        </form>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="text-primary" size={20} />
            </div>
            <h2 className="text-lg text-foreground">{t("estudos.totalMetas")}</h2>
          </div>
          <p className="text-3xl text-foreground">{totalGoals}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("estudos.noSeuPlano")}</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Target className="text-success" size={20} />
            </div>
            <h2 className="text-lg text-foreground">{t("estudos.concluidas")}</h2>
          </div>
          <p className="text-3xl text-success">{completed}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("estudos.percentualMetas", { percentual })}</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Target className="text-warning" size={20} />
            </div>
            <h2 className="text-lg text-foreground">{t("estudos.pendentes")}</h2>
          </div>
          <p className="text-3xl text-warning-strong">{pending}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("estudos.restantes")}</p>
        </div>
      </div>

      {/* Lista de Metas */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6 text-foreground">{t("estudos.minhasMetas")}</h2>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 size={20} className="animate-spin" />
            {t("estudos.carregandoMetas")}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Target className="mx-auto mb-4 text-muted-foreground/50" size={48} />
            <p className="mb-4">{t("estudos.semMetas")}</p>
            <button
              onClick={() => setFormAberto(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              {t("estudos.criarPrimeira")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  goal.completed
                    ? "bg-success/10 border-success/30"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    disabled={busyId === goal.id}
                    onChange={() => alternarMeta(goal)}
                    className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-ring disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <h3
                      className={`font-medium mb-1 ${
                        goal.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {goal.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {goal.subject && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                          {goal.subject}
                        </span>
                      )}
                      {goal.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(goal.deadline).toLocaleDateString(idioma)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => excluirMeta(goal.id)}
                      disabled={busyId === goal.id}
                      aria-label={t("estudos.excluirMeta")}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {busyId === goal.id ? (
                        <Loader2 size={18} className="text-destructive animate-spin" />
                      ) : (
                        <Trash2 size={18} className="text-destructive" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
