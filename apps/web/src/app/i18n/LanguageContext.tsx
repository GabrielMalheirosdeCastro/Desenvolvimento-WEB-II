import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import { criarT, type Catalogo } from "./translate";

// ============================================================
// Contexto de internacionalização da SPA (D8/RNF10 + H10).
// ------------------------------------------------------------
// Implementação client-side (política "tudo na VPS" — sem serviço de
// tradução externo), espelhando o padrão já validado do ThemeContext:
//   - persiste a preferência de idioma em localStorage (`sa_idioma`);
//   - reidrata no boot e reflete o idioma no atributo `lang` do <html>
//     (acessibilidade / leitor de tela — sinergia com D2);
//   - expõe `t(chave)` com fallback automático para pt-BR.
//
// O catálogo pt-BR é o idioma-base; chaves ausentes no en-US caem para
// pt-BR e, em último caso, devolvem a própria chave (nunca texto vazio).
// ============================================================

export type Idioma = "pt-BR" | "en-US";

const STORAGE_KEY = "sa_idioma";

const CATALOGOS: Record<Idioma, Catalogo> = {
  "pt-BR": ptBR as Catalogo,
  "en-US": enUS as Catalogo,
};

interface LanguageContextValue {
  idioma: Idioma;
  definirIdioma: (idioma: Idioma) => void;
  t: (chave: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lerIdiomaSalvo(): Idioma {
  if (typeof window === "undefined") return "pt-BR";
  const salvo = window.localStorage.getItem(STORAGE_KEY);
  return salvo === "en-US" ? "en-US" : "pt-BR";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(lerIdiomaSalvo);

  // Reflete o idioma no <html lang="..."> a cada mudança (acessibilidade).
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = idioma;
    }
  }, [idioma]);

  const definirIdioma = useCallback((novo: Idioma) => {
    setIdioma(novo);
    try {
      window.localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // Ignora ambientes sem acesso a localStorage.
    }
  }, []);

  const t = useMemo(
    () => criarT(CATALOGOS[idioma], CATALOGOS["pt-BR"]),
    [idioma],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ idioma, definirIdioma, t }),
    [idioma, definirIdioma, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n deve ser usado dentro de <LanguageProvider>.");
  }
  return ctx;
}
