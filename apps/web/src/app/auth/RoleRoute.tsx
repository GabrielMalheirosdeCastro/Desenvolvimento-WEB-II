import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

// ============================================================
// Guarda de rota por papel (RBAC — A4).
// ------------------------------------------------------------
// Estende a protecao de sessao com verificacao de papel. Deve
// ser usado DENTRO de uma arvore ja protegida por sessao
// (ProtectedRoute). Enquanto a sessao e verificada exibe um
// estado de carregamento; sem o papel exigido redireciona para
// o dashboard (a fronteira real de autorizacao e a API, que
// responde 403 — aqui e apenas UX).
// ============================================================

export function RoleRoute({
  papeis,
  children,
}: {
  papeis: string[];
  children: ReactNode;
}) {
  const { carregando, autenticado, temPapel } = useAuth();

  if (carregando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-testid="role-loading"
      >
        <div className="flex flex-col items-center gap-3 text-foreground">
          <div
            className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm">Verificando permissão…</p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  if (!temPapel(...papeis)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
