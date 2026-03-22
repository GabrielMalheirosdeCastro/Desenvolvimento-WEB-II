# Modelagem Conceitual e Banco de Dados para Aplicações Web

> Do minimundo ao banco de dados — o caminho completo para persistir dados na sua aplicação

## Introdução

Prezados alunos,

Antes de escrever uma única linha de código no back-end, precisamos responder a uma pergunta fundamental: **quais dados a nossa aplicação precisa armazenar e como eles se relacionam?** Essa resposta vem da **modelagem conceitual** — uma etapa de projeto que antecede (e orienta) toda a implementação do banco de dados e do código que o acessa.

---

## 1. Definição do Minimundo

Todo sistema de software opera sobre um **recorte da realidade** — o chamado **minimundo** (ou universo de discurso). Trata-se da parcela do mundo real que o sistema precisa representar.

### Exemplo Prático

Se o seu projeto é um sistema de agendamento de barbearia, o minimundo inclui: clientes, barbeiros, serviços oferecidos, horários disponíveis, agendamentos realizados, avaliações. Não inclui, por exemplo, o estoque de produtos — a menos que isso faça parte do escopo do projeto.

### Como definir o minimundo do seu projeto

- Releia a **especificação de requisitos** que vocês já entregaram na Fase 1
- Identifique todos os **substantivos** relevantes — eles provavelmente são entidades ou atributos
- Identifique os **verbos** — eles indicam relações e ações entre entidades
- Pergunte-se: *"Que informações o sistema precisa guardar para funcionar?"*

---

## 2. Diagrama Entidade-Relacionamento (DER)

O **Diagrama Entidade-Relacionamento** (DER) é a ferramenta visual que usamos para representar o minimundo de forma estruturada. Ele foi proposto por Peter Chen em 1976 e continua sendo a base da modelagem de dados.

### Conceitos Fundamentais

| Conceito | O que é | Exemplo |
|----------|---------|---------|
| **Entidade** | Um "objeto" do mundo real que queremos representar | Usuário, Produto, Pedido, Categoria |
| **Atributo** | Uma propriedade/característica de uma entidade | nome, email, preço, data_criacao |
| **Chave primária** | Atributo que identifica unicamente cada registro | id, cpf, código |
| **Relacionamento** | Associação entre duas ou mais entidades | Usuário *realiza* Pedido |
| **Cardinalidade** | Quantidade de ocorrências no relacionamento | 1:1, 1:N, N:M |

### Cardinalidades na Prática

- **1:1 (um para um)** — Ex: cada usuário tem exatamente um perfil
- **1:N (um para muitos)** — Ex: um usuário pode ter vários pedidos, mas cada pedido pertence a um usuário
- **N:M (muitos para muitos)** — Ex: um pedido pode ter vários produtos, e um produto pode estar em vários pedidos (requer tabela intermediária)

> **Dica:** Ferramentas gratuitas para criar DER: **dbdiagram.io**, **draw.io** (diagrams.net), **Lucidchart** (versão free), **ERDPlus**. Qualquer uma dessas é adequada para o projeto.

---

## 3. Do DER ao Modelo Relacional

Depois de criar o DER, o próximo passo é **mapear** o diagrama para o **modelo relacional** (tabelas). Esse processo segue regras bem definidas:

| No DER | No Modelo Relacional |
|--------|----------------------|
| Entidade | Vira uma **tabela** |
| Atributo | Vira uma **coluna** da tabela |
| Chave primária | Vira a **PRIMARY KEY** da tabela |
| Relacionamento 1:N | **Chave estrangeira** (FOREIGN KEY) na tabela do lado N |
| Relacionamento N:M | Cria uma **tabela intermediária** com chaves estrangeiras para ambas |

### Exemplo de Mapeamento

**Entidades:** Usuário, Postagem, Comentário

**Relacionamentos:**
- Usuário (1) — publica — (N) Postagem
- Usuário (1) — escreve — (N) Comentário
- Postagem (1) — recebe — (N) Comentário

**Tabelas resultantes:**
```
usuarios (id, nome, email, senha_hash, criado_em)
postagens (id, titulo, conteudo, usuario_id, criado_em)
comentarios (id, texto, usuario_id, postagem_id, criado_em)
```

---

## 4. DDL — Criando as Tabelas com SQL

A **DDL (Data Definition Language)** é a parte do SQL usada para **criar, alterar e excluir** estruturas no banco de dados. Os principais comandos são:

- **CREATE TABLE** — cria uma tabela
- **ALTER TABLE** — altera a estrutura de uma tabela existente
- **DROP TABLE** — remove uma tabela

### Exemplo de DDL (PostgreSQL)

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE postagens (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  conteudo TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Escolhendo o Banco de Dados

Uma das decisões mais importantes do projeto é: **qual banco de dados usar?** Existem duas grandes famílias:

| Aspecto | SQL (Relacional) | NoSQL (Não-Relacional) |
|---------|------------------|------------------------|
| **Estrutura** | Tabelas com linhas e colunas, esquema rígido | Documentos, chave-valor, grafos — esquema flexível |
| **Exemplos** | PostgreSQL, MySQL, SQLite | MongoDB, Redis, Firebase |
| **Quando usar** | Dados estruturados, relacionamentos complexos, consistência forte (ACID) | Dados semi-estruturados, alta escalabilidade, prototipação rápida |
| **No projeto** | Recomendado para a maioria dos projetos da disciplina | Possível, mas exige justificativa técnica |

### Recomendação para o projeto semestral

Se vocês fizeram um DER com entidades e relacionamentos bem definidos, o caminho natural é um banco **relacional** (PostgreSQL ou MySQL). Se o projeto envolve dados muito flexíveis ou em tempo real (ex: chat, feeds), o MongoDB pode ser uma boa escolha.

---

## 6. Criando o Banco de Dados na Prática

Após definir o modelo, é hora de **criar o banco de dados de verdade**. O fluxo típico em um projeto web:

1. **Instalar o SGBD** — localmente (Docker é recomendado) ou usar um serviço na nuvem (Supabase, Neon, Railway, ElephantSQL)
2. **Criar o banco** — `CREATE DATABASE meu_projeto;`
3. **Executar a DDL** — rodar os scripts SQL para criar tabelas e constraints
4. **Configurar a conexão** — string de conexão no back-end (variável de ambiente!)
5. **Popular com dados de teste** — seed data para facilitar o desenvolvimento

### Exemplo de string de conexão

```env
# PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/meu_projeto

# MongoDB
MONGODB_URI=mongodb://localhost:27017/meu_projeto
```

> **⚠️ Nunca coloque credenciais diretamente no código!** Use variáveis de ambiente (`.env`) e adicione o arquivo `.env` ao `.gitignore`. Isso é uma prática fundamental de segurança.

---

## 7. ORMs — Mapeamento Objeto-Relacional

Um **ORM (Object-Relational Mapping)** é uma biblioteca que permite interagir com o banco de dados usando **objetos e métodos** da linguagem de programação, em vez de escrever SQL puro. Ele faz a "tradução" entre o mundo orientado a objetos (código) e o mundo relacional (banco).

### Principais ORMs para Node.js

| ORM | Banco | Característica |
|-----|-------|-----------------|
| **Prisma** | PostgreSQL, MySQL, SQLite, MongoDB | Moderno, type-safe, migrations automáticas, excelente DX |
| **Sequelize** | PostgreSQL, MySQL, SQLite | Maduro, amplamente usado, bastante documentação |
| **Knex.js** | PostgreSQL, MySQL, SQLite | Query builder (não é ORM completo), mais controle sobre SQL |
| **Mongoose** | MongoDB | ODM (Object-Document Mapping) para MongoDB, schemas flexíveis |

### Exemplo: Prisma vs SQL Puro

```javascript
// SQL Puro
const result = await pool.query(
  'SELECT * FROM usuarios WHERE email = $1', [email]
);

// Com Prisma
const user = await prisma.usuario.findUnique({
  where: { email: email }
});
```

### Vantagens e Desvantagens dos ORMs

| Vantagens | Desvantagens |
|-----------|--------------|
| Produtividade — menos código SQL manual | Abstração pode esconder queries ineficientes |
| Migrations — controle de versão do schema | Curva de aprendizado adicional |
| Segurança — proteção contra SQL Injection | Queries complexas podem ser difíceis de expressar |
| Portabilidade — trocar de banco com menos impacto | Overhead de desempenho em operações pesadas |

---

## O Fluxo Completo: Do Minimundo ao Código

```
Minimundo → DER → Modelo Relacional → DDL / ORM → Aplicação
 (Domínio) (Modelar) (Tabelas) (Implementar) (Usar no código)
```

**Fluxo visual:**
1. **Minimundo** — Entender o domínio do sistema
2. **DER** — Modelar entidades e relacionamentos
3. **Modelo Relacional** — Definir tabelas e suas relações
4. **DDL / ORM** — Implementar no banco de dados
5. **Aplicação** — Usar no código através de SQL ou ORM
