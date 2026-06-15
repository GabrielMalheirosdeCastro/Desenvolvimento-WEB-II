// ============================================================
// Testes unitarios — motor curado do chatbot (apps/api/chatbot.js).
// Cobre faixas etarias, derivacao por data de nascimento, rede de
// seguranca (crise -> CVV/NAP), deteccao de intencoes e adaptacao
// de conteudo por faixa (RF16). Sem banco.
// ============================================================
import { describe, it, expect } from 'vitest';
import * as cb from '../../apps/api/chatbot.js';

describe('faixas etarias', () => {
    it('expoe as faixas canonicas', () => {
        expect(cb.FAIXAS).toEqual(['17-20', '21-25', '26+']);
    });

    it('valida e rejeita faixas', () => {
        expect(cb.faixaValida('21-25')).toBe(true);
        expect(cb.faixaValida('30-40')).toBe(false);
        expect(cb.faixaValida(null)).toBe(false);
    });
});

describe('derivarFaixa (a partir da data de nascimento)', () => {
    const hoje = new Date();
    const nasc = (anos) => new Date(hoje.getFullYear() - anos, hoje.getMonth(), hoje.getDate());

    it('mapeia idades para as faixas corretas', () => {
        expect(cb.derivarFaixa(nasc(18))).toBe('17-20');
        expect(cb.derivarFaixa(nasc(23))).toBe('21-25');
        expect(cb.derivarFaixa(nasc(30))).toBe('26+');
    });

    it('retorna null para data ausente ou invalida', () => {
        expect(cb.derivarFaixa(null)).toBeNull();
        expect(cb.derivarFaixa('data-invalida')).toBeNull();
    });
});

describe('rede de seguranca (crise tem prioridade absoluta)', () => {
    it('detecta crise e encaminha para CVV (188) e NAP', () => {
        const r = cb.gerarResposta('nao aguento mais, penso em suicidio', '21-25');
        expect(r.intencao).toBe('crise');
        expect(r.crise).toBe(true);
        expect(r.sentimento).toBe('critico');
        expect(r.conteudo).toContain('188');
        expect(r.conteudo).toMatch(/NAP/i);
    });
});

describe('deteccao de intencoes (tolerante a acentos)', () => {
    const casos = [
        ['estou com muita ansiedade', 'ansiedade'],
        ['nao consigo dormir, insonia', 'sono'],
        ['preciso organizar meu tempo', 'organizacao'],
        ['estou desanimado, quero desistir', 'motivacao'],
        ['tenho prova amanha', 'prova'],
        ['me sinto sozinho na faesa', 'adaptacao'],
        ['ola, bom dia', 'saudacao'],
        ['quero falar com um psicologo', 'apoio_humano'],
        ['xyzqwerty texto aleatorio', 'outro'],
        ['', 'outro'],
    ];
    it.each(casos)('classifica "%s" como %s', (msg, esperado) => {
        expect(cb.gerarResposta(msg, '21-25').intencao).toBe(esperado);
    });
});

describe('adaptacao por faixa etaria (RF16)', () => {
    it('gera conteudo diferente por faixa para a mesma intencao', () => {
        const a = cb.gerarResposta('estou ansioso', '17-20').conteudo;
        const b = cb.gerarResposta('estou ansioso', '21-25').conteudo;
        const c = cb.gerarResposta('estou ansioso', '26+').conteudo;
        expect(a).not.toBe(b);
        expect(b).not.toBe(c);
        expect(a).not.toBe(c);
    });

    it('faixa invalida cai no padrao (21-25)', () => {
        const padrao = cb.gerarResposta('estou ansioso', '21-25').conteudo;
        expect(cb.gerarResposta('estou ansioso', 'faixa-x').conteudo).toBe(padrao);
    });
});
