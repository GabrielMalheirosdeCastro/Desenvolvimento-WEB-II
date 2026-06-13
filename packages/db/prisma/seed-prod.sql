-- ============================================================
-- Seed de PRODUCAO — Site de Acolhimento FAESA
-- ------------------------------------------------------------
-- Idempotente. Adiciona persona Gabriel (matricula 23110145),
-- plano + atividades (futuras + semana corrente), 3 conquistas
-- vinculadas, 3 eventos institucionais futuros e ao menos 1
-- mentor (Mariana). Roda contra Postgres self-hosted Supabase.
-- Uso: docker exec -i supabase-db psql -U postgres -d postgres < seed-prod.sql
-- ============================================================

BEGIN;

-- 1. Instituicao + Curso (idempotente)
INSERT INTO instituicoes_faesa (codigo, nome, campus, ativo)
VALUES ('FAESA-VIT', 'FAESA Centro Universitario', 'Campus Vitoria', TRUE)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cursos (instituicao_id, codigo, nome, nivel, ativo)
SELECT id, 'SI', 'Sistemas de Informacao', 'Graduacao', TRUE
FROM instituicoes_faesa WHERE codigo = 'FAESA-VIT'
ON CONFLICT DO NOTHING;

-- 2. Persona principal — Gabriel (matricula 23110145)
INSERT INTO usuarios (matricula_institucional, email_institucional, nome, tipo_usuario, e_mentor, data_nascimento)
VALUES ('23110145', 'gabriel.castro@faesa.br', 'Gabriel Malheiros de Castro', 'ALUNO', FALSE, '2003-05-12')
ON CONFLICT (matricula_institucional) DO UPDATE
SET nome = EXCLUDED.nome,
    email_institucional = EXCLUDED.email_institucional,
    e_mentor = FALSE;

-- 3. Plano de estudo (idempotente por usuario+titulo)
INSERT INTO planos_estudo (usuario_id, titulo, descricao, meta_horas_semanal, meta_horas_mensal, status)
SELECT u.id, 'Plano 2026/1 — Gabriel',
       'Rotina semanal de estudos do prototipo do Site de Acolhimento. Meta: media >= 8.0.',
       25, 100, 'ativo'
FROM usuarios u
WHERE u.matricula_institucional = '23110145'
  AND NOT EXISTS (
    SELECT 1 FROM planos_estudo p
    WHERE p.usuario_id = u.id AND p.titulo = 'Plano 2026/1 — Gabriel'
  );

-- 4. Atividades — limpar e recriar deterministicamente
DELETE FROM atividades_estudo
WHERE plano_estudo_id IN (
  SELECT p.id FROM planos_estudo p
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE u.matricula_institucional = '23110145'
);

-- 4.a Atividades futuras (alimentam /api/dashboard/upcoming)
INSERT INTO atividades_estudo (plano_estudo_id, usuario_id, nome, descricao, data_agendada, status)
SELECT p.id, u.id, x.nome, x.descricao, x.data_agendada, x.status
FROM usuarios u
JOIN planos_estudo p ON p.usuario_id = u.id AND p.titulo = 'Plano 2026/1 — Gabriel'
CROSS JOIN (VALUES
  ('Revisao de Calculo I',     'Estudo',       (NOW() + INTERVAL '2 days')::timestamp, 'pending'),
  ('Trabalho de Programacao',  'Entrega',      (NOW() + INTERVAL '4 days')::timestamp, 'pending'),
  ('Sessao de Mentoria',       'Mentoria',     (NOW() + INTERVAL '6 days')::timestamp, 'scheduled'),
  ('Avaliacao de Bem-estar',   'Questionario', (NOW() + INTERVAL '8 days')::timestamp, 'pending')
) AS x(nome, descricao, data_agendada, status)
WHERE u.matricula_institucional = '23110145';

-- 4.b Atividades realizadas nesta semana (alimentam /api/dashboard/week)
INSERT INTO atividades_estudo (plano_estudo_id, usuario_id, nome, descricao, data_realizacao, duracao_minutos, status)
SELECT p.id, u.id, x.nome, x.descricao, x.data_realizacao, x.duracao, x.status
FROM usuarios u
JOIN planos_estudo p ON p.usuario_id = u.id AND p.titulo = 'Plano 2026/1 — Gabriel'
CROSS JOIN (VALUES
  ('Estudo Calculo I',         'Estudo', DATE_TRUNC('week', NOW()) + INTERVAL '0 days 9 hours',  240, 'done'),
  ('Estudo POO',               'Estudo', DATE_TRUNC('week', NOW()) + INTERVAL '1 days 10 hours', 300, 'done'),
  ('Lab. de Banco de Dados',   'Estudo', DATE_TRUNC('week', NOW()) + INTERVAL '2 days 14 hours', 180, 'done'),
  ('Estatistica',              'Estudo', DATE_TRUNC('week', NOW()) + INTERVAL '3 days 16 hours', 360, 'done'),
  ('Engenharia de Software',   'Estudo', DATE_TRUNC('week', NOW()) + INTERVAL '4 days 19 hours', 240, 'done')
) AS x(nome, descricao, data_realizacao, duracao, status)
WHERE u.matricula_institucional = '23110145';

-- 5. Catalogo de conquistas (upsert por codigo)
INSERT INTO conquistas (codigo, titulo, descricao, icone, pontos) VALUES
  ('primeira-semana', 'Primeira Semana',  'Ativou o app e completou a primeira semana.', '🎓', 50),
  ('5h-estudo',       '5 Horas de Estudo','Acumulou 5 horas de estudo registradas.',     '📚', 75),
  ('meta-cumprida',   'Meta Cumprida',    'Bateu uma meta semanal completa.',            '🎯', 100)
ON CONFLICT (codigo) DO UPDATE
SET titulo = EXCLUDED.titulo, descricao = EXCLUDED.descricao,
    icone = EXCLUDED.icone, pontos = EXCLUDED.pontos;

-- 5.b Vincular as 3 conquistas a Gabriel (idempotente via @@unique)
INSERT INTO usuarios_conquistas (usuario_id, conquista_id, conquistada_em)
SELECT u.id, c.id, NOW() - (n.dias || ' days')::interval
FROM usuarios u
CROSS JOIN (VALUES
  ('primeira-semana', 1),
  ('5h-estudo',       2),
  ('meta-cumprida',   3)
) AS n(codigo, dias)
JOIN conquistas c ON c.codigo = n.codigo
WHERE u.matricula_institucional = '23110145'
ON CONFLICT (usuario_id, conquista_id) DO NOTHING;

-- 5.c Gamificacao (alimenta /api/dashboard/streak; sem esta linha o
-- endpoint cai no fallback estatico mesmo com o banco populado)
INSERT INTO gamificacao (usuario_id, pontos_totais, ranking_posicao, streak_atual, streak_recorde, data_ultima_atividade)
SELECT u.id, 225, 1, 12, 18, DATE_TRUNC('day', NOW()) + INTERVAL '9 hours'
FROM usuarios u
WHERE u.matricula_institucional = '23110145'
ON CONFLICT (usuario_id) DO UPDATE
SET pontos_totais = EXCLUDED.pontos_totais,
    ranking_posicao = EXCLUDED.ranking_posicao,
    streak_atual = EXCLUDED.streak_atual,
    streak_recorde = EXCLUDED.streak_recorde,
    data_ultima_atividade = EXCLUDED.data_ultima_atividade;

-- 6. Eventos institucionais (idempotente por titulo via DELETE+INSERT)
DELETE FROM eventos WHERE titulo IN (
  'Palestra: Saude Mental no Ambiente Academico',
  'Oficina: Tecnicas de Estudo para o Periodo Final',
  'Encontro de Mentoria — Calouros 2026/2'
);
INSERT INTO eventos (titulo, descricao, tipo, data_evento, local, vagas) VALUES
  ('Palestra: Saude Mental no Ambiente Academico',
   'Roda de conversa com a equipe de psicologia da FAESA.',
   'Palestra', NOW() + INTERVAL '15 days', 'Auditorio Central — Campus Vitoria', 80),
  ('Oficina: Tecnicas de Estudo para o Periodo Final',
   'Workshop pratico sobre Pomodoro, Cornell e mapas mentais.',
   'Oficina', NOW() + INTERVAL '23 days', 'Sala B-204', 30),
  ('Encontro de Mentoria — Calouros 2026/2',
   'Apresentacao do programa de mentoria entre alunos.',
   'Encontro', NOW() + INTERVAL '31 days', 'Hall do Bloco A', 120);

-- 7. Garante ao menos 1 mentor para /api/mentorias?papel=mentor
INSERT INTO usuarios (matricula_institucional, email_institucional, nome, tipo_usuario, e_mentor, data_nascimento)
VALUES ('20210042', 'mariana.costa@faesa.br', 'Mariana Costa', 'ALUNO', TRUE, '2004-07-22')
ON CONFLICT (matricula_institucional) DO UPDATE SET e_mentor = TRUE;

COMMIT;

-- 8. Relatorio rapido
SELECT 'usuarios'              AS t, COUNT(*) FROM usuarios WHERE matricula_institucional = '23110145'
UNION ALL SELECT 'planos_estudo (Gabriel)', COUNT(*) FROM planos_estudo p JOIN usuarios u ON u.id=p.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'atividades_estudo (Gabriel)', COUNT(*) FROM atividades_estudo a JOIN usuarios u ON u.id=a.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'usuarios_conquistas (Gabriel)', COUNT(*) FROM usuarios_conquistas uc JOIN usuarios u ON u.id=uc.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'gamificacao (Gabriel)', COUNT(*) FROM gamificacao g JOIN usuarios u ON u.id=g.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'eventos (futuros)', COUNT(*) FROM eventos WHERE data_evento > NOW()
UNION ALL SELECT 'mentores (e_mentor=true)', COUNT(*) FROM usuarios WHERE e_mentor=TRUE;
