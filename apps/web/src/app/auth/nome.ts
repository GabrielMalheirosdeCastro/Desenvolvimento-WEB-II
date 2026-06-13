// ============================================================
// Helpers de exibicao de nome de usuario.
// ------------------------------------------------------------
// Extrai o primeiro nome e as iniciais ignorando prefixos de
// titulo academico/tratamento (Prof., Dr., etc.), para que a
// saudacao e o avatar fiquem corretos para qualquer usuario.
// ============================================================

const PREFIXOS_TITULO = new Set([
  "prof",
  "profa",
  "dr",
  "dra",
  "sr",
  "sra",
  "me",
  "ma",
  "msc",
  "phd",
]);

/** Tokeniza o nome, removendo prefixos de titulo/tratamento. */
function tokensNome(nome: string | undefined | null): string[] {
  return (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !PREFIXOS_TITULO.has(t.replace(/\.$/, "").toLowerCase()));
}

/** Primeiro nome real do usuario (sem titulo). Cai no fallback se vazio. */
export function primeiroNome(
  nome: string | undefined | null,
  fallback = "estudante",
): string {
  return tokensNome(nome)[0] || fallback;
}

/**
 * Iniciais do usuario (primeira + ultima palavra do nome, sem titulo).
 * Cai nas duas primeiras letras do e-mail se nao houver nome.
 */
export function iniciaisNome(
  nome: string | undefined | null,
  emailFallback?: string,
): string {
  const t = tokensNome(nome);
  if (t.length > 0) {
    const primeira = t[0][0] ?? "";
    const ultima = t.length > 1 ? t[t.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
  }
  return (emailFallback ?? "?").slice(0, 2).toUpperCase();
}
