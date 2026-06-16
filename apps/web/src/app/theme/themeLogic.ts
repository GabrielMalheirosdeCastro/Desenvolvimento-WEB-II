// ============================================================
// Logica pura de tema (Bloco H / item H9 — RF05, D2/RNF04).
// ------------------------------------------------------------
// Funcoes sem dependencia de DOM, isoladas para permitir testes
// unitarios em ambiente Node (Vitest) sem jsdom. O ThemeContext
// consome estas funcoes para decidir o tema efetivo.
// ============================================================

export type Tema = "claro" | "escuro" | "auto";

export const TEMAS_VALIDOS: readonly Tema[] = ["claro", "escuro", "auto"];

/**
 * Normaliza um valor arbitrario (ex.: vindo do localStorage) para um Tema
 * valido. Qualquer entrada desconhecida cai no tema "claro".
 */
export function normalizarTema(valor: unknown): Tema {
  return valor === "escuro" || valor === "auto" ? valor : "claro";
}

/**
 * Decide se o tema escuro deve estar ativo dada a preferencia do usuario e a
 * preferencia do sistema (prefers-color-scheme). No modo "auto" segue o
 * sistema; nos modos explicitos ignora o sistema.
 */
export function resolverEscuroAtivo(tema: Tema, prefereDarkSistema: boolean): boolean {
  return tema === "escuro" || (tema === "auto" && prefereDarkSistema);
}
