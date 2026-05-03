-- CreateTable
CREATE TABLE "instituicoes_faesa" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "campus" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "instituicoes_faesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" SERIAL NOT NULL,
    "instituicao_id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" SERIAL NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "turno" TEXT,
    "status" TEXT,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "carga_horaria" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_disciplinas" (
    "id" SERIAL NOT NULL,
    "turma_id" INTEGER NOT NULL,
    "disciplina_id" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "professor_responsavel" TEXT,

    CONSTRAINT "turma_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "matricula_institucional" TEXT NOT NULL,
    "email_institucional" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_usuario" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas_academicas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "turma_id" INTEGER NOT NULL,
    "numero_matricula" TEXT NOT NULL,
    "periodo_atual" INTEGER,
    "cra" DOUBLE PRECISION,
    "status" TEXT,
    "data_ingresso" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "matriculas_academicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas_cursadas" (
    "id" SERIAL NOT NULL,
    "matricula_id" INTEGER NOT NULL,
    "turma_disciplina_id" INTEGER NOT NULL,
    "frequencia_percentual" DOUBLE PRECISION,
    "media_final" DOUBLE PRECISION,
    "situacao" TEXT,

    CONSTRAINT "disciplinas_cursadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes_disciplina" (
    "id" SERIAL NOT NULL,
    "disciplina_cursada_id" INTEGER NOT NULL,
    "tipo" TEXT,
    "descricao" TEXT,
    "nota" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "data_avaliacao" TIMESTAMP(3),

    CONSTRAINT "avaliacoes_disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_estudo" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "meta_horas_semanal" INTEGER,
    "meta_horas_mensal" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "status" TEXT,

    CONSTRAINT "planos_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_semanais" (
    "id" SERIAL NOT NULL,
    "plano_estudo_id" INTEGER NOT NULL,
    "numero_semana" INTEGER NOT NULL,
    "horas_meta" INTEGER,
    "horas_realizadas" INTEGER,

    CONSTRAINT "metas_semanais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_estudo" (
    "id" SERIAL NOT NULL,
    "plano_estudo_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "data_agendada" TIMESTAMP(3),
    "data_realizacao" TIMESTAMP(3),
    "duracao_minutos" INTEGER,
    "status" TEXT,

    CONSTRAINT "atividades_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercicios_concentracao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo" TEXT,
    "duracao_minutos" INTEGER,
    "data_realizacao" TIMESTAMP(3),
    "pontos_ganhos" INTEGER,

    CONSTRAINT "exercicios_concentracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trilhas_aprendizagem" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "publico_alvo" TEXT,

    CONSTRAINT "trilhas_aprendizagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "url" TEXT,
    "categoria" TEXT,
    "visualizacoes" INTEGER,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trilha_recursos" (
    "id" SERIAL NOT NULL,
    "trilha_id" INTEGER NOT NULL,
    "recurso_id" INTEGER NOT NULL,
    "ordem" INTEGER,

    CONSTRAINT "trilha_recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_recursos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "recurso_id" INTEGER NOT NULL,
    "data_acesso" TIMESTAMP(3),
    "favorito" BOOLEAN,

    CONSTRAINT "usuario_recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foruns_discussao" (
    "id" SERIAL NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foruns_discussao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" SERIAL NOT NULL,
    "forum_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "conteudo" TEXT,
    "votos_positivos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_comentarios" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aprovado',
    "editado_em" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "removido_por" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorias" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "mentorado_id" INTEGER NOT NULL,
    "status" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "objetivo" TEXT,

    CONSTRAINT "mentorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "titulo" TEXT,
    "mensagem" TEXT,
    "tipo" TEXT,
    "lida" BOOLEAN,
    "data_criacao" TIMESTAMP(3),

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionarios_bem_estar" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data_aplicacao" TIMESTAMP(3),
    "respostas" TEXT,
    "resultado" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "questionarios_bem_estar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamificacao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pontos_totais" INTEGER,
    "badges" TEXT,
    "ranking_posicao" INTEGER,

    CONSTRAINT "gamificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "tipo" TEXT,
    "data_evento" TIMESTAMP(3),
    "local" TEXT,
    "vagas" INTEGER,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_eventos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "data_inscricao" TIMESTAMP(3),
    "presenca_confirmada" BOOLEAN,

    CONSTRAINT "usuario_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_tickets" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "atendente_id" INTEGER,
    "titulo" TEXT,
    "descricao" TEXT,
    "status" TEXT,
    "data_criacao" TIMESTAMP(3),
    "data_fechamento" TIMESTAMP(3),

    CONSTRAINT "chat_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_mensagens" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "mensagem" TEXT,
    "data_envio" TIMESTAMP(3),

    CONSTRAINT "chat_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_conversas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "faixa_etaria" TEXT,
    "canal" TEXT,
    "status" TEXT,
    "iniciou_em" TIMESTAMP(3),
    "encerrou_em" TIMESTAMP(3),

    CONSTRAINT "chatbot_conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_mensagens" (
    "id" SERIAL NOT NULL,
    "conversa_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "origem" TEXT,
    "conteudo" TEXT,
    "intencao" TEXT,
    "sentimento" TEXT,
    "data_envio" TIMESTAMP(3),

    CONSTRAINT "chatbot_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_anonimizados" (
    "id" SERIAL NOT NULL,
    "tipo_relatorio" TEXT,
    "periodo_inicio" TIMESTAMP(3),
    "periodo_fim" TIMESTAMP(3),
    "dimensao" TEXT,
    "valor_agregado" DOUBLE PRECISION,
    "total_registros" INTEGER,
    "gerado_em" TIMESTAMP(3),

    CONSTRAINT "relatorios_anonimizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimentos_lgpd" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "finalidade" TEXT,
    "versao_termo" TEXT,
    "consentiu" BOOLEAN NOT NULL,
    "ip_origem" TEXT,
    "user_agent" TEXT,
    "data_consentimento" TIMESTAMP(3),

    CONSTRAINT "consentimentos_lgpd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_dados" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "relatorio_id" INTEGER,
    "ator" TEXT,
    "acao" TEXT,
    "entidade" TEXT,
    "entidade_id" INTEGER,
    "base_legal" TEXT,
    "finalidade" TEXT,
    "data_evento" TIMESTAMP(3),

    CONSTRAINT "auditoria_dados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instituicoes_faesa_codigo_key" ON "instituicoes_faesa"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "turma_disciplinas_turma_id_disciplina_id_ano_semestre_key" ON "turma_disciplinas"("turma_id", "disciplina_id", "ano", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_matricula_institucional_key" ON "usuarios"("matricula_institucional");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_institucional_key" ON "usuarios"("email_institucional");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_academicas_numero_matricula_key" ON "matriculas_academicas"("numero_matricula");

-- CreateIndex
CREATE INDEX "idx_matriculas_turma" ON "matriculas_academicas"("turma_id");

-- CreateIndex
CREATE INDEX "idx_disciplinas_cursadas_matricula" ON "disciplinas_cursadas"("matricula_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_trilha_recursos_unico" ON "trilha_recursos"("trilha_id", "recurso_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_trilha_recursos_ordem_unica" ON "trilha_recursos"("trilha_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_recursos_usuario_id_recurso_id_key" ON "usuario_recursos"("usuario_id", "recurso_id");

-- CreateIndex
CREATE INDEX "forum_comentarios_post_id_idx" ON "forum_comentarios"("post_id");

-- CreateIndex
CREATE INDEX "forum_comentarios_usuario_id_idx" ON "forum_comentarios"("usuario_id");

-- CreateIndex
CREATE INDEX "forum_comentarios_status_idx" ON "forum_comentarios"("status");

-- CreateIndex
CREATE INDEX "forum_comentarios_deleted_at_idx" ON "forum_comentarios"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "gamificacao_usuario_id_key" ON "gamificacao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_eventos_usuario_id_evento_id_key" ON "usuario_eventos"("usuario_id", "evento_id");

-- CreateIndex
CREATE INDEX "idx_chatbot_conversas_faixa" ON "chatbot_conversas"("faixa_etaria", "usuario_id");

-- CreateIndex
CREATE INDEX "idx_consentimentos_usuario_finalidade" ON "consentimentos_lgpd"("usuario_id", "finalidade", "consentiu");

-- CreateIndex
CREATE INDEX "idx_auditoria_data" ON "auditoria_dados"("data_evento");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_instituicao_id_fkey" FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_faesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_disciplinas" ADD CONSTRAINT "turma_disciplinas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_disciplinas" ADD CONSTRAINT "turma_disciplinas_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_academicas" ADD CONSTRAINT "matriculas_academicas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_academicas" ADD CONSTRAINT "matriculas_academicas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas_cursadas" ADD CONSTRAINT "disciplinas_cursadas_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas_academicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas_cursadas" ADD CONSTRAINT "disciplinas_cursadas_turma_disciplina_id_fkey" FOREIGN KEY ("turma_disciplina_id") REFERENCES "turma_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes_disciplina" ADD CONSTRAINT "avaliacoes_disciplina_disciplina_cursada_id_fkey" FOREIGN KEY ("disciplina_cursada_id") REFERENCES "disciplinas_cursadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_estudo" ADD CONSTRAINT "planos_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_semanais" ADD CONSTRAINT "metas_semanais_plano_estudo_id_fkey" FOREIGN KEY ("plano_estudo_id") REFERENCES "planos_estudo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_estudo" ADD CONSTRAINT "atividades_estudo_plano_estudo_id_fkey" FOREIGN KEY ("plano_estudo_id") REFERENCES "planos_estudo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_estudo" ADD CONSTRAINT "atividades_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercicios_concentracao" ADD CONSTRAINT "exercicios_concentracao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trilha_recursos" ADD CONSTRAINT "trilha_recursos_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas_aprendizagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trilha_recursos" ADD CONSTRAINT "trilha_recursos_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_recursos" ADD CONSTRAINT "usuario_recursos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_recursos" ADD CONSTRAINT "usuario_recursos_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foruns_discussao" ADD CONSTRAINT "foruns_discussao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "foruns_discussao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comentarios" ADD CONSTRAINT "forum_comentarios_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comentarios" ADD CONSTRAINT "forum_comentarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comentarios" ADD CONSTRAINT "forum_comentarios_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorias" ADD CONSTRAINT "mentorias_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorias" ADD CONSTRAINT "mentorias_mentorado_id_fkey" FOREIGN KEY ("mentorado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionarios_bem_estar" ADD CONSTRAINT "questionarios_bem_estar_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamificacao" ADD CONSTRAINT "gamificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_eventos" ADD CONSTRAINT "usuario_eventos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_eventos" ADD CONSTRAINT "usuario_eventos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tickets" ADD CONSTRAINT "chat_tickets_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tickets" ADD CONSTRAINT "chat_tickets_atendente_id_fkey" FOREIGN KEY ("atendente_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_mensagens" ADD CONSTRAINT "chat_mensagens_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "chat_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_mensagens" ADD CONSTRAINT "chat_mensagens_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversas" ADD CONSTRAINT "chatbot_conversas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_mensagens" ADD CONSTRAINT "chatbot_mensagens_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "chatbot_conversas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_mensagens" ADD CONSTRAINT "chatbot_mensagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimentos_lgpd" ADD CONSTRAINT "consentimentos_lgpd_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_dados" ADD CONSTRAINT "auditoria_dados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_dados" ADD CONSTRAINT "auditoria_dados_relatorio_id_fkey" FOREIGN KEY ("relatorio_id") REFERENCES "relatorios_anonimizados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
