// ============================================================
// Núcleo puro de tradução (i18n) — sem React, sem efeitos.
// ------------------------------------------------------------
// Resolve chaves em notação de ponto ("nav.inicio") sobre catálogos
// aninhados, com fallback para o catálogo padrão (pt-BR) e, em último
// caso, devolve a própria chave. Suporta interpolação simples {{var}}.
//
// Isolado em módulo próprio para ser testável de forma determinística
// no Vitest (ambiente node), sem montar a árvore React.
// ============================================================

export type Catalogo = Record<string, unknown>;

/** Resolve uma chave em notação de ponto dentro de um catálogo aninhado. */
export function resolverChave(catalogo: Catalogo, chave: string): unknown {
    if (!chave) return undefined;
    return chave.split(".").reduce<unknown>((acc, parte) => {
        if (acc && typeof acc === "object") {
            return (acc as Record<string, unknown>)[parte];
        }
        return undefined;
    }, catalogo);
}

/** Aplica interpolação {{var}} sobre um texto. */
export function interpolar(texto: string, vars?: Record<string, string | number>): string {
    if (!vars) return texto;
    return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
        texto,
    );
}

/**
 * Cria a função de tradução `t`. Procura a chave no catálogo ativo;
 * se ausente, recorre ao catálogo de fallback; se ainda ausente,
 * devolve a própria chave (evita tela quebrada com texto vazio).
 */
export function criarT(ativo: Catalogo, fallback: Catalogo) {
    return function t(chave: string, vars?: Record<string, string | number>): string {
        let valor = resolverChave(ativo, chave);
        if (typeof valor !== "string") {
            valor = resolverChave(fallback, chave);
        }
        if (typeof valor !== "string") {
            return chave;
        }
        return interpolar(valor, vars);
    };
}
