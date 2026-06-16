import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  BookOpen,
  Video,
  Headphones,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
} from "lucide-react";

type Recurso = {
  id: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  url?: string | null;
  categoria?: string | null;
  visualizacoes?: number;
};

type Trilha = {
  id: number;
  nome: string;
  descricao?: string | null;
  publicoAlvo?: string | null;
  totalRecursos: number;
};

const ICONE_POR_TIPO: Record<string, { icon: typeof FileText; color: string }> = {
  artigo: { icon: FileText, color: "blue" },
  video: { icon: Video, color: "red" },
  "vídeo": { icon: Video, color: "red" },
  podcast: { icon: Headphones, color: "purple" },
  ebook: { icon: BookOpen, color: "green" },
  "e-book": { icon: BookOpen, color: "green" },
};

function estiloRecurso(tipo?: string | null): { icon: typeof FileText; color: string } {
  const chave = (tipo ?? "").trim().toLowerCase();
  return ICONE_POR_TIPO[chave] ?? { icon: FileText, color: "blue" };
}

// Chave de persistencia local das trilhas iniciadas pelo usuario. Como ainda
// nao ha backend de progresso de trilha, o estado "iniciada" e mantido no
// localStorage e e totalmente reversivel (cancelar inscricao).
const STORAGE_TRILHAS = "biblioteca:trilhas-iniciadas";

function carregarTrilhasIniciadas(): Set<number> {
  try {
    const bruto = localStorage.getItem(STORAGE_TRILHAS);
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista.filter((n) => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

export function LibraryPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [busca, setBusca] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  // Id do recurso aguardando confirmacao do usuario (fluxo reversivel).
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  // Id do recurso cujo acesso esta sendo registrado (evita clique duplo).
  const [acessandoId, setAcessandoId] = useState<number | null>(null);
  // Id da trilha aguardando confirmacao de inicio (fluxo reversivel).
  const [confirmandoTrilhaId, setConfirmandoTrilhaId] = useState<number | null>(null);
  // Trilhas ja iniciadas pelo usuario (persistidas localmente).
  const [trilhasIniciadas, setTrilhasIniciadas] = useState<Set<number>>(
    () => carregarTrilhasIniciadas(),
  );

  useEffect(() => {
    fetch("/api/recursos")
      .then((r) => r.json())
      .then((j) => setRecursos(Array.isArray(j?.items) ? j.items : []))
      .catch(() => setRecursos([]));
    fetch("/api/trilhas")
      .then((r) => r.json())
      .then((j) => setTrilhas(Array.isArray(j?.items) ? j.items : []))
      .catch(() => setTrilhas([]));
  }, []);

  // Persiste as trilhas iniciadas a cada mudanca (reversivel).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRILHAS, JSON.stringify([...trilhasIniciadas]));
    } catch {
      // armazenamento indisponivel: estado segue apenas em memoria.
    }
  }, [trilhasIniciadas]);

  function confirmarInicioTrilha(trilha: Trilha) {
    setTrilhasIniciadas((atual) => {
      const proximo = new Set(atual);
      proximo.add(trilha.id);
      return proximo;
    });
    setConfirmandoTrilhaId(null);
    setAviso(`Trilha "${trilha.nome}" iniciada. Acompanhe os recursos abaixo.`);
  }

  function cancelarInscricaoTrilha(trilha: Trilha) {
    setTrilhasIniciadas((atual) => {
      const proximo = new Set(atual);
      proximo.delete(trilha.id);
      return proximo;
    });
    setAviso(`Inscricao na trilha "${trilha.nome}" cancelada.`);
  }

  async function acessarRecurso(recurso: Recurso) {
    setAviso(null);
    setAcessandoId(recurso.id);
    try {
      const r = await fetch(`/api/recursos/${recurso.id}/acesso`, {
        method: "POST",
        credentials: "include",
      });
      if (r.status === 401) {
        setAviso("Entre na sua conta para registrar o acesso ao recurso.");
      }
      const j = await r.json().catch(() => null);
      const destino = j?.url ?? recurso.url;
      if (destino) {
        window.open(destino, "_blank", "noopener,noreferrer");
      } else if (r.ok) {
        setAviso("Acesso registrado. Este recurso ainda não possui link disponível.");
      }
      // Sucesso: fecha o modo de confirmacao deste recurso.
      setConfirmandoId((atual) => (atual === recurso.id ? null : atual));
    } catch {
      setAviso("Não foi possível registrar o acesso agora. Tente novamente.");
    } finally {
      setAcessandoId((atual) => (atual === recurso.id ? null : atual));
    }
  }

  const recursosFiltrados = recursos.filter((rec) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      rec.titulo.toLowerCase().includes(termo) ||
      (rec.categoria ?? "").toLowerCase().includes(termo) ||
      (rec.tipo ?? "").toLowerCase().includes(termo)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Biblioteca de Recursos</h1>
        <p className="text-muted-foreground">
          Materiais curados para apoiar seu desenvolvimento acadêmico
        </p>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar recursos..."
              className="w-full pl-10 pr-4 py-3 border border-border bg-input-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
            />
          </div>
          <button
            type="button"
            disabled
            title="Filtros avançados em breve"
            className="flex items-center gap-2 px-6 py-3 border border-border text-muted-foreground rounded-lg cursor-not-allowed"
          >
            <Filter size={20} />
            Filtros
          </button>
        </div>
        {aviso && <p className="mt-3 text-sm text-primary">{aviso}</p>}
      </div>

      {/* Trilhas de Aprendizagem */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6 text-foreground">Trilhas de Aprendizagem</h2>
        {trilhas.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma trilha disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trilhas.map((trilha) => (
              <div
                key={trilha.id}
                className="border-2 border-primary/20 rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-primary" size={20} />
                  </div>
                  {trilha.publicoAlvo && (
                    <span className="px-2 py-1 text-xs rounded bg-success/15 text-success">
                      {trilha.publicoAlvo}
                    </span>
                  )}
                </div>
                <h3 className="font-medium mb-2 text-foreground">{trilha.nome}</h3>
                {trilha.descricao && (
                  <p className="text-sm text-muted-foreground mb-2">{trilha.descricao}</p>
                )}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{trilha.totalRecursos} recursos</p>
                </div>
                {trilhasIniciadas.has(trilha.id) ? (
                  <div className="mt-4 space-y-2">
                    <p className="flex items-center justify-center gap-2 text-sm text-success">
                      <CheckCircle2 size={16} />
                      Trilha iniciada
                    </p>
                    <button
                      type="button"
                      onClick={() => cancelarInscricaoTrilha(trilha)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
                      aria-label={`Cancelar inscrição na trilha ${trilha.nome}`}
                    >
                      <XCircle size={18} />
                      Cancelar inscrição
                    </button>
                  </div>
                ) : confirmandoTrilhaId === trilha.id ? (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => confirmarInicioTrilha(trilha)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      aria-label={`Confirmar início da trilha ${trilha.nome}`}
                    >
                      <CheckCircle2 size={18} />
                      Confirmar início
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoTrilhaId(null)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
                      aria-label={`Cancelar início da trilha ${trilha.nome}`}
                    >
                      <XCircle size={18} />
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAviso(null);
                      setConfirmandoTrilhaId(trilha.id);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <PlayCircle size={18} />
                    Iniciar Trilha
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Recursos */}
      {recursosFiltrados.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm p-6 text-muted-foreground">
          Nenhum recurso encontrado para a busca atual.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recursosFiltrados.map((recurso) => {
            const estilo = estiloRecurso(recurso.tipo);
            const Icone = estilo.icon;
            return (
              <div
                key={recurso.id}
                className="bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`h-2 bg-${estilo.color}-600`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${estilo.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icone className={`text-${estilo.color}-600`} size={24} />
                    </div>
                    {typeof recurso.visualizacoes === "number" && (
                      <span className="text-sm text-muted-foreground">
                        {recurso.visualizacoes} acessos
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">{recurso.titulo}</h3>
                  {recurso.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">{recurso.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    {recurso.tipo && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {recurso.tipo}
                      </span>
                    )}
                    {recurso.categoria && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {recurso.categoria}
                      </span>
                    )}
                  </div>
                  {confirmandoId === recurso.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => acessarRecurso(recurso)}
                        disabled={acessandoId === recurso.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Confirmar acesso a ${recurso.titulo}`}
                      >
                        {acessandoId === recurso.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        {acessandoId === recurso.id ? "Abrindo…" : "Confirmar acesso"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(null)}
                        disabled={acessandoId === recurso.id}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Cancelar acesso a ${recurso.titulo}`}
                      >
                        <XCircle size={18} />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAviso(null);
                        setConfirmandoId(recurso.id);
                      }}
                      className="w-full text-primary hover:text-primary/80 py-2 border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Acessar Recurso
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner Contribuir */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 text-white">
            <h2 className="text-2xl mb-4">Encontrou um recurso útil?</h2>
            <p className="mb-6">
              Compartilhe com a comunidade! Ajude outros estudantes sugerindo 
              artigos, vídeos ou podcasts que te ajudaram.
            </p>
            <button
              type="button"
              disabled
              title="Envio de sugestões em breve"
              className="bg-white/80 text-green-700 px-6 py-3 rounded-lg cursor-not-allowed"
            >
              Sugerir Recurso (em breve)
            </button>
          </div>
          <div className="h-64 md:h-auto">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1767102060241-130cb9260718?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwcmVzb3VyY2VzJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzczMzQwODY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Biblioteca de recursos"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
