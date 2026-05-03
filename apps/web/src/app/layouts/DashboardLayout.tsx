import { Outlet, NavLink, useNavigate } from "react-router";
import {
  Home,
  BookOpen,
  Brain,
  Users,
  MessageSquare,
  Library,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "../components/NotificationBell";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const menuItems = [
    { to: "/dashboard", icon: Home, label: "Início", end: true },
    { to: "/dashboard/plano-estudos", icon: BookOpen, label: "Plano de Estudos" },
    { to: "/dashboard/concentracao", icon: Brain, label: "Concentração" },
    { to: "/dashboard/mentoria", icon: Users, label: "Mentoria" },
    { to: "/dashboard/forum", icon: MessageSquare, label: "Fórum" },
    { to: "/dashboard/biblioteca", icon: Library, label: "Biblioteca" },
    { to: "/dashboard/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#003366] text-white">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-semibold">FAESA Acolhimento</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#0066CC] text-white"
                    : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#003366] text-white">
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <h1 className="text-lg font-semibold">FAESA Acolhimento</h1>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#0066CC] text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 absolute bottom-0 left-0 right-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors w-full"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:justify-end border-b border-[#003366]/10">
          <button
            className="lg:hidden text-[#003366]"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-[#6C757D] hidden sm:inline">Gabriel Malheiros de Castro</span>
            <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-medium">
              GM
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}