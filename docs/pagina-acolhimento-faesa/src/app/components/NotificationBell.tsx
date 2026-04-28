import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nova meta disponível",
      message: "Revise seu plano de estudos para esta semana",
      time: "5 min atrás",
      read: false,
      type: "info",
    },
    {
      id: 2,
      title: "Sessão de mentoria confirmada",
      message: "Sua sessão com Ana Silva está agendada para amanhã às 14h",
      time: "1 hora atrás",
      read: false,
      type: "success",
    },
    {
      id: 3,
      title: "Questionário de bem-estar",
      message: "Não se esqueça de preencher sua avaliação semanal",
      time: "2 horas atrás",
      read: true,
      type: "warning",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
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
                      !notification.read ? "bg-[#0066CC]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notification.type === "success"
                            ? "bg-[#28A745]"
                            : notification.type === "warning"
                            ? "bg-[#FF8C00]"
                            : "bg-[#0066CC]"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm mb-1 ${
                            !notification.read
                              ? "font-semibold text-[#003366]"
                              : "text-[#003366]"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p className="text-sm text-[#6C757D] mb-1">
                          {notification.message}
                        </p>
                        <span className="text-xs text-[#6C757D]">
                          {notification.time}
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
