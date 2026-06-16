// ============================================================
// Testes unitarios — logica pura de tema (H9 / D2 / RNF04).
// ------------------------------------------------------------
// Cobre o modulo apps/web/src/app/theme/themeLogic.ts:
//   - normalizarTema (valores validos, invalidos, nulos);
//   - resolverEscuroAtivo (modos explicitos x modo "auto" seguindo
//     a preferencia do sistema).
// Sem dependencia de DOM — roda no ambiente Node do Vitest.
// ============================================================
import { describe, it, expect } from 'vitest';
import {
    normalizarTema,
    resolverEscuroAtivo,
    TEMAS_VALIDOS,
} from '../../apps/web/src/app/theme/themeLogic';

describe('normalizarTema', () => {
    it('mantem os temas validos inalterados', () => {
        expect(normalizarTema('claro')).toBe('claro');
        expect(normalizarTema('escuro')).toBe('escuro');
        expect(normalizarTema('auto')).toBe('auto');
    });

    it('cai em "claro" para valores desconhecidos ou ausentes', () => {
        expect(normalizarTema(null)).toBe('claro');
        expect(normalizarTema(undefined)).toBe('claro');
        expect(normalizarTema('dark')).toBe('claro');
        expect(normalizarTema('')).toBe('claro');
        expect(normalizarTema(42)).toBe('claro');
    });
});

describe('resolverEscuroAtivo', () => {
    it('modo "escuro" sempre ativa, ignorando o sistema', () => {
        expect(resolverEscuroAtivo('escuro', false)).toBe(true);
        expect(resolverEscuroAtivo('escuro', true)).toBe(true);
    });

    it('modo "claro" nunca ativa, ignorando o sistema', () => {
        expect(resolverEscuroAtivo('claro', false)).toBe(false);
        expect(resolverEscuroAtivo('claro', true)).toBe(false);
    });

    it('modo "auto" segue a preferencia do sistema', () => {
        expect(resolverEscuroAtivo('auto', true)).toBe(true);
        expect(resolverEscuroAtivo('auto', false)).toBe(false);
    });
});

describe('TEMAS_VALIDOS', () => {
    it('expoe exatamente os tres temas suportados', () => {
        expect([...TEMAS_VALIDOS]).toEqual(['claro', 'escuro', 'auto']);
    });
});
