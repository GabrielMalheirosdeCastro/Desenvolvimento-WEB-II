import { useEffect, useState } from "react";
import { HelpCircle, LogIn, MessageCircle, Plus, X } from "lucide-react";

type Topico = {
  id: number;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  autor?: string | null;
  respostas: number;
  createdAt?: string | null;
};

type Post = {
  id: number;
  conteudo?: string | null;
  autor?: string | null;
  createdAt?: string | null;
};

const CATEGORIAS_FORUM = ["Dicas", "Discussão", "Recursos", "Bem-estar", "Dúvidas"];

function formatarData(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function iniciais(nome?: string | null): string {
  if (!nome) return "?";
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function ForumPage() {
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_FORUM[0]);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Filtro por categoria (botões funcionais na barra lateral).
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  // Tópico aberto ("Entrar"), suas respostas e o formulário de "pedir informações".
  const [topicoAberto, setTopicoAberto] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregandoPosts, setCarregandoPosts] = useState(false);
  const [pedindoInfo, setPedindoInfo] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [enviandoPergunta, setEnviandoPergunta] = useState(false);
  const [erroPergunta, setErroPergunta] = useState<string | null>(null);

  async function carregarTopicos() {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/forum");
      const j = await r.json();
      setTopicos(Array.isArray(j?.items) ? j.items : []);
    } catch {
      setErro("Não foi possível carregar os tópicos.");
      setTopicos([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTopicos();
  }, []);

  async function criarTopico(e: React.FormEvent) {
    e.preventDefault();
    const tituloLimpo = titulo.trim();
    if (tituloLimpo.length < 3) {
      setErroForm("Informe um título com pelo menos 3 caracteres.");
      return;
    }
    setEnviando(true);
    setErroForm(null);
    try {
      const r = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titulo: tituloLimpo,
          descricao: descricao.trim() || undefined,
          categoria,
        }),
      });
      if (r.status === 401) {
        setErroForm("Sua sessão expirou. Entre novamente para publicar.");
        return;
      }
      if (!r.ok) {
        setErroForm("Não foi possível publicar o tópico. Tente novamente.");
        return;
      }
      setTitulo("");
      setDescricao("");
      setCategoria(CATEGORIAS_FORUM[0]);
      setFormAberto(false);
      await carregarTopicos();
    } catch {
      setErroForm("Falha de conexão ao publicar o tópico.");
    } finally {
      setEnviando(false);
    }
  }

  async function carregarPosts(forumId: number) {
    setCarregandoPosts(true);
    try {
      const r = await fetch(`/api/forum/${forumId}/posts`);
      const j = await r.json();
      setPosts(Array.isArray(j?.items) ? j.items : []);
    } catch {
      setPosts([]);
    } finally {
      setCarregandoPosts(false);
    }
  }

  function fecharTopico() {
    setTopicoAberto(null);
    setPosts([]);
    setPedindoInfo(false);
    setPergunta("");
    setErroPergunta(null);
  }

  async function entrarTopico(id: number) {
    if (topicoAberto === id) {
      fecharTopico();
      return;
    }
    setTopicoAberto(id);
    setPosts([]);
    setPedindoInfo(false);
    setPergunta("");
    setErroPergunta(null);
    await carregarPosts(id);
  }

  async function enviarPergunta(e: React.FormEvent, forumId: number) {
    e.preventDefault();
    const limpo = pergunta.trim();
    if (limpo.length < 3) {
      setErroPergunta("Escreva sua pergunta com pelo menos 3 caracteres.");
      return;
    }
    setEnviandoPergunta(true);
    setErroPergunta(null);
    try {
      const r = await fetch(`/api/forum/${forumId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conteudo: limpo }),
      });
      if (r.status === 401) {
        setErroPergunta("Sua sessão expirou. Entre novamente para enviar.");
        return;
      }
      if (!r.ok) {
        setErroPergunta("Não foi possível enviar a pergunta. Tente novamente.");
        return;
      }
      setPergunta("");
      setPedindoInfo(false);
      await carregarPosts(forumId);
      await carregarTopicos();
    } catch {
      setErroPergunta("Falha de conexão ao enviar a pergunta.");
    } finally {
      setEnviandoPergunta(false);
    }
  }

  const topicosFiltrados = categoriaFiltro
    ? topicos.filter((t) => (t.categoria || "") === categoriaFiltro)
    : topicos;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 text-foreground">Fórum de Discussão</h1>
          <p className="text-muted-foreground">
            Compartilhe experiências e tire dúvidas com a comunidade
          </p>
        </div>
        <button
          onClick={() => {
            setErroForm(null);
            setFormAberto((v) => !v);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Tópico
        </button>
      </div>

      {formAberto && (
        <form onSubmit={criarTopico} className="bg-card rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl text-foreground">Criar novo tópico</h2>
          <div>
            <label htmlFor="forum-titulo" className="block text-sm text-muted-foreground mb-1">
              Título
            </label>
            <input
              id="forum-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={160}
              placeholder="Sobre o que você quer conversar?"
              className="w-full border border-border bg-input-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="forum-categoria" className="block text-sm text-muted-foreground mb-1">
              Categoria
            </label>
            <select
              id="forum-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-border bg-input-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIAS_FORUM.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="forum-descricao" className="block text-sm text-muted-foreground mb-1">
              Descrição (opcional)
            </label>
            <textarea
              id="forum-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Detalhe sua dúvida ou experiência..."
              className="w-full border border-border bg-input-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-6 py-2 rounded-lg transition-colors"
            >
              {enviando ? "Publicando..." : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Categorias */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-4 text-foreground">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoriaFiltro(null)}
                aria-pressed={categoriaFiltro === null}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  categoriaFiltro === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                Todas
              </button>
              {CATEGORIAS_FORUM.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoriaFiltro((prev) => (prev === c ? null : c))}
                  aria-pressed={categoriaFiltro === c}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    categoriaFiltro === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm p-4 mt-4">
            <h3 className="font-medium mb-4 text-foreground">Regras do Fórum</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Seja respeitoso com todos</li>
              <li>• Não compartilhe informações pessoais</li>
              <li>• Evite spam e conteúdo irrelevante</li>
              <li>• Use categorias apropriadas</li>
            </ul>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <div className="lg:col-span-3 space-y-4">
          {carregando && (
            <div className="bg-card rounded-lg shadow-sm p-6 text-muted-foreground">
              Carregando tópicos...
            </div>
          )}

          {erro && !carregando && (
            <div className="bg-card rounded-lg shadow-sm p-6 text-destructive">{erro}</div>
          )}

          {!carregando && !erro && topicosFiltrados.length === 0 && (
            <div className="bg-card rounded-lg shadow-sm p-6 text-muted-foreground">
              {categoriaFiltro
                ? `Nenhum tópico na categoria "${categoriaFiltro}".`
                : "Ainda não há tópicos. Seja o primeiro a iniciar uma conversa."}
            </div>
          )}

          {!carregando &&
            topicosFiltrados.map((topico) => (
              <div
                key={topico.id}
                className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                      {iniciais(topico.autor)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg text-foreground">{topico.titulo}</h3>
                      {topico.categoria && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full whitespace-nowrap">
                          {topico.categoria}
                        </span>
                      )}
                    </div>
                    {topico.descricao && (
                      <p className="text-muted-foreground mb-3">{topico.descricao}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{topico.autor || "Anônimo"}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {topico.respostas} respostas
                      </span>
                      {topico.createdAt && (
                        <span className="ml-auto">{formatarData(topico.createdAt)}</span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => entrarTopico(topico.id)}
                        aria-pressed={topicoAberto === topico.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                          topicoAberto === topico.id
                            ? "bg-muted text-foreground"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        }`}
                      >
                        {topicoAberto === topico.id ? (
                          <>
                            <X size={16} />
                            Fechar
                          </>
                        ) : (
                          <>
                            <LogIn size={16} />
                            Entrar
                          </>
                        )}
                      </button>
                    </div>

                    {topicoAberto === topico.id && (
                      <div className="mt-4 border-t border-border pt-4 space-y-4">
                        {carregandoPosts && (
                          <p className="text-sm text-muted-foreground">
                            Carregando respostas...
                          </p>
                        )}

                        {!carregandoPosts && posts.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Ainda não há respostas. Faça a primeira pergunta sobre a matéria.
                          </p>
                        )}

                        {!carregandoPosts &&
                          posts.map((p) => (
                            <div
                              key={p.id}
                              className="bg-accent/40 rounded-lg p-3 text-sm"
                            >
                              <div className="flex items-center justify-between gap-3 mb-1 text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {p.autor || "Anônimo"}
                                </span>
                                {p.createdAt && <span>{formatarData(p.createdAt)}</span>}
                              </div>
                              <p className="text-foreground whitespace-pre-wrap">
                                {p.conteudo}
                              </p>
                            </div>
                          ))}

                        {!pedindoInfo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setErroPergunta(null);
                              setPedindoInfo(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors text-foreground"
                          >
                            <HelpCircle size={16} />
                            Pedir informações sobre a matéria
                          </button>
                        ) : (
                          <form
                            onSubmit={(e) => enviarPergunta(e, topico.id)}
                            className="space-y-3"
                          >
                            <textarea
                              value={pergunta}
                              onChange={(e) => setPergunta(e.target.value)}
                              maxLength={2000}
                              rows={3}
                              autoFocus
                              placeholder="Qual a sua dúvida sobre a matéria?"
                              className="w-full border border-border bg-input-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {erroPergunta && (
                              <p className="text-sm text-destructive">{erroPergunta}</p>
                            )}
                            <div className="flex items-center gap-3">
                              <button
                                type="submit"
                                disabled={enviandoPergunta}
                                className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-5 py-2 rounded-lg text-sm transition-colors"
                              >
                                {enviandoPergunta ? "Enviando..." : "Confirmar"}
                              </button>
                              <button
                                type="button"
                                disabled={enviandoPergunta}
                                onClick={() => {
                                  setPedindoInfo(false);
                                  setPergunta("");
                                  setErroPergunta(null);
                                }}
                                className="px-5 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors text-foreground"
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
