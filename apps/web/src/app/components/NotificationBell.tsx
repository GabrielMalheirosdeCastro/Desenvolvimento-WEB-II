import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Backend real (RF10 / B5): o sininho consome /api/notificacoes (requireAuth).
// Cada notificacao e escopada ao usuario logado (anti-IDOR no backend). A UI
// degrada para "Nenhuma notificacao" caso a sessao expire ou o banco caia.
type Notificacao = {
  id: number;
  titulo: string | null;
  mensagem: string | null;
  tipo: string | null;
  lida: boolean;
  dataCriacao: string | null;
};

/** Converte um timestamp ISO em rotulo relativo curto ("5 min atras"). */
function tempoRelativo(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const segundos = Math.floor((Date.now() - data.getTime()) / 1000);
  if (segundos < 60) return "agora";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos} min atrás`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h atrás`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ontem" : `${dias} dias atrás`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = await res.json().catch(() => null);
      setNotifications(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const markAsRead = async (id: number) => {
    // Atualizacao otimista; persiste no backend em seguida.
    setNotifications((atual) =>
      atual.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    try {
      await fetch(`/api/notificacoes/${id}/marcar-lida`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Mantem o estado otimista; a proxima carga reconcilia.
    }
  };

  const markAllAsRead = async () => {
    setNotifications((atual) => atual.map((n) => ({ ...n, lida: true })));
    try {
      await fetch("/api/notificacoes/marcar-todas-lidas", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // idem markAsRead
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} className="text-[#003366]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF8C00] text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#003366]/10 z-20">
            <div className="p-4 border-b border-[#003366]/10 flex items-center justify-between">
              <h3 className="font-semibold text-[#003366]">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#0066CC] hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#6C757D]">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b border-[#003366]/5 hover:bg-[#F5F7FA] cursor-pointer transition-colors ${
                      !notification.lida ? "bg-[#0066CC]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notification.tipo === "success"
                            ? "bg-[#28A745]"
                            : notification.tipo === "warning"
                            ? "bg-[#FF8C00]"
                            : "bg-[#0066CC]"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm mb-1 ${
                            !notification.lida
                              ? "font-semibold text-[#003366]"
                              : "text-[#003366]"
                          }`}
                        >
                          {notification.titulo}
                        </h4>
                        <p className="text-sm text-[#6C757D] mb-1">
                          {notification.mensagem}
                        </p>
                        <span className="text-xs text-[#6C757D]">
                          {tempoRelativo(notification.dataCriacao)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-[#003366]/10">
              <button className="w-full text-center text-sm text-[#0066CC] hover:text-[#003366] transition-colors">
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
