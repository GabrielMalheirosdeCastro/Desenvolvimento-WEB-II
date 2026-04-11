from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "dev.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"
EXPECTED_TABLE_COUNT = 33


def apply_schema(conn: sqlite3.Connection) -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn.executescript(schema_sql)
    conn.commit()


def validate_table_count(conn: sqlite3.Connection) -> None:
    row = conn.execute(
        """
        SELECT COUNT(*)
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        """
    ).fetchone()
    table_count = int(row[0]) if row else 0
    if table_count != EXPECTED_TABLE_COUNT:
        raise RuntimeError(
            f"Schema incompleto: esperado {EXPECTED_TABLE_COUNT} tabelas, obtido {table_count}."
        )
    print(f"\nSchema validado: {table_count} tabelas criadas.")


def seed_data(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        INSERT INTO instituicoes_faesa (codigo, nome, campus, ativo)
        VALUES ('FAESA-VIX', 'FAESA Campus Vitoria', 'Vitoria', 1);

        INSERT INTO cursos (instituicao_id, codigo, nome, nivel, ativo)
        VALUES (1, 'SI', 'Sistemas de Informacao', 'Graduacao', 1);

        INSERT INTO turmas (curso_id, codigo, ano, semestre, turno, status)
        VALUES (1, 'SI-2026-1N', 2026, 1, 'Noturno', 'Ativa');

        INSERT INTO disciplinas (codigo, nome, carga_horaria, ativa)
        VALUES ('D001508', 'Desenvolvimento de Aplicacoes Web II', 80, 1);

        INSERT INTO turma_disciplinas (turma_id, disciplina_id, ano, semestre, professor_responsavel)
        VALUES (1, 1, 2026, 1, 'Docente Responsavel');

        INSERT INTO usuarios (matricula_institucional, email_institucional, nome, tipo_usuario, data_nascimento)
        VALUES ('202612345', 'gabriel@faesa.br', 'Gabriel Malheiros de Castro', 'ALUNO', '2000-01-01');

        INSERT INTO matriculas_academicas (usuario_id, turma_id, numero_matricula, periodo_atual, cra, status, data_ingresso)
        VALUES (1, 1, 'MATR-2026-001', 3, 8.75, 'ATIVA', '2026-02-01');

        INSERT INTO disciplinas_cursadas (matricula_id, turma_disciplina_id, frequencia_percentual, media_final, situacao)
        VALUES (1, 1, 92.5, 8.8, 'APROVADO');

        INSERT INTO avaliacoes_disciplina (disciplina_cursada_id, tipo, descricao, nota, peso, data_avaliacao)
        VALUES (1, 'PROVA', 'Prova 1', 8.5, 0.4, '2026-03-10');

        INSERT INTO chatbot_conversas (usuario_id, faixa_etaria, canal, status, iniciou_em)
        VALUES (1, '18-24', 'WEB', 'ENCERRADA', '2026-03-20 19:30:00');

        INSERT INTO chatbot_mensagens (conversa_id, usuario_id, origem, conteudo, intencao, sentimento, data_envio)
        VALUES
            (1, 1, 'USUARIO', 'Estou com dificuldade para organizar estudos', 'ORGANIZACAO_ESTUDOS', 'ANSIOSO', '2026-03-20 19:31:00'),
            (1, NULL, 'BOT', 'Vamos montar um plano semanal com metas pequenas.', 'SUGESTAO_PLANO', 'NEUTRO', '2026-03-20 19:31:10');

        INSERT INTO consentimentos_lgpd (usuario_id, finalidade, versao_termo, consentiu, ip_origem, user_agent, data_consentimento)
        VALUES (1, 'ANALISE_DE_DESEMPENHO', 'v1.0', 1, '127.0.0.1', 'LocalLab', '2026-03-20 19:00:00');

        INSERT INTO relatorios_anonimizados (tipo_relatorio, periodo_inicio, periodo_fim, dimensao, valor_agregado, total_registros, gerado_em)
        VALUES ('DESEMPENHO', '2026-03-01', '2026-03-31', 'TURMA', 8.42, 1, '2026-03-31 23:59:00');

        INSERT INTO auditoria_dados (usuario_id, relatorio_id, ator, acao, entidade, entidade_id, base_legal, finalidade, data_evento)
        VALUES (1, 1, 'SISTEMA', 'GERAR_RELATORIO', 'relatorios_anonimizados', 1, 'CONSENTIMENTO', 'ANALISE_DE_DESEMPENHO', '2026-03-31 23:59:01');
        """
    )
    conn.commit()


def print_demo_queries(conn: sqlite3.Connection) -> None:
    print("\n=== Consulta 1: aluno, disciplina e nota ===")
    for row in conn.execute(
        """
        SELECT u.nome, d.nome, ad.nota, dc.situacao
        FROM usuarios u
        JOIN matriculas_academicas ma ON ma.usuario_id = u.id
        JOIN disciplinas_cursadas dc ON dc.matricula_id = ma.id
        JOIN turma_disciplinas td ON td.id = dc.turma_disciplina_id
        JOIN disciplinas d ON d.id = td.disciplina_id
        JOIN avaliacoes_disciplina ad ON ad.disciplina_cursada_id = dc.id
        ORDER BY ad.id DESC
        """
    ):
        print(row)

    print("\n=== Consulta 2: trilha de auditoria LGPD ===")
    for row in conn.execute(
        """
        SELECT u.nome, c.finalidade, a.acao, a.data_evento
        FROM auditoria_dados a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN consentimentos_lgpd c ON c.usuario_id = u.id
        ORDER BY a.id DESC
        """
    ):
        print(row)


if __name__ == "__main__":
    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as connection:
        apply_schema(connection)
        validate_table_count(connection)
        seed_data(connection)
        print_demo_queries(connection)

    print(f"\nBanco temporario criado em: {DB_PATH}")
