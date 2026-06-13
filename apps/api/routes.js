// ============================================================
// Roteador da API REST do Site de Acolhimento FAESA.
// ------------------------------------------------------------
// Endpoints minimos do prototipo:
//   GET  /api/me                          -> persona logada (sem auth real)
//   GET  /api/dashboard/upcoming          -> proximas atividades de estudo
//   GET  /api/dashboard/week              -> horas de estudo da semana corrente
//   GET  /api/dashboard/badges            -> conquistas recentes
//   GET  /api/eventos                     -> eventos institucionais (Sprint 8a / G4)
//   POST /api/lgpd/consentimento          -> aceite LGPD (Sprint 8b / G5)
//   GET  /api/mentorias?papel=mentor      -> lista mentores (Sprint 8c / GP-1)
//   POST /api/mentorias/cadastro-mentor   -> marca persona como mentor
//
// Todos os endpoints sao resilientes: se o pool Postgres nao
// estiver inicializado (DATABASE_URL ausente) ou a query falhar,
// devolvem fallback estatico marcado com `source: "fallback"`.
// ============================================================
import { Router } from 'express';
import { query, isConnected } from './db.js';
import {
    COOKIE_NAME,
    authDisponivel,
    cookieOptions,
    hashPassword,
    verifyPassword,
    signToken,
    requireAuth,
} from './auth.js';

export const apiRouter = Router();

// Regex de e-mail institucional FAESA (D2 do plano de autenticacao).
const EMAIL_FAESA_REGEX = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)*faesa\.br$/i;

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
// GET /api/dashboard/streak
// Retorna streak atual + recorde da Gamificacao do usuario logado.
// --------------------------------------------------------------
apiRouter.get('/dashboard/streak', async (_req, res) => {
    const rows = await query(
        `SELECT g.streak_atual AS atual,
                g.streak_recorde AS recorde,
                g.data_ultima_atividade AS ultima
             FROM gamificacao g
             JOIN usuarios u ON u.id = g.usuario_id
             WHERE u.matricula_institucional = $1
             LIMIT 1`,
        [MATRICULA_PADRAO],
    );
    if (rows && rows.length > 0) {
        return res.json({ source: 'db', ...rows[0] });
    }
    res.json({ source: 'fallback', atual: 12, recorde: 18, ultima: null });
});

// --------------------------------------------------------------
// GET /api/dashboard/badges
// --------------------------------------------------------------
apiRouter.get('/dashboard/badges', async (_req, res) => {
    const rows = await query(
        `SELECT c.titulo AS name, COALESCE(c.icone, '🏆') AS icon
             FROM usuarios_conquistas uc
             JOIN conquistas c ON c.id = uc.conquista_id
             JOIN usuarios u ON u.id = uc.usuario_id
             WHERE u.matricula_institucional = $1
             ORDER BY uc.conquistada_em DESC NULLS LAST
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

// --------------------------------------------------------------
// GET /api/eventos  (Sprint 8a — gap G4 / RF12)
// Lista eventos institucionais (palestras, oficinas, etc.).
// --------------------------------------------------------------
apiRouter.get('/eventos', async (_req, res) => {
    const rows = await query(
        `SELECT id, titulo, descricao, tipo, data_evento, local, vagas
             FROM eventos
             ORDER BY data_evento ASC NULLS LAST
             LIMIT 20`,
    );
    if (rows && rows.length > 0) {
        return res.json({
            source: 'db',
            items: rows.map((r) => ({
                id: r.id,
                titulo: r.titulo,
                descricao: r.descricao,
                tipo: r.tipo,
                data: r.data_evento,
                local: r.local,
                vagas: r.vagas,
            })),
        });
    }
    res.json({
        source: 'fallback',
        items: [
            {
                id: 1,
                titulo: 'Palestra: Saúde Mental no Ambiente Acadêmico',
                descricao: 'Roda de conversa com a equipe de psicologia da FAESA.',
                tipo: 'Palestra',
                data: '2026-05-20T19:00:00.000Z',
                local: 'Auditório Central — Campus Vitória',
                vagas: 80,
            },
            {
                id: 2,
                titulo: 'Oficina: Técnicas de Estudo para o Período Final',
                descricao: 'Workshop prático sobre Pomodoro, Cornell e mapas mentais.',
                tipo: 'Oficina',
                data: '2026-05-28T14:00:00.000Z',
                local: 'Sala B-204',
                vagas: 30,
            },
            {
                id: 3,
                titulo: 'Encontro de Mentoria — Calouros 2026/2',
                descricao: 'Apresentação do programa de mentoria entre alunos.',
                tipo: 'Encontro',
                data: '2026-06-05T18:30:00.000Z',
                local: 'Hall do Bloco A',
                vagas: 120,
            },
        ],
    });
});

// --------------------------------------------------------------
// POST /api/lgpd/consentimento  (Sprint 8b — gap G5 / RNF09)
// Persiste o aceite do termo LGPD para a persona logada.
// Body esperado: { finalidade: string, versaoTermo: string }
// --------------------------------------------------------------
apiRouter.post('/lgpd/consentimento', async (req, res) => {
    const finalidade = String(req.body?.finalidade || 'uso_geral').slice(0, 80);
    const versaoTermo = String(req.body?.versaoTermo || '1.0').slice(0, 16);
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().slice(0, 64);
    const ua = String(req.headers['user-agent'] || '').slice(0, 255);

    if (!isConnected()) {
        return res.json({
            source: 'fallback',
            persisted: false,
            consentiu: true,
            finalidade,
            versaoTermo,
            mensagem: 'Banco indisponível — aceite registrado apenas no cliente.',
        });
    }

    // Resolve usuario_id da persona padrão.
    const usuarioRows = await query(
        `SELECT id FROM usuarios WHERE matricula_institucional = $1 LIMIT 1`,
        [MATRICULA_PADRAO],
    );
    if (!usuarioRows || usuarioRows.length === 0) {
        return res.status(404).json({ source: 'db', error: 'usuario_nao_encontrado' });
    }
    const usuarioId = usuarioRows[0].id;

    const inserted = await query(
        `INSERT INTO consentimentos_lgpd
                 (usuario_id, finalidade, versao_termo, consentiu, ip_origem, user_agent, data_consentimento)
             VALUES ($1, $2, $3, TRUE, $4, $5, NOW())
             RETURNING id, data_consentimento`,
        [usuarioId, finalidade, versaoTermo, ip, ua],
    );
    if (!inserted || inserted.length === 0) {
        return res.status(500).json({ source: 'db', error: 'falha_persistencia' });
    }
    res.json({
        source: 'db',
        persisted: true,
        consentiu: true,
        id: inserted[0].id,
        finalidade,
        versaoTermo,
        registradoEm: inserted[0].data_consentimento,
    });
});

// --------------------------------------------------------------
// GET /api/mentorias?papel=mentor  (Sprint 8c — gap GP-1 / US04)
// Lista usuarios marcados como mentores. Default papel=mentor.
// --------------------------------------------------------------
apiRouter.get('/mentorias', async (req, res) => {
    const papel = String(req.query?.papel || 'mentor');

    if (papel === 'mentor') {
        const rows = await query(
            `SELECT id, nome, email_institucional, matricula_institucional, tipo_usuario, e_mentor
                 FROM usuarios
                 WHERE e_mentor = TRUE
                 ORDER BY nome ASC
                 LIMIT 20`,
        );
        if (rows && rows.length > 0) {
            return res.json({
                source: 'db',
                papel: 'mentor',
                items: rows.map((r) => ({
                    id: r.id,
                    nome: r.nome,
                    email: r.email_institucional,
                    matricula: r.matricula_institucional,
                    tipo: r.tipo_usuario,
                })),
            });
        }
    }

    res.json({
        source: 'fallback',
        papel,
        items: [
            { id: 1, nome: 'Ana Silva', curso: 'ADS', periodo: '7º', cra: 8.5, especialidades: ['Programação', 'Estrutura de Dados'] },
            { id: 2, nome: 'Carlos Santos', curso: 'Engenharia de Software', periodo: '6º', cra: 8.2, especialidades: ['Banco de Dados', 'DevOps'] },
            { id: 3, nome: 'Mariana Costa', curso: 'Ciência da Computação', periodo: '8º', cra: 9.0, especialidades: ['Algoritmos', 'IA'] },
        ],
    });
});

// --------------------------------------------------------------
// POST /api/mentorias/cadastro-mentor  (Sprint 8c — gap GP-1)
// Marca a persona logada como mentor (Usuario.e_mentor = TRUE).
// Body opcional: { especialidades?: string[] } (ignorado por enquanto).
// --------------------------------------------------------------
apiRouter.post('/mentorias/cadastro-mentor', async (_req, res) => {
    if (!isConnected()) {
        return res.json({
            source: 'fallback',
            persisted: false,
            eMentor: true,
            mensagem: 'Banco indisponível — cadastro registrado apenas no cliente.',
        });
    }
    const updated = await query(
        `UPDATE usuarios SET e_mentor = TRUE
             WHERE matricula_institucional = $1
             RETURNING id, nome, e_mentor`,
        [MATRICULA_PADRAO],
    );
    if (!updated || updated.length === 0) {
        return res.status(404).json({ source: 'db', error: 'usuario_nao_encontrado' });
    }
    res.json({
        source: 'db',
        persisted: true,
        eMentor: updated[0].e_mentor,
        usuario: { id: updated[0].id, nome: updated[0].nome },
    });
});

// ==============================================================
// AUTENTICACAO LOCAL (Bloco A — plano 2026-06-13)
// --------------------------------------------------------------
// Rotas ADITIVAS. Nao alteram o comportamento das rotas acima
// (que continuam usando MATRICULA_PADRAO). A virada para sessao
// real ocorrera em fase posterior, junto ao frontend.
//
// Pre-condicao: usuario ja pre-cadastrado em `usuarios` (matricula
// + email institucional). A ativacao define a senha (password_hash).
// ==============================================================

const SENHA_MIN = 8;
const SENHA_MAX = 72; // limite efetivo do bcrypt (72 bytes)

/** Normaliza e valida o corpo de email/senha. Retorna { erro } ou { email, senha }. */
function validarCredenciais(body) {
    const email = String(body?.email || '').trim().toLowerCase();
    const senha = String(body?.senha || '');
    if (!email || !senha) return { erro: 'campos_obrigatorios' };
    if (!EMAIL_FAESA_REGEX.test(email)) return { erro: 'email_invalido' };
    if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) return { erro: 'senha_invalida' };
    return { email, senha };
}

// --------------------------------------------------------------
// POST /api/auth/ativar
// Define a senha de um usuario pre-cadastrado cujo password_hash e NULL.
// Body: { matricula: string, email: string, senha: string }
// --------------------------------------------------------------
apiRouter.post('/auth/ativar', async (req, res) => {
    if (!authDisponivel()) {
        return res.status(503).json({ error: 'auth_indisponivel' });
    }
    const matricula = String(req.body?.matricula || '').trim();
    const cred = validarCredenciais(req.body);
    if (cred.erro) {
        return res.status(400).json({ error: cred.erro });
    }
    if (!matricula) {
        return res.status(400).json({ error: 'campos_obrigatorios' });
    }
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }

    const rows = await query(
        `SELECT id, matricula_institucional, email_institucional, password_hash
             FROM usuarios
             WHERE matricula_institucional = $1 AND LOWER(email_institucional) = $2
             LIMIT 1`,
        [matricula, cred.email],
    );
    if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'cadastro_nao_encontrado' });
    }
    if (rows[0].password_hash) {
        return res.status(409).json({ error: 'conta_ja_ativada' });
    }

    const hash = await hashPassword(cred.senha);
    const updated = await query(
        `UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id`,
        [hash, rows[0].id],
    );
    if (!updated || updated.length === 0) {
        return res.status(500).json({ error: 'falha_ativacao' });
    }
    res.status(201).json({ ativado: true });
});

// --------------------------------------------------------------
// POST /api/auth/login
// Body: { email: string, senha: string }
// Em sucesso emite cookie httpOnly com o JWT de sessao.
// --------------------------------------------------------------
apiRouter.post('/auth/login', async (req, res) => {
    if (!authDisponivel()) {
        return res.status(503).json({ error: 'auth_indisponivel' });
    }
    const cred = validarCredenciais(req.body);
    if (cred.erro) {
        return res.status(400).json({ error: cred.erro });
    }
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }

    const rows = await query(
        `SELECT id, matricula_institucional, email_institucional, nome,
                tipo_usuario, e_mentor, password_hash
             FROM usuarios
             WHERE LOWER(email_institucional) = $1
             LIMIT 1`,
        [cred.email],
    );
    // Resposta uniforme para nao revelar se o e-mail existe.
    const usuario = rows && rows.length > 0 ? rows[0] : null;
    const ok = usuario && (await verifyPassword(cred.senha, usuario.password_hash));
    if (!ok) {
        return res.status(401).json({ error: 'credenciais_invalidas' });
    }

    const token = signToken({
        id: usuario.id,
        matricula: usuario.matricula_institucional,
        email: usuario.email_institucional,
        tipo: usuario.tipo_usuario,
        eMentor: usuario.e_mentor,
    });
    if (!token) {
        return res.status(503).json({ error: 'auth_indisponivel' });
    }
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({
        autenticado: true,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email_institucional,
            matricula: usuario.matricula_institucional,
            tipo: usuario.tipo_usuario,
            eMentor: usuario.e_mentor,
        },
    });
});

// --------------------------------------------------------------
// POST /api/auth/logout — limpa o cookie de sessao.
// --------------------------------------------------------------
apiRouter.post('/auth/logout', (_req, res) => {
    const opts = cookieOptions();
    delete opts.maxAge;
    res.clearCookie(COOKIE_NAME, opts);
    res.json({ ok: true });
});

// --------------------------------------------------------------
// GET /api/auth/me — retorna o usuario da sessao atual (requer cookie).
// --------------------------------------------------------------
apiRouter.get('/auth/me', requireAuth, (req, res) => {
    res.json({
        usuario: {
            id: req.usuario.sub,
            matricula: req.usuario.matricula,
            email: req.usuario.email,
            tipo: req.usuario.tipo,
            eMentor: req.usuario.eMentor,
        },
    });
});
