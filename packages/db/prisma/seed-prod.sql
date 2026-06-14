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

-- 7.1 Alunos de demonstracao para popular o ranking de gamificacao (RF13).
-- Sem hash de senha: nao fazem login, existem apenas para o ranking.
INSERT INTO usuarios (matricula_institucional, email_institucional, nome, tipo_usuario, e_mentor, data_nascimento)
VALUES
  ('23110200', 'lucas.andrade@faesa.br', 'Lucas Andrade', 'ALUNO', FALSE, '2003-03-10'),
  ('23110201', 'beatriz.lima@faesa.br',  'Beatriz Lima',  'ALUNO', FALSE, '2004-09-18')
ON CONFLICT (matricula_institucional) DO UPDATE SET nome = EXCLUDED.nome;

-- 7.2 Gamificacao dos demais alunos (Gabriel lidera com 225 pontos).
INSERT INTO gamificacao (usuario_id, pontos_totais, ranking_posicao, streak_atual, streak_recorde, data_ultima_atividade)
SELECT u.id, v.pontos, v.posicao, v.streak, v.recorde, DATE_TRUNC('day', NOW()) + INTERVAL '9 hours'
FROM (VALUES
  ('20210042', 180, 2, 8, 15),
  ('23110200', 150, 3, 5, 10),
  ('23110201', 90,  4, 3, 7)
) AS v(matricula, pontos, posicao, streak, recorde)
JOIN usuarios u ON u.matricula_institucional = v.matricula
ON CONFLICT (usuario_id) DO UPDATE
SET pontos_totais = EXCLUDED.pontos_totais,
    ranking_posicao = EXCLUDED.ranking_posicao,
    streak_atual = EXCLUDED.streak_atual,
    streak_recorde = EXCLUDED.streak_recorde;

-- 7.3 Notificacoes da persona (RF10). Idempotente por usuario via DELETE+INSERT.
DELETE FROM notificacoes
WHERE usuario_id IN (SELECT id FROM usuarios WHERE matricula_institucional = '23110145');
INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo, lida, data_criacao)
SELECT u.id, v.titulo, v.mensagem, v.tipo, v.lida, v.data_criacao
FROM usuarios u
CROSS JOIN (VALUES
  ('Bem-vindo ao Acolhimento FAESA', 'Sua conta foi configurada com sucesso. Explore os recursos disponiveis.', 'sucesso', TRUE,  NOW() - INTERVAL '5 days'),
  ('Nova conquista desbloqueada',    'Voce conquistou "Meta Cumprida" (+100 pontos).',                         'sucesso', FALSE, NOW() - INTERVAL '2 days'),
  ('Sessao de mentoria agendada',    'Sua sessao com Mariana Costa esta marcada para esta semana.',            'info',    FALSE, NOW() - INTERVAL '1 days'),
  ('Lembrete de bem-estar',          'Que tal registrar como foi sua semana? Leva menos de 2 minutos.',        'info',    FALSE, NOW() - INTERVAL '6 hours')
) AS v(titulo, mensagem, tipo, lida, data_criacao)
WHERE u.matricula_institucional = '23110145';

-- 7.5 Avaliacoes de bem-estar (RF11) — alimenta GET /api/bem-estar com
-- historico real da persona. Idempotente por usuario via DELETE+INSERT.
-- respostas guarda JSON {humor,estresse,sono} (escala 1..5); resultado e a
-- classificacao calculada (positivo|atencao|critico).
DELETE FROM questionarios_bem_estar
WHERE usuario_id IN (SELECT id FROM usuarios WHERE matricula_institucional = '23110145');
INSERT INTO questionarios_bem_estar (usuario_id, data_aplicacao, respostas, resultado, observacoes)
SELECT u.id, v.data_aplicacao, v.respostas, v.resultado, v.observacoes
FROM usuarios u
CROSS JOIN (VALUES
  (NOW() - INTERVAL '14 days', '{"humor":4,"estresse":2,"sono":4}', 'positivo', 'Semana tranquila, consegui manter a rotina de estudos.'),
  (NOW() - INTERVAL '7 days',  '{"humor":3,"estresse":4,"sono":3}', 'atencao',  'Proximidade das provas aumentou o estresse.'),
  (NOW() - INTERVAL '1 days',  '{"humor":4,"estresse":3,"sono":4}', 'positivo', 'Melhorei o sono e me sinto mais equilibrado.')
) AS v(data_aplicacao, respostas, resultado, observacoes)
WHERE u.matricula_institucional = '23110145';

-- 7.6 Biblioteca (H7) — recursos institucionais. Idempotente por titulo
-- (preserva id e visualizacoes acumuladas em reexecucoes).
INSERT INTO recursos (titulo, descricao, tipo, url, categoria, visualizacoes)
SELECT v.titulo, v.descricao, v.tipo, v.url, v.categoria, 0
FROM (VALUES
  ('Tecnicas de Estudo Eficazes',
   'Guia introdutorio sobre metodos de estudo: Pomodoro, Cornell e revisao espacada.',
   'Artigo', 'https://www.faesa.br', 'Estudos'),
  ('Guia de Saude Mental na Universidade',
   'Material de apoio sobre ansiedade, rotina saudavel e quando procurar ajuda.',
   'PDF', 'https://www.faesa.br', 'Bem-estar'),
  ('Introducao a Programacao',
   'Videoaula introdutoria sobre logica de programacao para ingressantes.',
   'Video', 'https://www.faesa.br', 'Tecnologia'),
  ('Organizacao do Tempo com Pomodoro',
   'Como aplicar a tecnica Pomodoro na rotina academica e manter o foco.',
   'Artigo', 'https://www.faesa.br', 'Produtividade'),
  ('Gestao de Ansiedade em Provas',
   'Estrategias praticas para controlar a ansiedade antes e durante avaliacoes.',
   'Artigo', 'https://www.faesa.br', 'Bem-estar'),
  ('Fundamentos de Banco de Dados',
   'Conceitos iniciais de modelagem relacional e introducao ao SQL.',
   'PDF', 'https://www.faesa.br', 'Tecnologia')
) AS v(titulo, descricao, tipo, url, categoria)
WHERE NOT EXISTS (SELECT 1 FROM recursos r WHERE r.titulo = v.titulo);

-- 7.7 Trilhas de aprendizagem — idempotente por nome.
INSERT INTO trilhas_aprendizagem (nome, descricao, publico_alvo)
SELECT v.nome, v.descricao, v.publico_alvo
FROM (VALUES
  ('Fundamentos de ADS', 'Trilha introdutoria para ingressantes de ADS.', 'Ingressantes'),
  ('Bem-estar e Saude Mental', 'Recursos para cuidar da saude mental na vida academica.', 'Todos os alunos'),
  ('Produtividade nos Estudos', 'Metodos e ferramentas para estudar com mais eficiencia.', 'Todos os alunos')
) AS v(nome, descricao, publico_alvo)
WHERE NOT EXISTS (SELECT 1 FROM trilhas_aprendizagem t WHERE t.nome = v.nome);

-- 7.8 Vinculo trilha<->recurso com ordem. Idempotente via unique
-- (trilha_id, recurso_id). Resolve ids por nome/titulo (estaveis).
INSERT INTO trilha_recursos (trilha_id, recurso_id, ordem)
SELECT t.id, r.id, v.ordem
FROM (VALUES
  ('Fundamentos de ADS',        'Introducao a Programacao',              1),
  ('Fundamentos de ADS',        'Fundamentos de Banco de Dados',         2),
  ('Fundamentos de ADS',        'Tecnicas de Estudo Eficazes',           3),
  ('Bem-estar e Saude Mental',  'Guia de Saude Mental na Universidade',  1),
  ('Bem-estar e Saude Mental',  'Gestao de Ansiedade em Provas',         2),
  ('Produtividade nos Estudos', 'Organizacao do Tempo com Pomodoro',     1),
  ('Produtividade nos Estudos', 'Tecnicas de Estudo Eficazes',           2)
) AS v(trilha_nome, recurso_titulo, ordem)
JOIN trilhas_aprendizagem t ON t.nome = v.trilha_nome
JOIN recursos r ON r.titulo = v.recurso_titulo
ON CONFLICT (trilha_id, recurso_id) DO NOTHING;

-- 7.9 Usuario institucional NAP — autor dos topicos iniciais do forum.
-- tipo_usuario COORDENADOR antecipa o RBAC (A4). Nao faz login (sem hash).
INSERT INTO usuarios (matricula_institucional, email_institucional, nome, tipo_usuario, e_mentor, data_nascimento)
VALUES ('NAP-FAESA', 'nap@faesa.br', 'Nucleo de Apoio Psicopedagogico (NAP)', 'COORDENADOR', FALSE, '2000-01-01')
ON CONFLICT (matricula_institucional) DO UPDATE
SET nome = EXCLUDED.nome, tipo_usuario = 'COORDENADOR';

-- 7.10 Topicos iniciais do forum (H6) — idempotente por titulo.
INSERT INTO foruns_discussao (criado_por, titulo, descricao, categoria)
SELECT nap.id, v.titulo, v.descricao, v.categoria
FROM usuarios nap
CROSS JOIN (VALUES
  ('Dicas para a primeira semana de aula',
   'Compartilhe o que ajudou voce a se adaptar no inicio do curso.', 'Dicas'),
  ('Como organizar tempo entre trabalho e estudos?',
   'Estrategias de organizacao para quem concilia emprego e faculdade.', 'Discussao'),
  ('Grupo de estudos de Calculo I',
   'Vamos montar um grupo para resolver listas e tirar duvidas juntos.', 'Grupos')
) AS v(titulo, descricao, categoria)
WHERE nap.matricula_institucional = 'NAP-FAESA'
  AND NOT EXISTS (SELECT 1 FROM foruns_discussao f WHERE f.titulo = v.titulo);

COMMIT;

-- 8. Relatorio rapido
SELECT 'usuarios'              AS t, COUNT(*) FROM usuarios WHERE matricula_institucional = '23110145'
UNION ALL SELECT 'planos_estudo (Gabriel)', COUNT(*) FROM planos_estudo p JOIN usuarios u ON u.id=p.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'atividades_estudo (Gabriel)', COUNT(*) FROM atividades_estudo a JOIN usuarios u ON u.id=a.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'usuarios_conquistas (Gabriel)', COUNT(*) FROM usuarios_conquistas uc JOIN usuarios u ON u.id=uc.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'gamificacao (Gabriel)', COUNT(*) FROM gamificacao g JOIN usuarios u ON u.id=g.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'gamificacao (ranking total)', COUNT(*) FROM gamificacao
UNION ALL SELECT 'notificacoes (Gabriel)', COUNT(*) FROM notificacoes n JOIN usuarios u ON u.id=n.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'bem_estar (Gabriel)', COUNT(*) FROM questionarios_bem_estar q JOIN usuarios u ON u.id=q.usuario_id WHERE u.matricula_institucional='23110145'
UNION ALL SELECT 'eventos (futuros)', COUNT(*) FROM eventos WHERE data_evento > NOW()
UNION ALL SELECT 'recursos', COUNT(*) FROM recursos
UNION ALL SELECT 'trilhas_aprendizagem', COUNT(*) FROM trilhas_aprendizagem
UNION ALL SELECT 'trilha_recursos', COUNT(*) FROM trilha_recursos
UNION ALL SELECT 'foruns_discussao', COUNT(*) FROM foruns_discussao
UNION ALL SELECT 'mentores (e_mentor=true)', COUNT(*) FROM usuarios WHERE e_mentor=TRUE;
