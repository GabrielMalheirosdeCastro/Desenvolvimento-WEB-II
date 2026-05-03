// ============================================================
// Roteador da API REST do Site de Acolhimento FAESA.
// ------------------------------------------------------------
// Endpoints minimos do prototipo:
//   GET /api/me                 -> persona logada (sem auth real)
//   GET /api/dashboard/upcoming -> proximas atividades de estudo
//   GET /api/dashboard/week     -> horas de estudo da semana corrente
//   GET /api/dashboard/badges   -> conquistas recentes
//
// Todos os endpoints sao resilientes: se o pool Postgres nao
// estiver inicializado (DATABASE_URL ausente) ou a query falhar,
// devolvem fallback estatico marcado com `source: "fallback"`.
// ============================================================
import { Router } from 'express';
import { query, isConnected } from './db.js';

export const apiRouter = Router();

// Matricula da persona principal (Aluno) usada como "logado" no prototipo.
const MATRICULA_PADRAO = '23110145';

apiRouter.get('/_status', (_req, res) => {
    res.json({ db: isConnected() ? 'connected' : 'fallback' });
});

// --------------------------------------------------------------
// GET /api/me
// --------------------------------------------------------------
apiRouter.get('/me', async (_req, res) => {
    const rows = await query(
        `SELECT id, matricula_institucional, email_institucional, nome,
                tipo_usuario, e_mentor, created_at
             FROM usuarios WHERE matricula_institucional = $1 LIMIT 1`,
        [MATRICULA_PADRAO],
    );
    if (rows && rows.length > 0) {
        return res.json({ source: 'db', usuario: rows[0] });
    }
    res.json({
        source: 'fallback',
        usuario: {
            id: 0,
            matricula_institucional: MATRICULA_PADRAO,
            email_institucional: 'gabriel.castro@faesa.br',
            nome: 'Gabriel Malheiros de Castro',
            tipo_usuario: 'aluno',
            e_mentor: false,
        },
    });
});

// --------------------------------------------------------------
// GET /api/dashboard/upcoming
// --------------------------------------------------------------
apiRouter.get('/dashboard/upcoming', async (_req, res) => {
    const rows = await query(
        `SELECT a.id, a.nome AS title,
                        TO_CHAR(a.data_agendada, 'DD/MM') AS date,
                        COALESCE(NULLIF(a.descricao, ''), 'Estudo') AS type,
                        COALESCE(a.status, 'pending') AS status
             FROM atividades_estudo a
             JOIN usuarios u ON u.id = a.usuario_id
             WHERE u.matricula_institucional = $1
                 AND (a.data_agendada IS NULL OR a.data_agendada >= NOW())
             ORDER BY a.data_agendada NULLS LAST
             LIMIT 4`,
        [MATRICULA_PADRAO],
    );
    if (rows && rows.length > 0) {
        return res.json({ source: 'db', items: rows });
    }
    res.json({
        source: 'fallback',
        items: [
            { id: 1, title: 'Revisão de Cálculo I', date: '13/03', type: 'Estudo', status: 'pending' },
            { id: 2, title: 'Trabalho de Programação', date: '15/03', type: 'Entrega', status: 'pending' },
            { id: 3, title: 'Sessão de Mentoria', date: '16/03', type: 'Mentoria', status: 'scheduled' },
            { id: 4, title: 'Avaliação de Bem-estar', date: '18/03', type: 'Questionário', status: 'pending' },
        ],
    });
});

// --------------------------------------------------------------
// GET /api/dashboard/week
// --------------------------------------------------------------
apiRouter.get('/dashboard/week', async (_req, res) => {
    const rows = await query(
        `SELECT EXTRACT(DOW FROM a.data_realizacao)::int AS dow,
                        COALESCE(SUM(a.duracao_minutos), 0)::int AS minutos
             FROM atividades_estudo a
             JOIN usuarios u ON u.id = a.usuario_id
             WHERE u.matricula_institucional = $1
                 AND a.data_realizacao >= DATE_TRUNC('week', NOW())
             GROUP BY dow ORDER BY dow`,
        [MATRICULA_PADRAO],
    );
    if (rows) {
        const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const order = [1, 2, 3, 4, 5, 6, 0]; // Seg..Dom
        const map = new Map(rows.map((r) => [r.dow, r.minutos]));
        const data = order.map((dow) => ({
            day: labels[dow],
            hours: Math.round(((map.get(dow) || 0) / 60) * 10) / 10,
        }));
        if (data.some((d) => d.hours > 0)) return res.json({ source: 'db', data });
    }
    res.json({
        source: 'fallback',
        data: [
            { day: 'Seg', hours: 4 },
            { day: 'Ter', hours: 5 },
            { day: 'Qua', hours: 3 },
            { day: 'Qui', hours: 6 },
            { day: 'Sex', hours: 4 },
            { day: 'Sáb', hours: 2 },
            { day: 'Dom', hours: 1 },
        ],
    });
});

// --------------------------------------------------------------
// GET /api/dashboard/badges
// --------------------------------------------------------------
apiRouter.get('/dashboard/badges', async (_req, res) => {
    const rows = await query(
        `SELECT c.nome AS name, COALESCE(c.icone_emoji, '🏆') AS icon
             FROM usuario_conquistas uc
             JOIN conquistas c ON c.id = uc.conquista_id
             JOIN usuarios u ON u.id = uc.usuario_id
             WHERE u.matricula_institucional = $1
             ORDER BY uc.data_conquista DESC NULLS LAST
             LIMIT 3`,
        [MATRICULA_PADRAO],
    );
    if (rows && rows.length > 0) {
        return res.json({ source: 'db', items: rows });
    }
    res.json({
        source: 'fallback',
        items: [
            { name: 'Primeira Semana', icon: '🎓' },
            { name: '5 Horas de Estudo', icon: '📚' },
            { name: 'Meta Cumprida', icon: '🎯' },
        ],
    });
});
