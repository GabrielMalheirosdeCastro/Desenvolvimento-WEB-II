import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./AuthContext";

// ============================================================
// Guarda de rota: garante sessao valida antes de renderizar.
// ------------------------------------------------------------
// Enquanto a sessao e verificada (GET /api/auth/me) exibe um
// estado de carregamento. Sem sessao, redireciona para /login
// preservando o destino original em location.state.from.
// ============================================================

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"
        data-testid="auth-loading"
      >
        <div className="flex flex-col items-center gap-3 text-[#003366]">
          <div
            className="w-8 h-8 rounded-full border-4 border-[#003366]/20 border-t-[#0066CC] animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm">Verificando sessão…</p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
