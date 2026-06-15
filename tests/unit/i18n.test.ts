// ============================================================
// Testes unitarios — nucleo de internacionalizacao (i18n / D8 / H10).
// ------------------------------------------------------------
// Cobre o modulo puro apps/web/src/app/i18n/translate.ts:
//   - resolverChave (notacao de ponto, chaves ausentes/parciais);
//   - interpolar ({{var}});
//   - criarT (lookup no catalogo ativo, fallback pt-BR, chave crua).
// Tambem valida a paridade de chaves entre pt-BR.json e en-US.json
// para evitar regressao de traducao (telas meio-traduzidas).
// ============================================================
import { describe, it, expect } from 'vitest';
import {
    resolverChave,
    interpolar,
    criarT,
} from '../../apps/web/src/app/i18n/translate';
import ptBR from '../../apps/web/src/app/i18n/locales/pt-BR.json';
import enUS from '../../apps/web/src/app/i18n/locales/en-US.json';

describe('resolverChave', () => {
    const catalogo = { nav: { inicio: 'Início', vazio: {} } };

    it('resolve chave aninhada em notacao de ponto', () => {
        expect(resolverChave(catalogo, 'nav.inicio')).toBe('Início');
    });

    it('retorna undefined para chave inexistente', () => {
        expect(resolverChave(catalogo, 'nav.ausente')).toBeUndefined();
        expect(resolverChave(catalogo, 'inexistente.profundo')).toBeUndefined();
    });

    it('retorna undefined para chave vazia', () => {
        expect(resolverChave(catalogo, '')).toBeUndefined();
    });

    it('retorna objeto quando a chave aponta para um galho, nao folha', () => {
        expect(resolverChave(catalogo, 'nav.vazio')).toEqual({});
    });
});

describe('interpolar', () => {
    it('substitui variaveis {{var}}', () => {
        expect(interpolar('Olá, {{nome}}!', { nome: 'Ana' })).toBe('Olá, Ana!');
    });

    it('substitui multiplas ocorrencias da mesma variavel', () => {
        expect(interpolar('{{x}}+{{x}}', { x: 2 })).toBe('2+2');
    });

    it('retorna o texto intacto sem variaveis', () => {
        expect(interpolar('sem vars')).toBe('sem vars');
    });
});

describe('criarT', () => {
    const ativo = { a: { b: 'ativo-b' }, so_ativo: 'ok' };
    const fallback = { a: { b: 'fb-b', c: 'fb-c' }, so_ativo: 'fb' };

    it('usa o valor do catalogo ativo quando presente', () => {
        const t = criarT(ativo, fallback);
        expect(t('a.b')).toBe('ativo-b');
        expect(t('so_ativo')).toBe('ok');
    });

    it('cai para o fallback quando a chave falta no ativo', () => {
        const t = criarT(ativo, fallback);
        expect(t('a.c')).toBe('fb-c');
    });

    it('devolve a propria chave quando ausente em ambos', () => {
        const t = criarT(ativo, fallback);
        expect(t('inexistente.total')).toBe('inexistente.total');
    });

    it('interpola variaveis no valor resolvido', () => {
        const t = criarT({ saudacao: 'Oi {{nome}}' }, {});
        expect(t('saudacao', { nome: 'Gabriel' })).toBe('Oi Gabriel');
    });
});

describe('paridade de catalogos pt-BR x en-US', () => {
    function chavesPlanas(obj: Record<string, unknown>, prefixo = ''): string[] {
        return Object.entries(obj).flatMap(([k, v]) => {
            const caminho = prefixo ? `${prefixo}.${k}` : k;
            return v && typeof v === 'object'
                ? chavesPlanas(v as Record<string, unknown>, caminho)
                : [caminho];
        });
    }

    it('en-US possui exatamente as mesmas chaves de pt-BR', () => {
        const chavesPt = chavesPlanas(ptBR as Record<string, unknown>).sort();
        const chavesEn = chavesPlanas(enUS as Record<string, unknown>).sort();
        expect(chavesEn).toEqual(chavesPt);
    });
});
