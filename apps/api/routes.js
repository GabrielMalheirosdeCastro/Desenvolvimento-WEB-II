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
    requireRole,
} from './auth.js';
import { gerarResposta, derivarFaixa, faixaValida, FAIXA_PADRAO, detectarCrise, RESPOSTA_CRISE } from './chatbot.js';

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

// --------------------------------------------------------------
// DELETE /api/mentorias/cadastro-mentor
// Remove o papel de mentor do usuario logado (Usuario.e_mentor = FALSE).
// Exige sessao valida (requireAuth) e escopa ao dono via req.usuario.sub
// (anti-IDOR). Operacao idempotente e NAO destrutiva: nao apaga sessoes
// nem solicitacoes ja registradas, apenas retira o perfil da busca.
// --------------------------------------------------------------
apiRouter.delete('/mentorias/cadastro-mentor', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const updated = await query(
        `UPDATE usuarios SET e_mentor = FALSE
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

// --------------------------------------------------------------
// SOLICITACAO DE MENTORIA (Sprint 8c — GP-1 / US04)
// Persiste o pedido do aluno (mentorado) a um mentor na tabela
// `mentorias` com status 'solicitada'. Escrita sempre escopada a
// mentorado_id = req.usuario.sub (anti-IDOR): o aluno so cria/cancela
// solicitacoes em que ele proprio e o mentorado. Idempotente.
// --------------------------------------------------------------

// GET /api/mentorias/minhas — mentores que o usuario ja solicitou.
apiRouter.get('/mentorias/minhas', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', items: [] });
    }
    const rows = await query(
        `SELECT mentor_id, status, data_inicio
             FROM mentorias
             WHERE mentorado_id = $1 AND status = 'solicitada'
             ORDER BY data_inicio DESC NULLS LAST`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({
        source: 'db',
        items: rows.map((r) => ({
            mentorId: r.mentor_id,
            status: r.status,
            dataInicio: r.data_inicio,
        })),
    });
});

// POST /api/mentorias/:mentorId/solicitar — solicita mentoria a um mentor.
apiRouter.post('/mentorias/:mentorId/solicitar', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const mentorId = Number.parseInt(req.params.mentorId, 10);
    if (Number.isNaN(mentorId) || mentorId <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    if (mentorId === Number(req.usuario.sub)) {
        return res.status(400).json({ error: 'mentor_igual_solicitante' });
    }

    const mentor = await query(
        `SELECT id FROM usuarios WHERE id = $1 AND e_mentor = TRUE LIMIT 1`,
        [mentorId],
    );
    if (mentor === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (mentor.length === 0) {
        return res.status(404).json({ error: 'mentor_nao_encontrado' });
    }

    // Idempotente: nao duplica solicitacao ativa do mesmo par mentor/mentorado.
    const existe = await query(
        `SELECT id FROM mentorias
             WHERE mentor_id = $1 AND mentorado_id = $2 AND status = 'solicitada'
             LIMIT 1`,
        [mentorId, req.usuario.sub],
    );
    if (existe === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (existe.length === 0) {
        const inserted = await query(
            `INSERT INTO mentorias (mentor_id, mentorado_id, status, data_inicio)
                 VALUES ($1, $2, 'solicitada', NOW())
                 RETURNING id`,
            [mentorId, req.usuario.sub],
        );
        if (inserted === null) {
            return res.status(500).json({ error: 'falha_solicitacao' });
        }
    }
    res.status(201).json({ source: 'db', mentorId, solicitado: true });
});

// DELETE /api/mentorias/:mentorId/solicitar — cancela a solicitacao.
apiRouter.delete('/mentorias/:mentorId/solicitar', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const mentorId = Number.parseInt(req.params.mentorId, 10);
    if (Number.isNaN(mentorId) || mentorId <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const removed = await query(
        `DELETE FROM mentorias
             WHERE mentor_id = $1 AND mentorado_id = $2 AND status = 'solicitada'
             RETURNING id`,
        [mentorId, req.usuario.sub],
    );
    if (removed === null) {
        return res.status(500).json({ error: 'falha_cancelamento' });
    }
    // removed.length === 0 => nao havia solicitacao (idempotente): sucesso.
    res.json({ source: 'db', mentorId, solicitado: false });
});

// --------------------------------------------------------------
// SESSOES DE MENTORIA AGENDADAS (RF12 — mentoria)
// Persiste sessoes agendadas pelo aluno na tabela `mentorias` com
// status 'agendada'. Reaproveita a tabela existente: mentorado_id =
// req.usuario.sub (anti-IDOR), mentor_id = mentor escolhido,
// objetivo = tema da sessao, data_inicio = data/hora marcada.
// --------------------------------------------------------------

// GET /api/mentorias/sessoes — sessoes agendadas do usuario logado.
apiRouter.get('/mentorias/sessoes', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', items: [] });
    }
    const rows = await query(
        `SELECT m.id, m.mentor_id, m.objetivo, m.data_inicio, u.nome AS mentor_nome,
                u.tipo_usuario AS mentor_tipo
             FROM mentorias m
             JOIN usuarios u ON u.id = m.mentor_id
             WHERE m.mentorado_id = $1 AND m.status = 'agendada'
             ORDER BY m.data_inicio ASC NULLS LAST`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({
        source: 'db',
        items: rows.map((r) => ({
            id: r.id,
            mentorId: r.mentor_id,
            mentorNome: r.mentor_nome,
            mentorTipo: r.mentor_tipo,
            tema: r.objetivo,
            dataInicio: r.data_inicio,
        })),
    });
});

// POST /api/mentorias/sessoes — agenda uma nova sessao.
apiRouter.post('/mentorias/sessoes', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const mentorId = Number.parseInt(req.body?.mentorId, 10);
    if (Number.isNaN(mentorId) || mentorId <= 0) {
        return res.status(400).json({ error: 'mentor_invalido' });
    }
    if (mentorId === Number(req.usuario.sub)) {
        return res.status(400).json({ error: 'mentor_igual_solicitante' });
    }
    const tema = typeof req.body?.tema === 'string' ? req.body.tema.trim() : '';
    if (tema.length === 0 || tema.length > 200) {
        return res.status(400).json({ error: 'tema_invalido' });
    }
    const dataInicio = new Date(req.body?.dataInicio);
    if (Number.isNaN(dataInicio.getTime())) {
        return res.status(400).json({ error: 'data_invalida' });
    }

    const mentor = await query(
        `SELECT id FROM usuarios WHERE id = $1 AND e_mentor = TRUE LIMIT 1`,
        [mentorId],
    );
    if (mentor === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (mentor.length === 0) {
        return res.status(404).json({ error: 'mentor_nao_encontrado' });
    }

    const inserted = await query(
        `INSERT INTO mentorias (mentor_id, mentorado_id, status, data_inicio, objetivo)
             VALUES ($1, $2, 'agendada', $3, $4)
             RETURNING id, data_inicio`,
        [mentorId, req.usuario.sub, dataInicio.toISOString(), tema],
    );
    if (inserted === null || inserted.length === 0) {
        return res.status(500).json({ error: 'falha_agendamento' });
    }
    res.status(201).json({
        source: 'db',
        id: inserted[0].id,
        mentorId,
        tema,
        dataInicio: inserted[0].data_inicio,
    });
});

// DELETE /api/mentorias/sessoes/:id — cancela uma sessao agendada.
apiRouter.delete('/mentorias/sessoes/:id', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const sessaoId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(sessaoId) || sessaoId <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const removed = await query(
        `DELETE FROM mentorias
             WHERE id = $1 AND mentorado_id = $2 AND status = 'agendada'
             RETURNING id`,
        [sessaoId, req.usuario.sub],
    );
    if (removed === null) {
        return res.status(500).json({ error: 'falha_cancelamento' });
    }
    // removed.length === 0 => nada a remover (idempotente): sucesso.
    res.json({ source: 'db', id: sessaoId, cancelada: true });
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

// ============================================================
// Forum de Discussao (item H6 / RF08) e Biblioteca (item H7 / RF06-07)
// ------------------------------------------------------------
// Leitura publica (espelha /api/eventos): GET /api/forum, /api/recursos,
// /api/trilhas devolvem `source: "db"` quando ha linhas, ou fallback
// estatico. Escrita exige sessao (requireAuth) e e escopada ao usuario
// logado via req.usuario.sub (anti-IDOR). Rotas ADITIVAS no fim do arquivo.
// ============================================================

// Limites de validacao de entrada do forum.
const FORUM_TITULO_MAX = 160;
const FORUM_DESCRICAO_MAX = 2000;
const FORUM_CATEGORIA_MAX = 40;

// --------------------------------------------------------------
// GET /api/forum — lista topicos de discussao (publico).
// --------------------------------------------------------------
apiRouter.get('/forum', async (_req, res) => {
    const rows = await query(
        `SELECT f.id, f.titulo, f.descricao, f.categoria, f.created_at,
                u.nome AS autor_nome,
                COALESCE(p.total, 0) AS respostas
             FROM foruns_discussao f
             LEFT JOIN usuarios u ON u.id = f.criado_por
             LEFT JOIN (
                 SELECT forum_id, COUNT(*) AS total
                     FROM forum_posts GROUP BY forum_id
             ) p ON p.forum_id = f.id
             ORDER BY f.created_at DESC
             LIMIT 50`,
    );
    if (rows && rows.length > 0) {
        return res.json({
            source: 'db',
            items: rows.map((r) => ({
                id: r.id,
                titulo: r.titulo,
                descricao: r.descricao,
                categoria: r.categoria,
                autor: r.autor_nome,
                respostas: Number(r.respostas) || 0,
                createdAt: r.created_at,
            })),
        });
    }
    res.json({
        source: 'fallback',
        items: [
            {
                id: 1,
                titulo: 'Dicas para a primeira semana de aula',
                descricao: 'Compartilhe o que ajudou voce a se adaptar no inicio do curso.',
                categoria: 'Dicas',
                autor: 'Equipe NAP',
                respostas: 0,
                createdAt: null,
            },
            {
                id: 2,
                titulo: 'Como organizar tempo entre trabalho e estudos?',
                descricao: 'Estrategias de organizacao para quem concilia emprego e faculdade.',
                categoria: 'Discussao',
                autor: 'Equipe NAP',
                respostas: 0,
                createdAt: null,
            },
        ],
    });
});

// --------------------------------------------------------------
// POST /api/forum — cria um novo topico (requer sessao).
// Body: { titulo: string, descricao?: string, categoria?: string }
// --------------------------------------------------------------
apiRouter.post('/forum', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }

    const titulo = req.body?.titulo !== undefined ? String(req.body.titulo).trim() : '';
    const descricao =
        req.body?.descricao !== undefined ? String(req.body.descricao).trim() : null;
    const categoria =
        req.body?.categoria !== undefined ? String(req.body.categoria).trim() : null;

    if (titulo.length < 3 || titulo.length > FORUM_TITULO_MAX) {
        return res.status(400).json({ error: 'titulo_invalido' });
    }
    if (descricao !== null && descricao.length > FORUM_DESCRICAO_MAX) {
        return res.status(400).json({ error: 'descricao_invalida' });
    }
    if (categoria !== null && categoria.length > FORUM_CATEGORIA_MAX) {
        return res.status(400).json({ error: 'categoria_invalida' });
    }

    const inserted = await query(
        `INSERT INTO foruns_discussao (criado_por, titulo, descricao, categoria)
             VALUES ($1, $2, $3, $4)
             RETURNING id, titulo, descricao, categoria, created_at`,
        [req.usuario.sub, titulo, descricao, categoria],
    );

    if (inserted === null) {
        return res.status(500).json({ error: 'falha_criacao' });
    }
    const t = inserted[0];
    res.status(201).json({
        source: 'db',
        topico: {
            id: t.id,
            titulo: t.titulo,
            descricao: t.descricao,
            categoria: t.categoria,
            autor: req.usuario.nome,
            respostas: 0,
            createdAt: t.created_at,
        },
    });
});

// --------------------------------------------------------------
// GET /api/recursos — lista recursos da biblioteca (publico).
// --------------------------------------------------------------
apiRouter.get('/recursos', async (_req, res) => {
    const rows = await query(
        `SELECT id, titulo, descricao, tipo, url, categoria, visualizacoes
             FROM recursos
             ORDER BY id ASC
             LIMIT 60`,
    );
    if (rows && rows.length > 0) {
        return res.json({
            source: 'db',
            items: rows.map((r) => ({
                id: r.id,
                titulo: r.titulo,
                descricao: r.descricao,
                tipo: r.tipo,
                url: r.url,
                categoria: r.categoria,
                visualizacoes: Number(r.visualizacoes) || 0,
            })),
        });
    }
    res.json({
        source: 'fallback',
        items: [
            {
                id: 1,
                titulo: 'Tecnicas de Estudo Eficazes',
                descricao: 'Guia introdutorio sobre metodos de estudo.',
                tipo: 'Artigo',
                url: null,
                categoria: 'Metodologia',
                visualizacoes: 0,
            },
            {
                id: 2,
                titulo: 'Como Fazer Anotacoes Cornell',
                descricao: 'Video explicando o metodo Cornell de anotacoes.',
                tipo: 'Video',
                url: null,
                categoria: 'Tecnicas',
                visualizacoes: 0,
            },
        ],
    });
});

// --------------------------------------------------------------
// GET /api/trilhas — lista trilhas de aprendizagem (publico).
// --------------------------------------------------------------
apiRouter.get('/trilhas', async (_req, res) => {
    const rows = await query(
        `SELECT t.id, t.nome, t.descricao, t.publico_alvo,
                COALESCE(c.total, 0) AS total_recursos
             FROM trilhas_aprendizagem t
             LEFT JOIN (
                 SELECT trilha_id, COUNT(*) AS total
                     FROM trilha_recursos GROUP BY trilha_id
             ) c ON c.trilha_id = t.id
             ORDER BY t.id ASC
             LIMIT 30`,
    );
    if (rows && rows.length > 0) {
        return res.json({
            source: 'db',
            items: rows.map((r) => ({
                id: r.id,
                nome: r.nome,
                descricao: r.descricao,
                publicoAlvo: r.publico_alvo,
                totalRecursos: Number(r.total_recursos) || 0,
            })),
        });
    }
    res.json({
        source: 'fallback',
        items: [
            {
                id: 1,
                nome: 'Fundamentos de ADS',
                descricao: 'Trilha introdutoria para ingressantes de ADS.',
                publicoAlvo: 'Ingressantes',
                totalRecursos: 0,
            },
        ],
    });
});

// --------------------------------------------------------------
// POST /api/recursos/:id/acesso — registra acesso do usuario logado
// a um recurso (UPSERT em usuario_recursos) e incrementa visualizacoes.
// --------------------------------------------------------------
apiRouter.post('/recursos/:id/acesso', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }

    const recursoId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(recursoId) || recursoId <= 0) {
        return res.status(400).json({ error: 'recurso_invalido' });
    }

    // Confirma a existencia do recurso antes de registrar o acesso.
    const existe = await query(`SELECT id, url FROM recursos WHERE id = $1 LIMIT 1`, [
        recursoId,
    ]);
    if (existe === null) {
        return res.status(500).json({ error: 'falha_verificacao' });
    }
    if (existe.length === 0) {
        return res.status(404).json({ error: 'recurso_nao_encontrado' });
    }

    const registro = await query(
        `INSERT INTO usuario_recursos (usuario_id, recurso_id, data_acesso, favorito)
             VALUES ($1, $2, NOW(), FALSE)
             ON CONFLICT (usuario_id, recurso_id)
             DO UPDATE SET data_acesso = NOW()
             RETURNING id`,
        [req.usuario.sub, recursoId],
    );
    if (registro === null) {
        return res.status(500).json({ error: 'falha_registro' });
    }

    // Incremento de visualizacoes e best-effort; nao bloqueia a resposta.
    await query(
        `UPDATE recursos SET visualizacoes = COALESCE(visualizacoes, 0) + 1
             WHERE id = $1`,
        [recursoId],
    );

    res.json({ source: 'db', ok: true, url: existe[0].url ?? null });
});

// ==============================================================
// PAINEL DE COORDENACAO (RF14 / Bloco A — item A4 RBAC)
// --------------------------------------------------------------
// GET /api/coordenacao/overview — agregacoes institucionais para o
// painel de coordenacao. Protegido por requireAuth + requireRole:
// SOMENTE usuarios com tipo_usuario = COORDENADOR acessam (403 para
// ALUNO/MENTOR). A autorizacao e imposta no backend (fronteira real,
// OWASP A01); o menu condicional no frontend e apenas UX. Os dados
// sao agregados (sem PII), portanto nao ha escopo por usuario/IDOR.
// --------------------------------------------------------------
apiRouter.get(
    '/coordenacao/overview',
    requireAuth,
    requireRole('COORDENADOR'),
    async (_req, res) => {
        if (!isConnected()) {
            return res.status(503).json({ error: 'db_indisponivel' });
        }

        const rows = await query(
            `SELECT
                 (SELECT COUNT(*) FROM usuarios
                      WHERE UPPER(tipo_usuario) = 'ALUNO')          AS total_alunos,
                 (SELECT COUNT(*) FROM usuarios
                      WHERE e_mentor = TRUE)                        AS total_mentores,
                 (SELECT COUNT(*) FROM planos_estudo)               AS total_planos,
                 (SELECT COUNT(*) FROM atividades_estudo)           AS total_atividades,
                 (SELECT COUNT(*) FROM questionarios_bem_estar)     AS total_bem_estar,
                 (SELECT COUNT(*) FROM foruns_discussao)            AS total_topicos_forum,
                 (SELECT COUNT(*) FROM recursos)                    AS total_recursos`,
        );

        if (rows && rows.length > 0) {
            const r = rows[0];
            return res.json({
                source: 'db',
                metricas: {
                    totalAlunos: Number(r.total_alunos) || 0,
                    totalMentores: Number(r.total_mentores) || 0,
                    totalPlanos: Number(r.total_planos) || 0,
                    totalAtividades: Number(r.total_atividades) || 0,
                    totalBemEstar: Number(r.total_bem_estar) || 0,
                    totalTopicosForum: Number(r.total_topicos_forum) || 0,
                    totalRecursos: Number(r.total_recursos) || 0,
                },
            });
        }

        // Banco conectado mas sem leitura util: devolve zeros sinalizados.
        res.json({
            source: 'fallback',
            metricas: {
                totalAlunos: 0,
                totalMentores: 0,
                totalPlanos: 0,
                totalAtividades: 0,
                totalBemEstar: 0,
                totalTopicosForum: 0,
                totalRecursos: 0,
            },
        });
    },
);

// ==============================================================
// CHATBOT DE ACOLHIMENTO (RF16 / Bloco B - B2)
// --------------------------------------------------------------
// Motor de respostas CURADO LOCAL (apps/api/chatbot.js): sem LLM
// externa, respeitando "tudo na VPS" e a LGPD (nenhuma PII sai da
// infraestrutura propria). As respostas sao adaptadas por faixa
// etaria (17-20 | 21-25 | 26+) e ha rede de seguranca para crise.
//
// A resposta e SEMPRE computada no Node (resiliente a banco off).
// A persistencia em chatbot_conversas/chatbot_mensagens e best-effort
// e escopada ao dono (anti-IDOR): um conversaId informado pelo cliente
// so e reutilizado se pertencer ao usuario logado.
// --------------------------------------------------------------

const CHATBOT_MSG_MAX = 2000;

/** Converte uma linha de chatbot_mensagens no formato consumido pela UI. */
function mapChatbotMensagem(row) {
    return {
        id: row.id,
        conversaId: row.conversa_id,
        origem: row.origem,
        conteudo: row.conteudo,
        intencao: row.intencao || null,
        sentimento: row.sentimento || null,
        dataEnvio: row.data_envio || null,
    };
}

/**
 * Resolve a faixa etaria a usar: preferencia do corpo (se valida), senao
 * deriva da data_nascimento do usuario, senao cai no padrao.
 */
async function resolverFaixa(usuarioId, faixaInformada) {
    if (faixaValida(faixaInformada)) return faixaInformada;
    if (isConnected()) {
        const rows = await query(`SELECT data_nascimento FROM usuarios WHERE id = $1 LIMIT 1`, [
            usuarioId,
        ]);
        if (rows && rows.length > 0) {
            const derivada = derivarFaixa(rows[0].data_nascimento);
            if (derivada) return derivada;
        }
    }
    return FAIXA_PADRAO;
}

/**
 * Garante uma conversa para o usuario: valida posse de conversaId quando
 * informado; caso contrario cria uma nova. Retorna o id ou null em falha.
 */
async function garantirConversa(usuarioId, conversaId, faixa) {
    if (Number.isInteger(conversaId) && conversaId > 0) {
        const dono = await query(
            `SELECT id FROM chatbot_conversas WHERE id = $1 AND usuario_id = $2 LIMIT 1`,
            [conversaId, usuarioId],
        );
        if (dono && dono.length > 0) return conversaId;
        // conversaId invalido ou de outro usuario: ignora e cria uma nova.
    }
    const criada = await query(
        `INSERT INTO chatbot_conversas (usuario_id, faixa_etaria, canal, status, iniciou_em)
             VALUES ($1, $2, 'web', 'aberta', NOW())
             RETURNING id`,
        [usuarioId, faixa],
    );
    if (criada && criada.length > 0) return criada[0].id;
    return null;
}

// --------------------------------------------------------------
// POST /api/chatbot/mensagem — envia uma mensagem e recebe a resposta.
// Body: { mensagem: string, faixaEtaria?: '17-20'|'21-25'|'26+', conversaId?: number }
// --------------------------------------------------------------
apiRouter.post('/chatbot/mensagem', requireAuth, async (req, res) => {
    const mensagem = String(req.body?.mensagem || '').trim();
    if (!mensagem) {
        return res.status(400).json({ error: 'mensagem_vazia' });
    }
    if (mensagem.length > CHATBOT_MSG_MAX) {
        return res.status(400).json({ error: 'mensagem_muito_longa' });
    }

    const usuarioId = req.usuario.sub;
    const faixa = await resolverFaixa(usuarioId, req.body?.faixaEtaria);
    const resposta = gerarResposta(mensagem, faixa);

    // Persistencia best-effort: nunca bloqueia a resposta ao usuario.
    let conversaId = null;
    let persistido = false;
    if (isConnected()) {
        const idEntrada = Number.parseInt(req.body?.conversaId, 10);
        conversaId = await garantirConversa(
            usuarioId,
            Number.isNaN(idEntrada) ? null : idEntrada,
            faixa,
        );
        if (conversaId) {
            const ins = await query(
                `INSERT INTO chatbot_mensagens
                        (conversa_id, usuario_id, origem, conteudo, intencao, sentimento, data_envio)
                     VALUES ($1, $2, 'usuario', $3, $4, $5, NOW()),
                            ($1, NULL, 'bot', $6, $7, $8, NOW())`,
                [
                    conversaId,
                    usuarioId,
                    mensagem,
                    resposta.intencao,
                    resposta.sentimento,
                    resposta.conteudo,
                    resposta.intencao,
                    resposta.sentimento,
                ],
            );
            persistido = ins !== null;
        }
    }

    res.json({
        source: persistido ? 'db' : 'fallback',
        conversaId,
        faixaEtaria: faixa,
        crise: resposta.crise === true,
        resposta: {
            origem: 'bot',
            conteudo: resposta.conteudo,
            intencao: resposta.intencao,
            sentimento: resposta.sentimento,
        },
    });
});

// --------------------------------------------------------------
// GET /api/chatbot/historico — mensagens da conversa mais recente do
// usuario logado (escopado ao dono via JOIN com chatbot_conversas).
// --------------------------------------------------------------
apiRouter.get('/chatbot/historico', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', conversaId: null, mensagens: [] });
    }
    const usuarioId = req.usuario.sub;

    const conversa = await query(
        `SELECT id FROM chatbot_conversas
             WHERE usuario_id = $1
             ORDER BY iniciou_em DESC NULLS LAST, id DESC
             LIMIT 1`,
        [usuarioId],
    );
    if (!conversa || conversa.length === 0) {
        return res.json({ source: 'db', conversaId: null, mensagens: [] });
    }
    const conversaId = conversa[0].id;

    const rows = await query(
        `SELECT id, conversa_id, origem, conteudo, intencao, sentimento, data_envio
             FROM chatbot_mensagens
             WHERE conversa_id = $1
             ORDER BY id ASC
             LIMIT 200`,
        [conversaId],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({ source: 'db', conversaId, mensagens: rows.map(mapChatbotMensagem) });
});

// ==============================================================
// NOTIFICACOES (RF10 / Bloco B - B5)
// --------------------------------------------------------------
// Backend real do "sininho": ate aqui era mock estatico no frontend.
// Leitura e escrita exigem sessao (requireAuth) e sao escopadas ao
// usuario logado via req.usuario.sub (anti-IDOR). Resiliente a banco
// indisponivel: GET cai em fallback estatico; mutacoes retornam 503.
// --------------------------------------------------------------

/** Converte uma linha de `notificacoes` no formato consumido pela UI. */
function mapNotificacao(row) {
    return {
        id: row.id,
        titulo: row.titulo,
        mensagem: row.mensagem,
        tipo: row.tipo || 'info',
        lida: row.lida === true,
        dataCriacao: row.data_criacao || null,
    };
}

// --------------------------------------------------------------
// GET /api/notificacoes — lista as notificacoes do usuario logado.
// --------------------------------------------------------------
apiRouter.get('/notificacoes', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', items: [], naoLidas: 0 });
    }
    const rows = await query(
        `SELECT id, titulo, mensagem, tipo, lida, data_criacao
             FROM notificacoes
             WHERE usuario_id = $1
             ORDER BY data_criacao DESC NULLS LAST, id DESC
             LIMIT 50`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    const items = rows.map(mapNotificacao);
    res.json({
        source: 'db',
        items,
        naoLidas: items.filter((n) => !n.lida).length,
    });
});

// --------------------------------------------------------------
// POST /api/notificacoes/:id/marcar-lida — marca uma como lida.
// --------------------------------------------------------------
apiRouter.post('/notificacoes/:id/marcar-lida', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const updated = await query(
        `UPDATE notificacoes SET lida = TRUE
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
        [id, req.usuario.sub],
    );
    if (updated === null) {
        return res.status(500).json({ error: 'falha_atualizacao' });
    }
    if (updated.length === 0) {
        return res.status(404).json({ error: 'notificacao_nao_encontrada' });
    }
    res.json({ source: 'db', id, lida: true });
});

// --------------------------------------------------------------
// POST /api/notificacoes/marcar-todas-lidas — marca todas como lidas.
// --------------------------------------------------------------
apiRouter.post('/notificacoes/marcar-todas-lidas', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const updated = await query(
        `UPDATE notificacoes SET lida = TRUE
             WHERE usuario_id = $1 AND (lida IS DISTINCT FROM TRUE)
             RETURNING id`,
        [req.usuario.sub],
    );
    if (updated === null) {
        return res.status(500).json({ error: 'falha_atualizacao' });
    }
    res.json({ source: 'db', atualizadas: updated.length });
});

// ==============================================================
// INSCRICAO EM EVENTOS (RF12 / Bloco B - B6)
// --------------------------------------------------------------
// O GET /api/eventos (publico) ja lista os eventos. Aqui entram a
// inscricao do aluno logado e a consulta das suas inscricoes. UPSERT
// idempotente em usuario_eventos (UNIQUE usuario_id, evento_id);
// escrita escopada a req.usuario.sub (anti-IDOR).
// --------------------------------------------------------------

// --------------------------------------------------------------
// GET /api/eventos/minhas — ids dos eventos em que o usuario se inscreveu.
// --------------------------------------------------------------
apiRouter.get('/eventos/minhas', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', items: [] });
    }
    const rows = await query(
        `SELECT evento_id, data_inscricao
             FROM usuario_eventos
             WHERE usuario_id = $1
             ORDER BY data_inscricao DESC NULLS LAST`,
        [req.usuario.sub],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({
        source: 'db',
        items: rows.map((r) => ({ eventoId: r.evento_id, dataInscricao: r.data_inscricao })),
    });
});

// --------------------------------------------------------------
// POST /api/eventos/:id/inscrever — inscreve o usuario no evento.
// --------------------------------------------------------------
apiRouter.post('/eventos/:id/inscrever', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const eventoId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(eventoId) || eventoId <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }

    const existe = await query(`SELECT id FROM eventos WHERE id = $1 LIMIT 1`, [eventoId]);
    if (existe === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (existe.length === 0) {
        return res.status(404).json({ error: 'evento_nao_encontrado' });
    }

    const inserted = await query(
        `INSERT INTO usuario_eventos (usuario_id, evento_id, data_inscricao, presenca_confirmada)
             VALUES ($1, $2, NOW(), FALSE)
             ON CONFLICT (usuario_id, evento_id) DO NOTHING
             RETURNING id`,
        [req.usuario.sub, eventoId],
    );
    if (inserted === null) {
        return res.status(500).json({ error: 'falha_inscricao' });
    }
    // inserted.length === 0 => ja estava inscrito (idempotente): tratamos como sucesso.
    res.status(201).json({ source: 'db', eventoId, inscrito: true });
});

// --------------------------------------------------------------
// DELETE /api/eventos/:id/inscrever — cancela a inscricao do usuario.
// Idempotente: remove a linha de usuario_eventos escopada a
// req.usuario.sub (anti-IDOR). Cancelar algo ja ausente tambem e sucesso.
// --------------------------------------------------------------
apiRouter.delete('/eventos/:id/inscrever', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const eventoId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(eventoId) || eventoId <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }

    const removed = await query(
        `DELETE FROM usuario_eventos
             WHERE usuario_id = $1 AND evento_id = $2
             RETURNING id`,
        [req.usuario.sub, eventoId],
    );
    if (removed === null) {
        return res.status(500).json({ error: 'falha_cancelamento' });
    }
    // removed.length === 0 => nao estava inscrito (idempotente): sucesso mesmo assim.
    res.json({ source: 'db', eventoId, inscrito: false });
});

// ==============================================================
// GAMIFICACAO (RF13 / Bloco B - B7)
// --------------------------------------------------------------
// Consolida pontos/streak/posicao e o catalogo de conquistas (com a
// flag `earned`) do usuario logado, alem do ranking entre alunos.
// O perfil e escopado a req.usuario.sub (anti-IDOR). O ranking expoe
// apenas nome reduzido (primeiro nome + inicial do sobrenome) + pontos,
// nunca matricula/e-mail (privacidade / LGPD).
// --------------------------------------------------------------

/** Reduz o nome para "Primeiro S." preservando privacidade no ranking. */
function nomeReduzido(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'Aluno';
    if (partes.length === 1) return partes[0];
    const inicial = partes[partes.length - 1][0];
    return `${partes[0]} ${inicial.toUpperCase()}.`;
}

// --------------------------------------------------------------
// GET /api/gamificacao/perfil — pontos, streak, posicao, conquistas.
// --------------------------------------------------------------
apiRouter.get('/gamificacao/perfil', requireAuth, async (req, res) => {
    const fallback = {
        pontosTotais: 0,
        rankingPosicao: null,
        streakAtual: 0,
        streakRecorde: 0,
        conquistas: [],
        historico: [],
    };
    if (!isConnected()) {
        return res.json({ source: 'fallback', ...fallback });
    }
    const usuarioId = req.usuario.sub;

    const gRows = await query(
        `SELECT pontos_totais, ranking_posicao, streak_atual, streak_recorde
             FROM gamificacao WHERE usuario_id = $1 LIMIT 1`,
        [usuarioId],
    );
    if (gRows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }

    // Catalogo de conquistas com a flag earned (LEFT JOIN com as do usuario).
    const cRows = await query(
        `SELECT c.codigo, c.titulo, c.descricao, COALESCE(c.icone, '🏆') AS icone,
                c.pontos, uc.conquistada_em
             FROM conquistas c
             LEFT JOIN usuarios_conquistas uc
                 ON uc.conquista_id = c.id AND uc.usuario_id = $1
             ORDER BY (uc.conquistada_em IS NULL), uc.conquistada_em DESC NULLS LAST, c.id ASC`,
        [usuarioId],
    );
    const conquistas = (cRows || []).map((r) => ({
        codigo: r.codigo,
        titulo: r.titulo,
        descricao: r.descricao,
        icone: r.icone,
        pontos: Number(r.pontos) || 0,
        earned: r.conquistada_em != null,
        conquistadaEm: r.conquistada_em || null,
    }));

    // Historico de pontos derivado das conquistas obtidas (sem tabela dedicada).
    const historico = conquistas
        .filter((c) => c.earned)
        .map((c) => ({ acao: c.titulo, pontos: c.pontos, data: c.conquistadaEm }));

    const g = (gRows && gRows[0]) || {};
    res.json({
        source: 'db',
        pontosTotais: Number(g.pontos_totais) || 0,
        rankingPosicao: g.ranking_posicao != null ? Number(g.ranking_posicao) : null,
        streakAtual: Number(g.streak_atual) || 0,
        streakRecorde: Number(g.streak_recorde) || 0,
        conquistas,
        historico,
    });
});

// --------------------------------------------------------------
// GET /api/gamificacao/ranking — top alunos por pontos (privacidade).
// --------------------------------------------------------------
apiRouter.get('/gamificacao/ranking', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', items: [], minhaPosicao: null });
    }
    const usuarioId = req.usuario.sub;

    const rows = await query(
        `SELECT u.id, u.nome, COALESCE(g.pontos_totais, 0) AS pontos,
                RANK() OVER (ORDER BY COALESCE(g.pontos_totais, 0) DESC) AS posicao
             FROM gamificacao g
             JOIN usuarios u ON u.id = g.usuario_id
             WHERE UPPER(u.tipo_usuario) = 'ALUNO'
             ORDER BY pontos DESC
             LIMIT 10`,
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    const items = rows.map((r) => ({
        posicao: Number(r.posicao) || 0,
        nome: nomeReduzido(r.nome),
        pontos: Number(r.pontos) || 0,
        eu: Number(r.id) === Number(usuarioId),
    }));
    const minha = items.find((i) => i.eu);
    res.json({ source: 'db', items, minhaPosicao: minha ? minha.posicao : null });
});

// ============================================================
// LGPD — Portabilidade e Exclusao de dados (D7 / RNF09 / v1.14.0)
// ------------------------------------------------------------
// Direitos do titular (Lei 13.709/2018, Art. 18): acesso/portabilidade
// (GET /api/usuario/dados) e eliminacao (DELETE /api/usuario/conta).
// Ambas exigem sessao e sao escopadas a req.usuario.sub (anti-IDOR).
// Rotas ADITIVAS no fim do arquivo.
// ============================================================

/** Registra um evento LGPD em auditoria_dados (best-effort, nao bloqueia). */
async function registrarAuditoriaLgpd(usuarioId, acao, finalidade) {
    try {
        await query(
            `INSERT INTO auditoria_dados
                     (usuario_id, ator, acao, entidade, entidade_id, base_legal, finalidade, data_evento)
                 VALUES ($1, 'titular', $2, 'usuario', $1, 'Art. 18 da Lei 13.709/2018', $3, NOW())`,
            [usuarioId, acao, finalidade],
        );
    } catch {
        // Auditoria e secundaria: falha aqui nao invalida a operacao principal.
    }
}

// --------------------------------------------------------------
// GET /api/usuario/dados — exporta os dados pessoais do titular (JSON).
// Atende o direito de acesso/portabilidade (LGPD Art. 18, II e V).
// --------------------------------------------------------------
apiRouter.get('/usuario/dados', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = req.usuario.sub;

    // Perfil (sem password_hash — nunca exportar credencial).
    const perfilRows = await query(
        `SELECT id, matricula_institucional, email_institucional, nome,
                tipo_usuario, data_nascimento, e_mentor, created_at
             FROM usuarios WHERE id = $1 LIMIT 1`,
        [id],
    );
    if (perfilRows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (perfilRows.length === 0) {
        return res.status(404).json({ error: 'usuario_nao_encontrado' });
    }

    // Cada conjunto e consultado de forma independente e resiliente.
    const consentimentos = (await query(
        `SELECT finalidade, versao_termo, consentiu, data_consentimento
             FROM consentimentos_lgpd WHERE usuario_id = $1
             ORDER BY data_consentimento DESC`,
        [id],
    )) || [];
    const metas = (await query(
        `SELECT nome, descricao, data_agendada, data_realizacao, duracao_minutos, status
             FROM atividades_estudo WHERE usuario_id = $1
             ORDER BY id DESC`,
        [id],
    )) || [];
    const bemEstar = (await query(
        `SELECT data_aplicacao, respostas, resultado, observacoes
             FROM questionarios_bem_estar WHERE usuario_id = $1
             ORDER BY data_aplicacao DESC`,
        [id],
    )) || [];
    const forunsCriados = (await query(
        `SELECT titulo, descricao, categoria, created_at
             FROM foruns_discussao WHERE criado_por = $1
             ORDER BY created_at DESC`,
        [id],
    )) || [];
    const notificacoes = (await query(
        `SELECT titulo, mensagem, tipo, lida, data_criacao
             FROM notificacoes WHERE usuario_id = $1
             ORDER BY data_criacao DESC`,
        [id],
    )) || [];
    const gamificacaoRows = (await query(
        `SELECT pontos_totais, ranking_posicao, streak_atual, streak_recorde
             FROM gamificacao WHERE usuario_id = $1 LIMIT 1`,
        [id],
    )) || [];
    const eventosInscritos = (await query(
        `SELECT e.titulo, e.data_evento, ue.data_inscricao
             FROM usuario_eventos ue JOIN eventos e ON e.id = ue.evento_id
             WHERE ue.usuario_id = $1 ORDER BY ue.data_inscricao DESC`,
        [id],
    )) || [];

    await registrarAuditoriaLgpd(id, 'exportacao', 'portabilidade');

    res.json({
        source: 'db',
        exportadoEm: new Date().toISOString(),
        baseLegal: 'Art. 18, II e V da Lei 13.709/2018 (LGPD)',
        titular: perfilRows[0],
        consentimentos,
        planoEstudos: metas,
        bemEstar,
        forunsCriados,
        notificacoes,
        gamificacao: gamificacaoRows[0] || null,
        eventosInscritos,
    });
});

// --------------------------------------------------------------
// DELETE /api/usuario/conta — elimina/anonimiza a conta do titular.
// Atende o direito de eliminacao (LGPD Art. 18, VI). Operacao
// IRREVERSIVEL: exige body { confirmar: true }. Anonimiza o registro
// (preservando integridade referencial e metricas agregadas anonimas),
// revoga o consentimento e encerra a sessao.
// --------------------------------------------------------------
apiRouter.delete('/usuario/conta', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    if (req.body?.confirmar !== true) {
        return res.status(400).json({ error: 'confirmacao_obrigatoria' });
    }
    const id = req.usuario.sub;

    // Anonimizacao atomica (UPDATE unico). E-mail/matricula recebem valores
    // unicos por id para nao violar as constraints UNIQUE; password_hash vira
    // NULL para impedir login posterior.
    const anon = await query(
        `UPDATE usuarios
             SET nome = 'Usuário removido',
                 email_institucional = 'removido+' || id || '@removido.invalid',
                 matricula_institucional = 'ANON-' || id,
                 password_hash = NULL,
                 data_nascimento = NULL
             WHERE id = $1
             RETURNING id`,
        [id],
    );
    if (anon === null) {
        return res.status(500).json({ error: 'falha_exclusao' });
    }
    if (anon.length === 0) {
        return res.status(404).json({ error: 'usuario_nao_encontrado' });
    }

    // Registra a revogacao de consentimento (append-only) e a auditoria.
    try {
        await query(
            `INSERT INTO consentimentos_lgpd
                     (usuario_id, finalidade, versao_termo, consentiu, data_consentimento)
                 VALUES ($1, 'revogacao_exclusao', '1.0', FALSE, NOW())`,
            [id],
        );
    } catch {
        // segue: log secundario
    }
    await registrarAuditoriaLgpd(id, 'exclusao', 'eliminacao');

    // Encerra a sessao do titular (mesmo padrao do logout).
    const opts = cookieOptions();
    delete opts.maxAge;
    res.clearCookie(COOKIE_NAME, opts);

    res.json({ source: 'db', anonimizado: true });
});

// ==============================================================
// CHAT COM O NAP (RF15 / Bloco B - B3)
// --------------------------------------------------------------
// Canal direto de mensageria entre o aluno e o Nucleo de Apoio
// Psicopedagogico (NAP). Decisao de arquitetura (ver
// docs/plano-2026-06-15-v1.17.0-chat-nap.md): transporte por POLLING
// HTTP simples (sem Socket.io). RF15 nao exige tempo real, e o polling
// dispensa nova dependencia e configuracao de WebSocket no Traefik,
// reduzindo risco — coerente com a politica "tudo na VPS".
//
// Modelo de dados: chat_tickets (1 conversa) + chat_mensagens (N).
// O papel de atendente e exercido por usuarios COORDENADOR (o usuario
// institucional NAP ja existe no seed como COORDENADOR).
//
// Seguranca (dados sensiveis de saude mental):
//   - requireAuth em todas as rotas.
//   - Anti-IDOR: aluno so acessa os proprios tickets (usuario_id = sub);
//     COORDENADOR (NAP) acessa todos para atender.
//   - Rede de seguranca de crise: mensagens do aluno passam por
//     detectarCrise(); ao acionar, a resposta inclui o encaminhamento
//     imediato ao NAP/CVV 188 (mesma rede do chatbot RF16).
//   - Resiliente a banco indisponivel: leituras caem em fallback vazio;
//     mutacoes retornam 503.
// --------------------------------------------------------------

const CHAT_TITULO_MAX = 120;
const CHAT_MSG_MAX = 2000;

/** True quando o usuario da sessao tem papel de atendente NAP (COORDENADOR). */
function ehAtendenteNap(req) {
    return String(req.usuario?.tipo || '').toUpperCase() === 'COORDENADOR';
}

/** Converte uma linha de `chat_mensagens` (com nome do autor) para a UI. */
function mapChatMensagem(row) {
    return {
        id: row.id,
        ticketId: row.ticket_id,
        autorId: row.autor_id,
        autorNome: row.autor_nome || null,
        autorEhNap: String(row.autor_tipo || '').toUpperCase() === 'COORDENADOR',
        mensagem: row.mensagem,
        dataEnvio: row.data_envio || null,
    };
}

// --------------------------------------------------------------
// GET /api/chat/tickets — lista as conversas com o NAP.
// ALUNO recebe apenas as suas; COORDENADOR (NAP) recebe todas para
// atender. Inclui contagem de mensagens e previa da ultima.
// --------------------------------------------------------------
apiRouter.get('/chat/tickets', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', papel: ehAtendenteNap(req) ? 'nap' : 'aluno', items: [] });
    }
    const atendente = ehAtendenteNap(req);
    const params = atendente ? [] : [req.usuario.sub];
    const filtro = atendente ? '' : 'WHERE t.usuario_id = $1';
    const rows = await query(
        `SELECT t.id, t.usuario_id, t.atendente_id, t.titulo, t.status,
                t.data_criacao, t.data_fechamento,
                u.nome AS usuario_nome,
                (SELECT COUNT(*) FROM chat_mensagens m WHERE m.ticket_id = t.id) AS total_mensagens,
                (SELECT m.mensagem FROM chat_mensagens m WHERE m.ticket_id = t.id
                     ORDER BY m.id DESC LIMIT 1) AS ultima_mensagem,
                (SELECT m.data_envio FROM chat_mensagens m WHERE m.ticket_id = t.id
                     ORDER BY m.id DESC LIMIT 1) AS ultima_em
             FROM chat_tickets t
             JOIN usuarios u ON u.id = t.usuario_id
             ${filtro}
             ORDER BY COALESCE(
                 (SELECT MAX(m.data_envio) FROM chat_mensagens m WHERE m.ticket_id = t.id),
                 t.data_criacao
             ) DESC NULLS LAST, t.id DESC
             LIMIT 100`,
        params,
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({
        source: 'db',
        papel: atendente ? 'nap' : 'aluno',
        items: rows.map((r) => ({
            id: r.id,
            usuarioId: r.usuario_id,
            usuarioNome: r.usuario_nome,
            atendenteId: r.atendente_id,
            titulo: r.titulo,
            status: r.status || 'aberto',
            dataCriacao: r.data_criacao || null,
            dataFechamento: r.data_fechamento || null,
            totalMensagens: Number(r.total_mensagens) || 0,
            ultimaMensagem: r.ultima_mensagem || null,
            ultimaEm: r.ultima_em || null,
        })),
    });
});

// --------------------------------------------------------------
// POST /api/chat/tickets — o aluno abre uma nova conversa com o NAP.
// Body: { titulo: string, mensagem: string }. Cria o ticket e a 1a
// mensagem do aluno numa transacao logica (insercoes encadeadas).
// --------------------------------------------------------------
apiRouter.post('/chat/tickets', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const titulo = String(req.body?.titulo || '').trim();
    const mensagem = String(req.body?.mensagem || '').trim();
    if (!titulo) {
        return res.status(400).json({ error: 'titulo_obrigatorio' });
    }
    if (titulo.length > CHAT_TITULO_MAX) {
        return res.status(400).json({ error: 'titulo_muito_longo' });
    }
    if (!mensagem) {
        return res.status(400).json({ error: 'mensagem_obrigatoria' });
    }
    if (mensagem.length > CHAT_MSG_MAX) {
        return res.status(400).json({ error: 'mensagem_muito_longa' });
    }

    const usuarioId = req.usuario.sub;
    const ticketRows = await query(
        `INSERT INTO chat_tickets (usuario_id, titulo, descricao, status, data_criacao)
             VALUES ($1, $2, $3, 'aberto', NOW())
             RETURNING id, status, data_criacao`,
        [usuarioId, titulo, mensagem],
    );
    if (ticketRows === null || ticketRows.length === 0) {
        return res.status(500).json({ error: 'falha_abertura' });
    }
    const ticketId = ticketRows[0].id;

    await query(
        `INSERT INTO chat_mensagens (ticket_id, autor_id, mensagem, data_envio)
             VALUES ($1, $2, $3, NOW())`,
        [ticketId, usuarioId, mensagem],
    );

    res.status(201).json({
        source: 'db',
        ticket: {
            id: ticketId,
            titulo,
            status: ticketRows[0].status || 'aberto',
            dataCriacao: ticketRows[0].data_criacao || null,
        },
        crise: detectarCrise(mensagem),
        avisoCrise: detectarCrise(mensagem) ? RESPOSTA_CRISE : null,
    });
});

// --------------------------------------------------------------
// GET /api/chat/tickets/:id/mensagens — historico de uma conversa.
// Anti-IDOR: o dono (usuario_id) ou um COORDENADOR (NAP) acessam; os
// demais recebem 404 (nao revela existencia do ticket alheio).
// --------------------------------------------------------------
apiRouter.get('/chat/tickets/:id/mensagens', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.json({ source: 'fallback', ticket: null, mensagens: [] });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const ticketRows = await query(
        `SELECT t.id, t.usuario_id, t.atendente_id, t.titulo, t.status,
                t.data_criacao, t.data_fechamento, u.nome AS usuario_nome
             FROM chat_tickets t
             JOIN usuarios u ON u.id = t.usuario_id
             WHERE t.id = $1 LIMIT 1`,
        [id],
    );
    if (ticketRows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (ticketRows.length === 0) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }
    const ticket = ticketRows[0];
    const dono = ticket.usuario_id === req.usuario.sub;
    if (!dono && !ehAtendenteNap(req)) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }

    const rows = await query(
        `SELECT m.id, m.ticket_id, m.autor_id, m.mensagem, m.data_envio,
                a.nome AS autor_nome, a.tipo_usuario AS autor_tipo
             FROM chat_mensagens m
             JOIN usuarios a ON a.id = m.autor_id
             WHERE m.ticket_id = $1
             ORDER BY m.id ASC
             LIMIT 500`,
        [id],
    );
    if (rows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    res.json({
        source: 'db',
        ticket: {
            id: ticket.id,
            usuarioId: ticket.usuario_id,
            usuarioNome: ticket.usuario_nome,
            atendenteId: ticket.atendente_id,
            titulo: ticket.titulo,
            status: ticket.status || 'aberto',
            dataCriacao: ticket.data_criacao || null,
            dataFechamento: ticket.data_fechamento || null,
        },
        mensagens: rows.map(mapChatMensagem),
    });
});

// --------------------------------------------------------------
// POST /api/chat/tickets/:id/mensagens — envia uma mensagem na conversa.
// Anti-IDOR: dono ou COORDENADOR. Quando o autor e o NAP, registra-se
// como atendente (atendente_id) e o ticket passa a 'em_atendimento'.
// Mensagens do aluno passam pela rede de seguranca de crise.
// --------------------------------------------------------------
apiRouter.post('/chat/tickets/:id/mensagens', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const mensagem = String(req.body?.mensagem || '').trim();
    if (!mensagem) {
        return res.status(400).json({ error: 'mensagem_vazia' });
    }
    if (mensagem.length > CHAT_MSG_MAX) {
        return res.status(400).json({ error: 'mensagem_muito_longa' });
    }

    const ticketRows = await query(
        `SELECT id, usuario_id, status FROM chat_tickets WHERE id = $1 LIMIT 1`,
        [id],
    );
    if (ticketRows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (ticketRows.length === 0) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }
    const ticket = ticketRows[0];
    const dono = ticket.usuario_id === req.usuario.sub;
    const atendente = ehAtendenteNap(req);
    if (!dono && !atendente) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }
    if (String(ticket.status || '').toLowerCase() === 'fechado') {
        return res.status(409).json({ error: 'ticket_fechado' });
    }

    const ins = await query(
        `INSERT INTO chat_mensagens (ticket_id, autor_id, mensagem, data_envio)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, data_envio`,
        [id, req.usuario.sub, mensagem],
    );
    if (ins === null || ins.length === 0) {
        return res.status(500).json({ error: 'falha_envio' });
    }

    // Quando o NAP responde, assume a titularidade do atendimento.
    if (atendente) {
        await query(
            `UPDATE chat_tickets
                 SET atendente_id = $1,
                     status = CASE WHEN status = 'fechado' THEN status ELSE 'em_atendimento' END
                 WHERE id = $2`,
            [req.usuario.sub, id],
        );
    }

    // Rede de seguranca de crise so se aplica a mensagens do aluno.
    const crise = dono && !atendente ? detectarCrise(mensagem) : false;

    res.status(201).json({
        source: 'db',
        mensagem: {
            id: ins[0].id,
            ticketId: id,
            autorId: req.usuario.sub,
            autorNome: req.usuario.nome || null,
            autorEhNap: atendente,
            mensagem,
            dataEnvio: ins[0].data_envio || null,
        },
        crise,
        avisoCrise: crise ? RESPOSTA_CRISE : null,
    });
});

// --------------------------------------------------------------
// POST /api/chat/tickets/:id/fechar — encerra a conversa.
// Permitido ao dono ou ao NAP. Idempotente: refechar nao gera erro.
// --------------------------------------------------------------
apiRouter.post('/chat/tickets/:id/fechar', requireAuth, async (req, res) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'db_indisponivel' });
    }
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'id_invalido' });
    }
    const ticketRows = await query(
        `SELECT id, usuario_id FROM chat_tickets WHERE id = $1 LIMIT 1`,
        [id],
    );
    if (ticketRows === null) {
        return res.status(500).json({ error: 'falha_consulta' });
    }
    if (ticketRows.length === 0) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }
    const dono = ticketRows[0].usuario_id === req.usuario.sub;
    if (!dono && !ehAtendenteNap(req)) {
        return res.status(404).json({ error: 'ticket_nao_encontrado' });
    }
    const upd = await query(
        `UPDATE chat_tickets
             SET status = 'fechado', data_fechamento = NOW()
             WHERE id = $1 RETURNING id`,
        [id],
    );
    if (upd === null) {
        return res.status(500).json({ error: 'falha_fechamento' });
    }
    res.json({ source: 'db', id, status: 'fechado' });
});

