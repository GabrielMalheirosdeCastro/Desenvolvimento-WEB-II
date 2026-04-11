PRAGMA foreign_keys = ON;

-- 1. Dominio academico
CREATE TABLE IF NOT EXISTS instituicoes_faesa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    campus TEXT,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    nivel TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes_faesa(id)
);

CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    ano INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    turno TEXT,
    status TEXT,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS disciplinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    carga_horaria INTEGER,
    ativa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS turma_disciplinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turma_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    professor_responsavel TEXT,
    UNIQUE (turma_id, disciplina_id, ano, semestre),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_institucional TEXT NOT NULL UNIQUE,
    email_institucional TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    tipo_usuario TEXT NOT NULL,
    data_nascimento TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matriculas_academicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    turma_id INTEGER NOT NULL,
    numero_matricula TEXT NOT NULL UNIQUE,
    periodo_atual INTEGER,
    cra REAL,
    status TEXT,
    data_ingresso TEXT,
    data_fim TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

CREATE TABLE IF NOT EXISTS disciplinas_cursadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_id INTEGER NOT NULL,
    turma_disciplina_id INTEGER NOT NULL,
    frequencia_percentual REAL,
    media_final REAL,
    situacao TEXT,
    FOREIGN KEY (matricula_id) REFERENCES matriculas_academicas(id),
    FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplinas(id)
);

CREATE TABLE IF NOT EXISTS avaliacoes_disciplina (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disciplina_cursada_id INTEGER NOT NULL,
    tipo TEXT,
    descricao TEXT,
    nota REAL,
    peso REAL,
    data_avaliacao TEXT,
    FOREIGN KEY (disciplina_cursada_id) REFERENCES disciplinas_cursadas(id)
);

-- 2. Planejamento e aprendizagem
CREATE TABLE IF NOT EXISTS planos_estudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    meta_horas_semanal INTEGER,
    meta_horas_mensal INTEGER,
    data_inicio TEXT,
    data_fim TEXT,
    status TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS metas_semanais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plano_estudo_id INTEGER NOT NULL,
    numero_semana INTEGER NOT NULL,
    horas_meta INTEGER,
    horas_realizadas INTEGER,
    FOREIGN KEY (plano_estudo_id) REFERENCES planos_estudo(id)
);

CREATE TABLE IF NOT EXISTS atividades_estudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plano_estudo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_agendada TEXT,
    data_realizacao TEXT,
    duracao_minutos INTEGER,
    status TEXT,
    FOREIGN KEY (plano_estudo_id) REFERENCES planos_estudo(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS exercicios_concentracao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT,
    duracao_minutos INTEGER,
    data_realizacao TEXT,
    pontos_ganhos INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS trilhas_aprendizagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    publico_alvo TEXT
);

CREATE TABLE IF NOT EXISTS recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    url TEXT,
    categoria TEXT,
    visualizacoes INTEGER
);

CREATE TABLE IF NOT EXISTS trilha_recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trilha_id INTEGER NOT NULL,
    recurso_id INTEGER NOT NULL,
    ordem INTEGER,
    FOREIGN KEY (trilha_id) REFERENCES trilhas_aprendizagem(id),
    FOREIGN KEY (recurso_id) REFERENCES recursos(id)
);

CREATE TABLE IF NOT EXISTS usuario_recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    recurso_id INTEGER NOT NULL,
    data_acesso TEXT,
    favorito INTEGER CHECK (favorito IN (0, 1)),
    UNIQUE (usuario_id, recurso_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (recurso_id) REFERENCES recursos(id)
);

-- 3. Comunidade e suporte
CREATE TABLE IF NOT EXISTS foruns_discussao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    criado_por INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forum_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    conteudo TEXT,
    votos_positivos INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES foruns_discussao(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS forum_comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    conteudo TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS mentorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    mentorado_id INTEGER NOT NULL,
    status TEXT,
    data_inicio TEXT,
    data_fim TEXT,
    objetivo TEXT,
    CHECK (mentor_id <> mentorado_id),
    FOREIGN KEY (mentor_id) REFERENCES usuarios(id),
    FOREIGN KEY (mentorado_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT,
    mensagem TEXT,
    tipo TEXT,
    lida INTEGER CHECK (lida IN (0, 1)),
    data_criacao TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS questionarios_bem_estar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_aplicacao TEXT,
    respostas TEXT,
    resultado TEXT,
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS gamificacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    pontos_totais INTEGER,
    badges TEXT,
    ranking_posicao INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descricao TEXT,
    tipo TEXT,
    data_evento TEXT,
    local TEXT,
    vagas INTEGER
);

CREATE TABLE IF NOT EXISTS usuario_eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    evento_id INTEGER NOT NULL,
    data_inscricao TEXT,
    presenca_confirmada INTEGER CHECK (presenca_confirmada IN (0, 1)),
    UNIQUE (usuario_id, evento_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

CREATE TABLE IF NOT EXISTS chat_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    atendente_id INTEGER,
    titulo TEXT,
    descricao TEXT,
    status TEXT,
    data_criacao TEXT,
    data_fechamento TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (atendente_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS chat_mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    autor_id INTEGER NOT NULL,
    mensagem TEXT,
    data_envio TEXT,
    FOREIGN KEY (ticket_id) REFERENCES chat_tickets(id),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

-- 4. Cobertura RF16, RF14 e LGPD
CREATE TABLE IF NOT EXISTS chatbot_conversas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    faixa_etaria TEXT CHECK (faixa_etaria IN ('17-20', '21-25', '26+')),
    canal TEXT,
    status TEXT,
    iniciou_em TEXT,
    encerrou_em TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS chatbot_mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversa_id INTEGER NOT NULL,
    usuario_id INTEGER,
    origem TEXT,
    conteudo TEXT,
    intencao TEXT,
    sentimento TEXT,
    data_envio TEXT,
    FOREIGN KEY (conversa_id) REFERENCES chatbot_conversas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS relatorios_anonimizados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_relatorio TEXT,
    periodo_inicio TEXT,
    periodo_fim TEXT,
    dimensao TEXT,
    valor_agregado REAL,
    total_registros INTEGER,
    gerado_em TEXT
);

CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    finalidade TEXT,
    versao_termo TEXT,
    consentiu INTEGER NOT NULL CHECK (consentiu IN (0, 1)),
    ip_origem TEXT,
    user_agent TEXT,
    data_consentimento TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS auditoria_dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    relatorio_id INTEGER,
    ator TEXT,
    acao TEXT,
    entidade TEXT,
    entidade_id INTEGER,
    base_legal TEXT,
    finalidade TEXT,
    data_evento TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (relatorio_id) REFERENCES relatorios_anonimizados(id)
);

-- Integridade de relacionamento N:M
CREATE UNIQUE INDEX IF NOT EXISTS idx_trilha_recursos_unico
ON trilha_recursos (trilha_id, recurso_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trilha_recursos_ordem_unica
ON trilha_recursos (trilha_id, ordem);

-- Indices de suporte para consultas por requisito
CREATE INDEX IF NOT EXISTS idx_matriculas_turma
ON matriculas_academicas (turma_id);

CREATE INDEX IF NOT EXISTS idx_disciplinas_cursadas_matricula
ON disciplinas_cursadas (matricula_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversas_faixa
ON chatbot_conversas (faixa_etaria, usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_data
ON auditoria_dados (data_evento);

CREATE INDEX IF NOT EXISTS idx_consentimentos_usuario_finalidade
ON consentimentos_lgpd (usuario_id, finalidade, consentiu);

-- RF14: relatorio agregado por turma, sem identificacao individual
CREATE VIEW IF NOT EXISTS vw_rf14_relatorio_turma_desempenho AS
SELECT
    t.codigo AS turma,
    t.ano,
    t.semestre,
    COUNT(DISTINCT ma.usuario_id) AS total_alunos,
    ROUND(AVG(dc.frequencia_percentual), 2) AS frequencia_media,
    ROUND(AVG(dc.media_final), 2) AS media_geral,
    SUM(CASE WHEN dc.situacao = 'APROVADO' THEN 1 ELSE 0 END) AS aprovacoes,
    SUM(CASE WHEN dc.situacao <> 'APROVADO' OR dc.situacao IS NULL THEN 1 ELSE 0 END) AS nao_aprovacoes
FROM turmas t
JOIN matriculas_academicas ma ON ma.turma_id = t.id
JOIN disciplinas_cursadas dc ON dc.matricula_id = ma.id
GROUP BY t.id, t.codigo, t.ano, t.semestre;

-- RF16: contexto de conversas do chatbot por faixa etaria
CREATE VIEW IF NOT EXISTS vw_rf16_chatbot_por_faixa AS
SELECT
    cc.faixa_etaria,
    COUNT(DISTINCT cc.id) AS total_conversas,
    COUNT(cm.id) AS total_mensagens,
    SUM(CASE WHEN cm.origem = 'USUARIO' THEN 1 ELSE 0 END) AS mensagens_usuario,
    SUM(CASE WHEN cm.origem = 'BOT' THEN 1 ELSE 0 END) AS mensagens_bot,
    MAX(cc.iniciou_em) AS ultima_conversa
FROM chatbot_conversas cc
LEFT JOIN chatbot_mensagens cm ON cm.conversa_id = cc.id
GROUP BY cc.faixa_etaria;

-- RNF09: trilha de conformidade LGPD por finalidade
CREATE VIEW IF NOT EXISTS vw_rnf09_lgpd_auditoria AS
SELECT
    c.finalidade,
    COUNT(DISTINCT c.usuario_id) AS usuarios_com_consentimento,
    SUM(CASE WHEN c.consentiu = 1 THEN 1 ELSE 0 END) AS total_consentimentos_validos,
    COUNT(a.id) AS total_eventos_auditoria,
    MAX(a.data_evento) AS ultimo_evento
FROM consentimentos_lgpd c
LEFT JOIN auditoria_dados a
    ON a.usuario_id = c.usuario_id
   AND a.finalidade = c.finalidade
GROUP BY c.finalidade;
