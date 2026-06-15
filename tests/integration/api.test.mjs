// ============================================================
// Testes de integracao (supertest) — apiRouter em modo fallback.
// ------------------------------------------------------------
// Sobe um app Express minimo montando o apiRouter SEM banco
// (DATABASE_URL removido em tests/setup.mjs). Valida:
//   - contratos de fallback (source: 'fallback') das rotas publicas;
//   - guardas requireAuth (401 sem cookie) — inclui rotas LGPD;
//   - guardas requireRole (401/403/segue) no fluxo do COORDENADOR.
// Nao toca o Postgres de producao.
// ============================================================
import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { apiRouter } from '../../apps/api/routes.js';
import { COOKIE_NAME, signToken } from '../../apps/api/auth.js';

function makeApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', apiRouter);
    return app;
}

let app;
let cookieAluno;
let cookieCoordenador;

beforeAll(() => {
    app = makeApp();
    const aluno = signToken({ id: 7, nome: 'Aluno', matricula: '23110145', email: 'a@faesa.br', tipo: 'ALUNO', eMentor: false });
    const coord = signToken({ id: 1, nome: 'Coord', matricula: 'C0001', email: 'c@faesa.br', tipo: 'COORDENADOR', eMentor: false });
    cookieAluno = `${COOKIE_NAME}=${aluno}`;
    cookieCoordenador = `${COOKIE_NAME}=${coord}`;
});

describe('contratos de fallback (sem banco)', () => {
    it('GET /api/_status indica fallback', async () => {
        const res = await request(app).get('/api/_status');
        expect(res.status).toBe(200);
        expect(res.body.db).toBe('fallback');
    });

    it('GET /api/me devolve usuario de fallback', async () => {
        const res = await request(app).get('/api/me');
        expect(res.status).toBe(200);
        expect(res.body.source).toBe('fallback');
        expect(res.body.usuario.matricula_institucional).toBe('23110145');
    });

    it('GET /api/dashboard/upcoming devolve itens de fallback', async () => {
        const res = await request(app).get('/api/dashboard/upcoming');
        expect(res.status).toBe(200);
        expect(res.body.source).toBe('fallback');
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('GET /api/dashboard/week devolve serie semanal', async () => {
        const res = await request(app).get('/api/dashboard/week');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items ?? res.body.data ?? [])).toBe(true);
    });
});

describe('guarda requireAuth — 401 sem cookie', () => {
    const rotas = [
        ['get', '/api/usuario/perfil'],
        ['get', '/api/usuario/dados'],     // LGPD — portabilidade
        ['delete', '/api/usuario/conta'],  // LGPD — exclusao/anonimizacao
        ['get', '/api/metas'],
        ['get', '/api/bem-estar'],
        ['get', '/api/notificacoes'],
    ];
    it.each(rotas)('%s %s sem sessao -> 401', async (metodo, rota) => {
        const res = await request(app)[metodo](rota);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('nao_autenticado');
    });
});

describe('guarda requireRole (COORDENADOR) — /api/coordenacao/overview', () => {
    it('sem cookie -> 401', async () => {
        const res = await request(app).get('/api/coordenacao/overview');
        expect(res.status).toBe(401);
    });

    it('com papel ALUNO -> 403 acesso_negado', async () => {
        const res = await request(app)
            .get('/api/coordenacao/overview')
            .set('Cookie', cookieAluno);
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('acesso_negado');
    });

    it('com papel COORDENADOR passa as guardas (503 sem banco)', async () => {
        const res = await request(app)
            .get('/api/coordenacao/overview')
            .set('Cookie', cookieCoordenador);
        // Passou requireAuth + requireRole; sem banco o handler responde 503.
        expect(res.status).toBe(503);
        expect(res.body.error).toBe('db_indisponivel');
    });
});

describe('LGPD — rotas do titular autenticado (sem banco -> 503)', () => {
    it('GET /api/usuario/dados autenticado responde 503 sem banco', async () => {
        const res = await request(app)
            .get('/api/usuario/dados')
            .set('Cookie', cookieAluno);
        // Passou requireAuth (anti-IDOR via req.usuario.sub); sem banco -> 503.
        expect(res.status).toBe(503);
        expect(res.body.error).toBe('db_indisponivel');
    });

    it('DELETE /api/usuario/conta autenticado responde 503 sem banco', async () => {
        const res = await request(app)
            .delete('/api/usuario/conta')
            .set('Cookie', cookieAluno)
            .send({});
        expect(res.status).toBe(503);
        expect(res.body.error).toBe('db_indisponivel');
    });
});
