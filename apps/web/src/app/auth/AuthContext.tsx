import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ============================================================
// Contexto de autenticacao da SPA (Bloco A / Fase 4).
// ------------------------------------------------------------
// Mantem o estado da sessao do usuario, hidratado a partir de
// GET /api/auth/me (cookie httpOnly). Expoe login, logout e o
// estado de carregamento inicial. Same-origin: o Express serve a
// SPA e em dev o Vite faz proxy de /api -> :3010, portanto o cookie
// httpOnly e enviado automaticamente (credentials: 'include').
// ============================================================

export interface Usuario {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  tipo: string;
  eMentor: boolean;
}

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  recarregar: () => Promise<void>;
}

/** Erro de autenticacao com codigo legivel vindo da API. */
export class AuthError extends Error {
  codigo: string;
  status: number;
  constructor(codigo: string, status: number) {
    super(codigo);
    this.name = "AuthError";
    this.codigo = codigo;
    this.status = status;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function lerErro(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return typeof j?.error === "string" ? j.error : "erro_desconhecido";
  } catch {
    return "erro_desconhecido";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setUsuario(data?.usuario ?? null);
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      await recarregar();
      if (ativo) setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) {
      throw new AuthError(await lerErro(res), res.status);
    }
    const data = await res.json();
    setUsuario(data?.usuario ?? null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUsuario(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      carregando,
      autenticado: usuario !== null,
      login,
      logout,
      recarregar,
    }),
    [usuario, carregando, login, logout, recarregar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  }
  return ctx;
}
