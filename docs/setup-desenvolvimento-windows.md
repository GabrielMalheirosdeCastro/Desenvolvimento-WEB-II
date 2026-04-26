# Setup de Desenvolvimento — Windows 11

> Guia para preparar a estação de trabalho (Windows 11, sem Postgres local) para
> trabalhar no projeto **Site de Acolhimento FAESA**.
>
> **Decisão arquitetural:** o **mesmo banco de dados da VPS** é utilizado para
> desenvolvimento e produção. Não há Postgres local. O acesso ao banco da VPS é feito
> via **túnel SSH** (porta 5432 não está exposta na internet).

---

## 1. Pré-requisitos

| Software | Versão mínima | Como instalar |
|---|---|---|
| **Git** | 2.40+ | <https://git-scm.com/download/win> ou `winget install Git.Git` |
| **Node.js LTS** | 20.x | <https://nodejs.org/> (versão LTS) ou `winget install OpenJS.NodeJS.LTS` |
| **OpenSSH Client** | (Windows 10/11 nativo) | *Configurações ▸ Aplicativos ▸ Recursos opcionais ▸ Cliente OpenSSH* |
| **Docker Desktop** *(opcional)* | 4.x | Para validar o `Dockerfile` localmente antes de fazer push |
| **VS Code** | atual | <https://code.visualstudio.com/> |
| **PowerShell** | 7+ | Já vem no Windows 11 (`pwsh`) |

Confirme as versões:

```powershell
git --version
node --version            # deve mostrar v20.x.x
npm --version
ssh -V
docker --version          # opcional
```

---

## 2. Clonar o repositório

```powershell
cd $HOME\Documents
git clone https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II.git
cd Desenvolvimento-WEB-II
```

---

## 3. Instalar dependências

```powershell
npm install
```

> A app atual contém apenas `express` como dependência de runtime. O subprojeto
> `banco-dados-requisitos-projeto/` tem suas próprias deps Prisma — **não as instale agora**;
> elas só são necessárias quando o desenvolvimento da aplicação real começar.

---

## 4. Configurar o `.env` local

```powershell
Copy-Item .env.example .env
```

Edite `.env` e preencha pelo menos:

```dotenv
# Token do webhook EasyPanel (obtenha em vps.gmcsistemas.com.br ▸ serviço ▸ Implantações ▸ Gatilho)
EASYPANEL_DEPLOY_WEBHOOK=https://vps.gmcsistemas.com.br/api/deploy/<TOKEN>
```

> **NUNCA** comite o `.env`. Ele já está no `.gitignore`.

---

## 5. Acesso ao banco da VPS — túnel SSH

A porta 5432 do Postgres **não está exposta publicamente** (decisão de segurança). Para acessar o banco do Windows, abra um túnel SSH antes de iniciar o desenvolvimento:

### 5.1 Configurar chave SSH (uma vez só)

```powershell
# Gerar par de chaves se ainda não tiver
ssh-keygen -t ed25519 -C "gabriel.castro@dev-windows"

# Copiar chave pública para a VPS (pedirá a senha root uma única vez)
type $HOME\.ssh\id_ed25519.pub | ssh root@vps.gmcsistemas.com.br "cat >> ~/.ssh/authorized_keys"
```

Teste:

```powershell
ssh root@vps.gmcsistemas.com.br "echo conectado em \$(hostname)"
```

### 5.2 Abrir o túnel (a cada sessão de desenvolvimento)

```powershell
pwsh ./scripts/dev-tunnel.ps1
```

O script mantém abertos:

| Localhost | Destino na VPS | Uso |
|---|---|---|
| `localhost:5432` | `supabase-db:5432` | `DIRECT_URL` (migrations Prisma) |
| `localhost:6543` | `supabase-pooler:6543` | `DATABASE_URL` (queries em runtime) |

Mantenha esse terminal aberto. **Em outro terminal**, prossiga para o próximo passo.

### 5.3 Conectar do app/Prisma

Quando o desenvolvimento da aplicação real começar, configure no `.env`:

```dotenv
DATABASE_URL=postgresql://postgres.gmc:SENHA@localhost:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:SENHA@localhost:5432/postgres
```

> A senha está em `/root/SUPABASE-CREDENTIALS.txt` na VPS (chmod 600). Ver
> `docs/ambiente-producao-easypanel.md` §1.

### 5.4 Conectar do DBeaver / pgAdmin

Configure uma conexão Postgres apontando para `localhost:5432` (ou `:6543` para usar o pooler) — não use SSH dentro do DBeaver, o túnel já está aberto pelo PowerShell.

---

## 6. Rodar a aplicação localmente

### 6.1 Servidor Express direto (recomendado para esta fase)

```powershell
npm run dev    # hot-reload (node --watch)
# ou
npm start
```

Acesse:

- <http://localhost:3010> — página *Em Construção*
- <http://localhost:3010/healthz> — JSON de status
- <http://localhost:3010/version> — JSON com versão

### 6.2 Validar a imagem Docker (opcional)

Útil antes de fazer push para garantir que o build funciona igual ao do EasyPanel.

```powershell
npm run docker:build
npm run docker:run
# Em outro terminal:
curl http://localhost:3010/healthz
```

---

## 7. Disparar deploy manualmente

```powershell
npm run deploy
```

Saída esperada:

```
[deploy] disparando webhook EasyPanel → https://vps.gmcsistemas.com.br/api/deploy/<redacted>
[deploy] OK · HTTP 200 · 412 ms
```

Acompanhe o build na UI do EasyPanel: <https://vps.gmcsistemas.com.br>.

---

## 8. Fluxo de trabalho recomendado

1. Criar branch local: `git checkout -b feat/minha-mudanca`.
2. Editar código.
3. (Se mexeu em código de app) `npm run dev` para validar.
4. (Opcional) `npm run docker:build` para validar o Dockerfile.
5. Commit seguindo *Conventional Commits* (ver `.github/copilot-instructions.md` §9).
6. Abrir PR para `master`.
7. Merge → GitHub Action dispara o webhook do EasyPanel automaticamente.
8. Aguardar ≈ 60–120 s e validar em <https://acolhimento.faesa.gmcsistemas.com.br/healthz>.

> Para o documento `.tex`: a edição **continua sendo feita no Overleaf**, conforme
> `.github/copilot-instructions.md` §0.1 e §2.1. Sincronize o Overleaf com o GitHub via
> integração nativa.

---

## 9. Problemas comuns

| Sintoma | Solução |
|---|---|
| `ssh: connect: Connection refused` | Verificar se a VPS está online; testar `ping vps.gmcsistemas.com.br` |
| Túnel cai sozinho | Aumentar `ServerAliveInterval` no `~/.ssh/config` ou re-rodar `dev-tunnel.ps1` |
| Permission denied (publickey) | Chave SSH não está em `~/.ssh/authorized_keys` da VPS — repetir §5.1 |
| Prisma falha em `migrate dev` | `DIRECT_URL` deve apontar para `localhost:5432` (não `:6543`) |
| `npm run dev` não recarrega | Node.js < 20.6 — atualizar para LTS atual |
| Docker Desktop não inicia (WSL2) | `wsl --update` no PowerShell admin |

---

## 10. Referências

- [`README.md`](../README.md) — visão geral do projeto.
- [`docs/ambiente-producao-easypanel.md`](ambiente-producao-easypanel.md) — produção.
- [`docs/relatorio-tecnologias-banco-persistencia.md`](relatorio-tecnologias-banco-persistencia.md) §2 — decisão sobre o banco.
- [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) — diretrizes do Copilot.
