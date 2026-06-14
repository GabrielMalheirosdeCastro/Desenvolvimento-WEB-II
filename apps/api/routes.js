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
// Marca o usuario logado como mentor (Usuario.e_mentor = TRUE).
// Exige sessao valida (requireAuth) e escopa a operacao ao dono via
// req.usuario.sub, evitando IDOR. Body opcional ignorado por enquanto.
// --------------------------------------------------------------
apiRouter.post('/mentorias/cadastro-mentor', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const updated = await query(
        `UPDATE usuarios SET e_mentor = TRUE
             WHERE id = $1
             RETURNING id, nome, e_mentor`,
        [req.usuario.sub],
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
        nome: usuario.nome,
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
            nome: req.usuario.nome,
            matricula: req.usuario.matricula,
            email: req.usuario.email,
            tipo: req.usuario.tipo,
            eMentor: req.usuario.eMentor,
        },
    });
});

// ==============================================================
// METAS DO PLANO DE ESTUDOS (Bloco H — item H3)
// --------------------------------------------------------------
// CRUD real de metas, persistido na tabela `atividades_estudo`
// (ja existente em producao). Todas as rotas exigem sessao valida
// (requireAuth) e sao escopadas ao dono via usuario_id = req.usuario.sub,
// evitando IDOR. Queries 100% parametrizadas.
//
// Mapeamento UI <-> banco (atividades_estudo):
//   title     <-> nome
//   subject   <-> descricao
//   deadline  <-> data_agendada
//   completed <-> status ('done' | 'pending') + data_realizacao
// ==============================================================

const META_TITULO_MAX = 200;
const META_MATERIA_MAX = 100;

/** Converte uma linha de atividades_estudo no formato consumido pela UI. */
function mapMetaRow(row) {
    return {
        id: row.id,
        title: row.nome,
        subject: row.descricao || '',
        deadline: row.data_agendada ? new Date(row.data_agendada).toISOString() : null,
        completed: row.status === 'done',
    };
}

/**
 * Obtem o id do plano de estudos mais recente do usuario; cria um
 * "Plano padrao" idempotente caso ainda nao exista. Retorna o id ou null.
 */
async function obterOuCriarPlano(usuarioId) {
    const existentes = await query(
        `SELECT id FROM planos_estudo
             WHERE usuario_id = $1
             ORDER BY id DESC
             LIMIT 1`,
        [usuarioId],
    );
    if (existentes && existentes.length > 0) {
        return existentes[0].id;
    }
    const criado = await query(
        `INSERT INTO planos_estudo (usuario_id, titulo, descricao, status)
             VALUES ($1, $2, $3, 'ativo')
             RETURNING id`,
        [usuarioId, 'Meu Plano de Estudos', 'Plano criado automaticamente.'],
    );
    return criado && criado.length > 0 ? criado[0].id : null;
}

// --------------------------------------------------------------
// GET /api/metas — lista as metas do usuario logado.
// --------------------------------------------------------------
apiRouter.get('/metas', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const rows = await query(
        `SELECT id, nome, descricao, data_agendada, status
             FROM atividades_estudo
             WHERE usuario_id = $1
             ORDER BY (status = 'done'), data_agendada NULLS LAST, id DESC`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({ source: 'db', items: rows.map(mapMetaRow) });
});

// --------------------------------------------------------------
// POST /api/metas — cria uma nova meta.
// Body: { title: string, subject?: string, deadline?: string (ISO) }
// --------------------------------------------------------------
apiRouter.post('/metas', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const title = String(req.body?.title || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const deadlineRaw = req.body?.deadline ? String(req.body.deadline).trim() : '';

    if (!title || title.length > META_TITULO_MAX) {
        return res.status(400).json({ error: 'titulo_invalido' });
    }
    if (subject.length > META_MATERIA_MAX) {
        return res.status(400).json({ error: 'materia_invalida' });
    }
    let dataAgendada = null;
    if (deadlineRaw) {
        const d = new Date(deadlineRaw);
        if (Number.isNaN(d.getTime())) {
            return res.status(400).json({ error: 'data_invalida' });
        }
        dataAgendada = d.toISOString();
    }

    const planoId = await obterOuCriarPlano(req.usuario.sub);
    if (!planoId) {
        return res.status(500).json({ error: 'falha_plano' });
    }

    const inserted = await query(
        `INSERT INTO atividades_estudo
                (plano_estudo_id, usuario_id, nome, descricao, data_agendada, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING id, nome, descricao, data_agendada, status`,
        [planoId, req.usuario.sub, title, subject || null, dataAgendada],
    );
    if (!inserted || inserted.length === 0) {
        return res.status(500).json({ error: 'falha_persistencia' });
    }
    res.status(201).json({ source: 'db', meta: mapMetaRow(inserted[0]) });
});

// --------------------------------------------------------------
// PATCH /api/metas/:id — alterna conclusao da meta.
// Body: { completed: boolean }
// --------------------------------------------------------------
apiRouter.patch('/metas/:id', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    if (typeof req.body?.completed !== 'boolean') {
        return res.status(400).json({ error: 'completed_invalido' });
    }
    const completed = req.body.completed;
    const novoStatus = completed ? 'done' : 'pending';

    const updated = await query(
        `UPDATE atividades_estudo
             SET status = $1,
                 data_realizacao = CASE WHEN $2 THEN NOW() ELSE NULL END
             WHERE id = $3 AND usuario_id = $4
             RETURNING id, nome, descricao, data_agendada, status`,
        [novoStatus, completed, id, req.usuario.sub],
    );
    if (updated === null) {
        return res.status(500).json({ error: 'falha_atualizacao' });
    }
    if (updated.length === 0) {
        return res.status(404).json({ error: 'meta_nao_encontrada' });
    }
    res.json({ source: 'db', meta: mapMetaRow(updated[0]) });
});

// --------------------------------------------------------------
// DELETE /api/metas/:id — exclui a meta do usuario logado.
// --------------------------------------------------------------
apiRouter.delete('/metas/:id', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const deleted = await query(
        `DELETE FROM atividades_estudo
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
        [id, req.usuario.sub],
    );
    if (deleted === null) {
        return res.status(500).json({ error: 'falha_exclusao' });
    }
    if (deleted.length === 0) {
        return res.status(404).json({ error: 'meta_nao_encontrada' });
    }
    res.json({ source: 'db', removido: deleted[0].id });
});

// ==============================================================
// AVALIACAO DE BEM-ESTAR (Bloco B — item B1 / RF11)
// --------------------------------------------------------------
// Questionario periodico de autoavaliacao, persistido na tabela
// `questionarios_bem_estar` (ja existente em producao). As rotas
// exigem sessao valida (requireAuth) e sao escopadas ao dono via
// usuario_id = req.usuario.sub, evitando IDOR. Queries 100%
// parametrizadas. O campo `respostas` guarda um JSON com as escalas
// (humor, estresse, sono — de 1 a 5) e o `resultado` (classificacao
// do bem-estar) e calculado no servidor, como fonte unica de verdade.
//
// Mapeamento UI <-> banco (questionarios_bem_estar):
//   { humor, estresse, sono } <-> respostas (JSON em TEXT)
//   resultado                  <-> resultado ('positivo'|'atencao'|'critico')
//   observacoes                <-> observacoes
//   dataAplicacao              <-> data_aplicacao
// ==============================================================

const BEM_ESTAR_OBS_MAX = 500;
const BEM_ESTAR_ESCALAS = ['humor', 'estresse', 'sono'];

/** Le com seguranca o JSON da coluna `respostas`, devolvendo objeto vazio em falha. */
function parseRespostasBemEstar(bruto) {
    if (!bruto) return {};
    try {
        const obj = JSON.parse(bruto);
        return obj && typeof obj === 'object' ? obj : {};
    } catch {
        return {};
    }
}

/** Converte uma linha de questionarios_bem_estar no formato consumido pela UI. */
function mapBemEstarRow(row) {
    const respostas = parseRespostasBemEstar(row.respostas);
    return {
        id: row.id,
        humor: Number(respostas.humor) || null,
        estresse: Number(respostas.estresse) || null,
        sono: Number(respostas.sono) || null,
        resultado: row.resultado || null,
        observacoes: row.observacoes || '',
        dataAplicacao: row.data_aplicacao
            ? new Date(row.data_aplicacao).toISOString()
            : null,
    };
}

/**
 * Valida que um valor de escala e inteiro entre 1 e 5. Retorna o numero
 * normalizado ou null se invalido.
 */
function escalaValida(valor) {
    const n = Number(valor);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    return n;
}

/**
 * Classifica o bem-estar a partir das escalas. Humor e sono sao positivos
 * (quanto maior, melhor); estresse e invertido (quanto maior, pior).
 * Retorna 'positivo' | 'atencao' | 'critico'.
 */
function classificarBemEstar({ humor, estresse, sono }) {
    // Escore 1..5 onde 5 = melhor. Estresse e invertido (6 - valor).
    const escore = (humor + (6 - estresse) + sono) / 3;
    if (escore >= 4) return 'positivo';
    if (escore >= 2.5) return 'atencao';
    return 'critico';
}

// --------------------------------------------------------------
// GET /api/bem-estar — historico de avaliacoes do usuario logado.
// --------------------------------------------------------------
apiRouter.get('/bem-estar', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const rows = await query(
        `SELECT id, usuario_id, data_aplicacao, respostas, resultado, observacoes
             FROM questionarios_bem_estar
             WHERE usuario_id = $1
             ORDER BY data_aplicacao DESC NULLS LAST, id DESC`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({ source: 'db', items: rows.map(mapBemEstarRow) });
});

// --------------------------------------------------------------
// POST /api/bem-estar — registra uma nova avaliacao.
// Body: { humor: 1..5, estresse: 1..5, sono: 1..5, observacoes?: string }
// --------------------------------------------------------------
apiRouter.post('/bem-estar', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const escalas = {};
    for (const chave of BEM_ESTAR_ESCALAS) {
        const valor = escalaValida(req.body?.[chave]);
        if (valor === null) {
            return res.status(400).json({ error: 'escala_invalida', campo: chave });
        }
        escalas[chave] = valor;
    }

    const observacoes = String(req.body?.observacoes || '').trim();
    if (observacoes.length > BEM_ESTAR_OBS_MAX) {
        return res.status(400).json({ error: 'observacoes_invalidas' });
    }

    const resultado = classificarBemEstar(escalas);
    const respostasJson = JSON.stringify(escalas);

    const inserted = await query(
        `INSERT INTO questionarios_bem_estar
                (usuario_id, data_aplicacao, respostas, resultado, observacoes)
             VALUES ($1, NOW(), $2, $3, $4)
             RETURNING id, usuario_id, data_aplicacao, respostas, resultado, observacoes`,
        [req.usuario.sub, respostasJson, resultado, observacoes || null],
    );
    if (!inserted || inserted.length === 0) {
        return res.status(500).json({ error: 'falha_persistencia' });
    }
    res.status(201).json({ source: 'db', registro: mapBemEstarRow(inserted[0]) });
});

// ==============================================================
// PERFIL DO USUARIO (Bloco H — item H8 / RF05)
// --------------------------------------------------------------
// Leitura e edicao dos dados de identidade do usuario logado,
// persistidos na tabela `usuarios`. Exige sessao valida (requireAuth)
// e escopa tudo ao dono via id = req.usuario.sub (anti-IDOR). Campos
// academicos (periodo/CRA/curso) sao lidos por LEFT JOIN tolerante a
// nulos em `matriculas_academicas` -> `turmas` -> `cursos`.
//
// Campos editaveis: `nome` e `email_institucional`. Como o e-mail e a
// chave de login (presente no JWT), uma alteracao reemite o cookie de
// sessao na mesma requisicao para nao deslogar o usuario.
// ==============================================================

const PERFIL_NOME_MAX = 150;
const PERFIL_EMAIL_MAX = 150;

/** Converte uma linha de perfil (usuarios + joins) no formato da UI. */
function mapPerfilRow(row) {
    return {
        id: row.id,
        nome: row.nome,
        matricula: row.matricula_institucional,
        email: row.email_institucional,
        tipo: row.tipo_usuario,
        eMentor: row.e_mentor === true,
        dataNascimento: row.data_nascimento || null,
        curso: row.curso_nome || null,
        periodo: row.periodo_atual ?? null,
        cra: row.cra ?? null,
    };
}

/** Busca o perfil completo (identidade + dados academicos) do usuario. */
async function buscarPerfil(usuarioId) {
    const rows = await query(
        `SELECT u.id, u.matricula_institucional, u.email_institucional, u.nome,
                u.tipo_usuario, u.e_mentor, u.data_nascimento,
                m.periodo_atual, m.cra, c.nome AS curso_nome
             FROM usuarios u
             LEFT JOIN matriculas_academicas m ON m.usuario_id = u.id
             LEFT JOIN turmas t ON t.id = m.turma_id
             LEFT JOIN cursos c ON c.id = t.curso_id
             WHERE u.id = $1
             ORDER BY m.id DESC NULLS LAST
             LIMIT 1`,
        [usuarioId],
    );
    if (rows === null) return null;
    if (rows.length === 0) return undefined;
    return mapPerfilRow(rows[0]);
}

// --------------------------------------------------------------
// GET /api/usuario/perfil — perfil real do usuario logado.
// --------------------------------------------------------------
apiRouter.get('/usuario/perfil', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const perfil = await buscarPerfil(req.usuario.sub);
    if (perfil === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (perfil === undefined) {
        return res.status(404).json({ error: 'usuario_nao_encontrado' });
    }
    res.json({ source: 'db', perfil });
});

// --------------------------------------------------------------
// PATCH /api/usuario/perfil — atualiza nome e/ou e-mail do logado.
// Body: { nome?: string, email?: string }
// --------------------------------------------------------------
apiRouter.patch('/usuario/perfil', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }

    const temNome = req.body?.nome !== undefined;
    const temEmail = req.body?.email !== undefined;
    if (!temNome && !temEmail) {
        return res.status(400).json({ error: 'nada_para_atualizar' });
    }

    const nome = temNome ? String(req.body.nome).trim() : null;
    const email = temEmail ? String(req.body.email).trim().toLowerCase() : null;

    if (temNome && (nome.length < 2 || nome.length > PERFIL_NOME_MAX)) {
        return res.status(400).json({ error: 'nome_invalido' });
    }
    if (temEmail) {
        if (email.length > PERFIL_EMAIL_MAX || !EMAIL_FAESA_REGEX.test(email)) {
            return res.status(400).json({ error: 'email_invalido' });
        }
        // Pre-checa duplicidade: query() engole erros e retorna null, entao a
        // violacao de UNIQUE nao seria distinguivel de uma falha generica.
        const emUso = await query(
            `SELECT id FROM usuarios
                 WHERE LOWER(email_institucional) = $1 AND id <> $2
                 LIMIT 1`,
            [email, req.usuario.sub],
        );
        if (emUso === null) {
            return res.status(500).json({ error: 'falha_verificacao' });
        }
        if (emUso.length > 0) {
            return res.status(409).json({ error: 'email_em_uso' });
        }
    }

    // Monta o UPDATE dinamicamente apenas com os campos enviados.
    const sets = [];
    const params = [];
    if (temNome) {
        params.push(nome);
        sets.push(`nome = $${params.length}`);
    }
    if (temEmail) {
        params.push(email);
        sets.push(`email_institucional = $${params.length}`);
    }
    params.push(req.usuario.sub);

    const updated = await query(
        `UPDATE usuarios SET ${sets.join(', ')}
             WHERE id = $${params.length}
             RETURNING id, matricula_institucional, email_institucional, nome,
                       tipo_usuario, e_mentor`,
        params,
    );

    if (updated === null) {
        return res.status(500).json({ error: 'falha_atualizacao' });
    }
    if (updated.length === 0) {
        return res.status(404).json({ error: 'usuario_nao_encontrado' });
    }

    const u = updated[0];
    // Reemite o cookie de sessao para refletir nome/e-mail novos no JWT.
    const token = signToken({
        id: u.id,
        nome: u.nome,
        matricula: u.matricula_institucional,
        email: u.email_institucional,
        tipo: u.tipo_usuario,
        eMentor: u.e_mentor,
    });
    if (token) {
        res.cookie(COOKIE_NAME, token, cookieOptions());
    }

    const perfil = await buscarPerfil(u.id);
    res.json({ source: 'db', perfil: perfil || mapPerfilRow(u) });
});
