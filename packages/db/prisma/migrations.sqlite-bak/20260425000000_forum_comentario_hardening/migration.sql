-- Migration: endurece o modelo ForumComentario
-- - conteudo passa a ser NOT NULL
-- - novas colunas: status, editado_em, deleted_at, removido_por
-- - FKs explicitas: post (CASCADE), usuario (RESTRICT), removedor (SET NULL)
-- - indices em post_id, usuario_id, status, deleted_at
--
-- SQLite nao permite ALTER TABLE para mudar FK/NOT NULL,
-- portanto seguimos o padrao oficial de "table rebuild".
-- Ref: https://www.sqlite.org/lang_altertable.html#otheralter

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- 1) Tabela nova com o schema final
CREATE TABLE forum_comentarios_new (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id      INTEGER NOT NULL,
    usuario_id   INTEGER NOT NULL,
    conteudo     TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'aprovado',
    editado_em   TEXT,
    deleted_at   TEXT,
    removido_por INTEGER,
    created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id)      REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)    ON DELETE RESTRICT,
    FOREIGN KEY (removido_por) REFERENCES usuarios(id)    ON DELETE SET NULL
);

-- 2) Copia dos dados existentes; conteudos NULL viram string vazia
--    (string vazia evita quebrar a constraint NOT NULL e fica visivel
--    para a moderacao revisar depois via WHERE conteudo = '').
INSERT INTO forum_comentarios_new (id, post_id, usuario_id, conteudo, status, created_at)
SELECT
    id,
    post_id,
    usuario_id,
    COALESCE(conteudo, '') AS conteudo,
    'aprovado'             AS status,
    created_at
FROM forum_comentarios;

-- 3) Substitui a tabela antiga
DROP TABLE forum_comentarios;
ALTER TABLE forum_comentarios_new RENAME TO forum_comentarios;

-- 4) Indices de leitura/moderacao
CREATE INDEX idx_forum_comentarios_post_id    ON forum_comentarios(post_id);
CREATE INDEX idx_forum_comentarios_usuario_id ON forum_comentarios(usuario_id);
CREATE INDEX idx_forum_comentarios_status     ON forum_comentarios(status);
CREATE INDEX idx_forum_comentarios_deleted_at ON forum_comentarios(deleted_at);

COMMIT;

PRAGMA foreign_keys = ON;
