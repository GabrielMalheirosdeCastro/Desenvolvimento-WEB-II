import { useCallback, useEffect, useState } from "react";
import { Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";

// Tela dedicada de Eventos (RF12 / B6). Antes os eventos ficavam misturados
// numa aba da Biblioteca; agora tem pagina propria com inscricao real.
// Lista publica via GET /api/eventos; inscricao via POST /api/eventos/:id/inscrever
// (requireAuth, escopado ao usuario). As inscricoes do usuario sao hidratadas
// por GET /api/eventos/minhas para marcar o estado "Inscrito".
type Evento = {
  id: number;
  titulo: string;
  descricao?: string;
  tipo?: string;
  data?: string;
  local?: string;
  vagas?: number;
};

export function EventsPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscritos, setInscritos] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/eventos", { headers: { Accept: "application/json" } });
      const data = await res.json().catch(() => null);
      setEventos(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setEventos([]);
      setErro("Não foi possível carregar os eventos agora.");
    } finally {
      setCarregando(false);
    }

    // Inscricoes do usuario (silencioso se nao logado).
    try {
      const res = await fetch("/api/eventos/minhas", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const ids = Array.isArray(data?.items)
          ? data.items.map((i: { eventoId: number }) => i.eventoId)
          : [];
        setInscritos(new Set(ids));
      }
    } catch {
      /* sem sessao: mantem conjunto vazio */
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function inscrever(evento: Evento) {
    if (inscritos.has(evento.id) || enviando != null) return;
    setEnviando(evento.id);
    setAviso(null);
    try {
      const res = await fetch(`/api/eventos/${evento.id}/inscrever`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        setAviso("Entre na sua conta para se inscrever em eventos.");
        return;
      }
      if (!res.ok) {
        setAviso("Não foi possível concluir a inscrição. Tente novamente.");
        return;
      }
      setInscritos((atual) => new Set(atual).add(evento.id));
    } catch {
      setAviso("Falha de conexão ao se inscrever.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Eventos Institucionais</h1>
        <p className="text-muted-foreground">
          Palestras, oficinas e encontros do programa de acolhimento da FAESA
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6 flex items-center gap-2 text-foreground">
          <Calendar className="text-primary" size={20} />
          Próximos Eventos
        </h2>

        {aviso && <p className="mb-4 text-sm text-primary">{aviso}</p>}

        {carregando ? (
          <p className="text-muted-foreground">Carregando eventos...</p>
        ) : erro ? (
          <p className="text-destructive">{erro}</p>
        ) : eventos.length === 0 ? (
          <p className="text-muted-foreground">Nenhum evento agendado no momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((ev) => {
              const inscrito = inscritos.has(ev.id);
              return (
                <div
                  key={ev.id}
                  className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                      {ev.tipo || "Evento"}
                    </span>
                    {typeof ev.vagas === "number" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={12} /> {ev.vagas} vagas
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">{ev.titulo}</h3>
                  {ev.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">{ev.descricao}</p>
                  )}
                  <div className="text-sm text-foreground space-y-1 mb-4">
                    {ev.data && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span>{new Date(ev.data).toLocaleString("pt-BR")}</span>
                      </div>
                    )}
                    {ev.local && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-muted-foreground" />
                        <span>{ev.local}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => inscrever(ev)}
                    disabled={inscrito || enviando === ev.id}
                    className={`mt-auto w-full py-2 rounded-lg transition-colors ${
                      inscrito
                        ? "bg-success/10 text-success border border-success/30 cursor-default flex items-center justify-center gap-2"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-60"
                    }`}
                  >
                    {inscrito ? (
                      <>
                        <CheckCircle2 size={16} /> Inscrito
                      </>
                    ) : enviando === ev.id ? (
                      "Inscrevendo..."
                    ) : (
                      "Inscrever-se"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
