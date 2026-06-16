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
// Contexto de tema da SPA (Bloco H / item H9 — RF05, D2/RNF04).
// ------------------------------------------------------------
// Persiste a preferencia de tema (claro/escuro/automatico) em
// localStorage e aplica a classe `.dark` em <html> conforme a
// escolha. No modo "automatico" segue a preferencia do sistema
// (prefers-color-scheme) e reage a mudancas em tempo real.
//
// A partir da v1.18.0 todas as telas usam design tokens semanticos,
// portanto o tema escuro cobre a interface por completo. A logica
// pura de decisao vive em ./themeLogic para permitir testes em Node.
// ============================================================

import { normalizarTema, resolverEscuroAtivo, type Tema } from "./themeLogic";

export type { Tema };

const STORAGE_KEY = "sa_tema";

interface ThemeContextValue {
  tema: Tema;
  escuroAtivo: boolean;
  definirTema: (tema: Tema) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function lerTemaSalvo(): Tema {
  if (typeof window === "undefined") return "claro";
  return normalizarTema(window.localStorage.getItem(STORAGE_KEY));
}

function sistemaPrefereDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);
  const [escuroAtivo, setEscuroAtivo] = useState<boolean>(false);

  // Aplica o tema ao <html> e mantem em sincronia com o sistema no modo auto.
  useEffect(() => {
    const aplicar = () => {
      const escuro = resolverEscuroAtivo(tema, sistemaPrefereDark());
      setEscuroAtivo(escuro);
      document.documentElement.classList.toggle("dark", escuro);
    };
    aplicar();

    if (tema === "auto" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", aplicar);
      return () => mq.removeEventListener("change", aplicar);
    }
    return undefined;
  }, [tema]);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    try {
      window.localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // Ignora ambientes sem acesso a localStorage.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ tema, escuroAtivo, definirTema }),
    [tema, escuroAtivo, definirTema],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>.");
  }
  return ctx;
}
