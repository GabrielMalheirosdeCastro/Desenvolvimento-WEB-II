// ============================================================
// Testes unitarios — nucleo de autenticacao (apps/api/auth.js).
// Cobre hash/verify, JWT (sign/verify), getJwtSecret (dev/prod),
// cookieOptions, requireAuth e requireRole (RBAC — A4). Sem banco.
// ============================================================
import { describe, it, expect, afterEach, vi } from 'vitest';

const SECRET_OK = 'segredo-de-teste-suficientemente-longo-123';

// Carrega auth.js com um ambiente controlado. Reavalia o modulo (vi.resetModules)
// para recapturar a constante isProd, que e definida no load do modulo.
async function loadAuth({ prod = false, secret = SECRET_OK, cookieSecure } = {}) {
    vi.resetModules();
    process.env.NODE_ENV = prod ? 'production' : 'test';
    if (secret === null) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
    if (cookieSecure === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = cookieSecure;
    return import('../../apps/api/auth.js');
}

// Simula res do Express capturando status/json/next.
function fakeRes() {
    const out = { status: null, body: null };
    return {
        out,
        status(code) { out.status = code; return this; },
        json(obj) { out.body = obj; return this; },
        clearCookie() { return this; },
    };
}

afterEach(() => {
    // Restaura o ambiente padrao das suites (definido em tests/setup.mjs).
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = SECRET_OK;
    delete process.env.COOKIE_SECURE;
});

describe('hash e verificacao de senha (bcrypt)', () => {
    it('gera hash bcrypt valido e confere a senha correta', async () => {
        const auth = await loadAuth();
        const hash = await auth.hashPassword('Senha#Forte123');
        expect(hash.startsWith('$2')).toBe(true);
        expect(await auth.verifyPassword('Senha#Forte123', hash)).toBe(true);
    });

    it('rejeita senha errada e hash nulo', async () => {
        const auth = await loadAuth();
        const hash = await auth.hashPassword('Senha#Forte123');
        expect(await auth.verifyPassword('errada', hash)).toBe(false);
        expect(await auth.verifyPassword('Senha#Forte123', null)).toBe(false);
    });
});

describe('JWT (sign/verify)', () => {
    it('assina e decodifica um token com o payload do usuario', async () => {
        const auth = await loadAuth();
        const token = auth.signToken({
            id: 7, nome: 'Aluno', matricula: '23110145',
            email: 'a@faesa.br', tipo: 'ALUNO', eMentor: false,
        });
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
        const payload = auth.verifyToken(token);
        expect(payload.sub).toBe(7);
        expect(payload.matricula).toBe('23110145');
        expect(payload.tipo).toBe('ALUNO');
        expect(payload.eMentor).toBe(false);
    });

    it('verifyToken retorna null para token invalido ou ausente', async () => {
        const auth = await loadAuth();
        expect(auth.verifyToken('token.invalido.xxx')).toBeNull();
        expect(auth.verifyToken('')).toBeNull();
        expect(auth.verifyToken(undefined)).toBeNull();
    });
});

describe('getJwtSecret / authDisponivel', () => {
    it('em dev sem JWT_SECRET usa o fallback inseguro (auth disponivel)', async () => {
        const auth = await loadAuth({ prod: false, secret: null });
        expect(auth.authDisponivel()).toBe(true);
        expect(typeof auth.getJwtSecret()).toBe('string');
        // signToken funciona com o fallback de desenvolvimento.
        expect(auth.signToken({ id: 1 })).not.toBeNull();
    });

    it('em producao sem JWT_SECRET desativa o subsistema de auth', async () => {
        const auth = await loadAuth({ prod: true, secret: null });
        expect(auth.authDisponivel()).toBe(false);
        expect(auth.getJwtSecret()).toBeNull();
        expect(auth.signToken({ id: 1 })).toBeNull();
        expect(auth.verifyToken('qualquer.coisa.aqui')).toBeNull();
    });

    it('rejeita segredo curto (< 16 chars) em producao', async () => {
        const auth = await loadAuth({ prod: true, secret: 'curto' });
        expect(auth.authDisponivel()).toBe(false);
    });
});

describe('cookieOptions', () => {
    it('em producao o cookie e Secure e httpOnly/SameSite=strict', async () => {
        const auth = await loadAuth({ prod: true });
        const opts = auth.cookieOptions();
        expect(opts.secure).toBe(true);
        expect(opts.httpOnly).toBe(true);
        expect(opts.sameSite).toBe('strict');
    });

    it('em dev o cookie nao e Secure por padrao', async () => {
        const auth = await loadAuth({ prod: false });
        expect(auth.cookieOptions().secure).toBe(false);
    });

    it('COOKIE_SECURE=false sobrepoe e desativa Secure', async () => {
        const auth = await loadAuth({ prod: true, cookieSecure: 'false' });
        expect(auth.cookieOptions().secure).toBe(false);
    });
});

describe('requireAuth (middleware)', () => {
    it('responde 503 quando o subsistema de auth esta indisponivel', async () => {
        const auth = await loadAuth({ prod: true, secret: null });
        const res = fakeRes();
        let next = false;
        auth.requireAuth({ cookies: {} }, res, () => { next = true; });
        expect(res.out.status).toBe(503);
        expect(res.out.body.error).toBe('auth_indisponivel');
        expect(next).toBe(false);
    });

    it('responde 401 quando nao ha cookie de sessao', async () => {
        const auth = await loadAuth();
        const res = fakeRes();
        let next = false;
        auth.requireAuth({ cookies: {} }, res, () => { next = true; });
        expect(res.out.status).toBe(401);
        expect(res.out.body.error).toBe('nao_autenticado');
        expect(next).toBe(false);
    });

    it('injeta req.usuario e chama next com cookie valido', async () => {
        const auth = await loadAuth();
        const token = auth.signToken({ id: 9, tipo: 'ALUNO', matricula: 'x' });
        const req = { cookies: { [auth.COOKIE_NAME]: token } };
        const res = fakeRes();
        let next = false;
        auth.requireAuth(req, res, () => { next = true; });
        expect(next).toBe(true);
        expect(req.usuario.sub).toBe(9);
        expect(res.out.status).toBeNull();
    });
});

describe('requireRole (RBAC — A4)', () => {
    async function simular(papeis, tipo) {
        const auth = await loadAuth();
        const mw = auth.requireRole(...papeis);
        const req = { usuario: tipo === undefined ? undefined : { tipo } };
        const res = fakeRes();
        let next = false;
        mw(req, res, () => { next = true; });
        return { ...res.out, next };
    }

    it('autoriza o papel correto e chama next', async () => {
        const r = await simular(['COORDENADOR'], 'COORDENADOR');
        expect(r.next).toBe(true);
        expect(r.status).toBeNull();
    });

    it('nega papel insuficiente com 403 acesso_negado', async () => {
        const r = await simular(['COORDENADOR'], 'ALUNO');
        expect(r.next).toBe(false);
        expect(r.status).toBe(403);
        expect(r.body.error).toBe('acesso_negado');
    });

    it('comparacao de papel e case-insensitive', async () => {
        const r = await simular(['COORDENADOR'], 'coordenador');
        expect(r.next).toBe(true);
    });

    it('aceita multiplos papeis permitidos', async () => {
        const r = await simular(['ALUNO', 'COORDENADOR'], 'ALUNO');
        expect(r.next).toBe(true);
    });

    it('nega quando nao ha usuario na sessao (403)', async () => {
        const r = await simular(['COORDENADOR'], undefined);
        expect(r.status).toBe(403);
        expect(r.next).toBe(false);
    });
});
