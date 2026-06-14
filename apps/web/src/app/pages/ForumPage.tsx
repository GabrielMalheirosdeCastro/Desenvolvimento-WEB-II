import { useEffect, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";

type Topico = {
  id: number;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  autor?: string | null;
  respostas: number;
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Fórum de Discussão</h1>
          <p className="text-gray-600">
            Compartilhe experiências e tire dúvidas com a comunidade
          </p>
        </div>
        <button
          onClick={() => {
            setErroForm(null);
            setFormAberto((v) => !v);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Tópico
        </button>
      </div>

      {formAberto && (
        <form onSubmit={criarTopico} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl">Criar novo tópico</h2>
          <div>
            <label htmlFor="forum-titulo" className="block text-sm text-gray-600 mb-1">
              Título
            </label>
            <input
              id="forum-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={160}
              placeholder="Sobre o que você quer conversar?"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="forum-categoria" className="block text-sm text-gray-600 mb-1">
              Categoria
            </label>
            <select
              id="forum-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIAS_FORUM.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="forum-descricao" className="block text-sm text-gray-600 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              id="forum-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Detalhe sua dúvida ou experiência..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {enviando ? "Publicando..." : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Categorias */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-4">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_FORUM.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="font-medium mb-4">Regras do Fórum</h3>
            <ul className="space-y-2 text-sm text-gray-600">
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
            <div className="bg-white rounded-lg shadow-sm p-6 text-gray-500">
              Carregando tópicos...
            </div>
          )}

          {erro && !carregando && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-red-600">{erro}</div>
          )}

          {!carregando && !erro && topicos.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-gray-500">
              Ainda não há tópicos. Seja o primeiro a iniciar uma conversa.
            </div>
          )}

          {!carregando &&
            topicos.map((topico) => (
              <div
                key={topico.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      {iniciais(topico.autor)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg">{topico.titulo}</h3>
                      {topico.categoria && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                          {topico.categoria}
                        </span>
                      )}
                    </div>
                    {topico.descricao && (
                      <p className="text-gray-600 mb-3">{topico.descricao}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>{topico.autor || "Anônimo"}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {topico.respostas} respostas
                      </span>
                      {topico.createdAt && (
                        <span className="ml-auto">{formatarData(topico.createdAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
