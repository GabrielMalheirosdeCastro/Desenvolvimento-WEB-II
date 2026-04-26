# Ambiente de Produção — EasyPanel + VPS Hostinger

> Guia operacional consolidado da arquitetura de produção do **Site de Acolhimento FAESA**.
> Última atualização: 2026-04-26.

---

## 1. URLs e endereços

| Item | Valor |
|---|---|
| **URL pública da aplicação** | <https://acolhimento.faesa.gmcsistemas.com.br> |
| **EasyPanel (UI administrativa)** | <https://vps.gmcsistemas.com.br> |
| **API Supabase (Kong)** | <https://api.gmcsistemas.com.br> |
| **Studio Supabase** | <https://studio.gmcsistemas.com.br> (basic-auth) |
| **VPS Hostinger** | `vps.gmcsistemas.com.br` · `187.77.47.53` |
| **DNS** | Cloudflare (DNS-only, sem proxy) |

---

## 2. Servidor — fatos auditados (2026-04-26)

| Item | Valor |
|---|---|
| Sistema operacional | Ubuntu 24.04.4 LTS (Noble Numbat) |
| Kernel | Linux 6.8.0-110-generic |
| Hostname | `srv1620862` |
| CPU | AMD EPYC 9354P (2 vCPU, virt KVM) |
| RAM total | 7.8 GiB (≈ 3.8 GiB usados, 4.0 GiB disponíveis) |
| Disco raiz | 96 GB (17 GB usados — 18 %) |
| Docker | 29.4.1 (Engine Community) com Swarm ativo (1 manager) |
| Compose plugin | 5.1.3 |
| Buildx | 0.33.0 |
| Networks | `easypanel` (overlay swarm), `supabase_default` (bridge), `ingress` |

### Containers em execução

**EasyPanel:**

| Container | Imagem |
|---|---|
| `easypanel-traefik` | `traefik:3.6.7` |
| `easypanel` | `easypanel/easypanel:latest` |

**Supabase self-hosted (`/opt/supabase`, 13 containers):**

| Serviço | Imagem |
|---|---|
| `supabase-db` | `supabase/postgres:17.6.1.084` |
| `supabase-kong` | `kong/kong:3.9.1` |
| `supabase-auth` | `supabase/gotrue:v2.186.0` |
| `supabase-rest` | PostgREST |
| `realtime-dev.supabase-realtime` | `supabase/realtime:v2.76.5` |
| `supabase-storage` | Storage API |
| `supabase-edge-functions` | `supabase/edge-runtime:v1.71.2` |
| `supabase-studio` | Studio |
| `supabase-meta` | postgres-meta |
| `supabase-pooler` | Supavisor |
| `supabase-imgproxy` | `darthsim/imgproxy:v3.30.1` |
| `supabase-analytics` | `supabase/logflare:1.36.1` |
| `supabase-vector` | timberio/vector |

⚠️ **Aviso:** `supabase-analytics` opera próximo do limite de memória (≈ 500 / 512 MiB). Se houver OOM, aumentar limite no `/opt/supabase/docker-compose.override.yml`.

---

## 3. Arquitetura de rede

```
Internet (HTTPS)
        │
        ▼
Cloudflare DNS (DNS-only) ──→ 187.77.47.53
        │
        ▼
Traefik 3.6.7 (overlay `easypanel`, ports 80/443)
        │ HTTP→HTTPS redirect, Let's Encrypt automático
        │ routing por hostname:
        ├─▶ acolhimento.faesa.gmcsistemas.com.br ──→ container app (Express :3010 interno)
        ├─▶ api.gmcsistemas.com.br                ──→ supabase-kong:8000
        └─▶ studio.gmcsistemas.com.br             ──→ supabase-kong (basic-auth)
                                                       │
                                                       ▼
                                                supabase-kong (Kong 3.9.1)
                                                       │
                                                       ├─▶ supabase-auth, rest, realtime, storage, functions, studio
                                                       │
                                                       ▼
                                                supabase-pooler (:6543 transaction / :5432 session)
                                                       │
                                                       ▼
                                                supabase-db (PostgreSQL 17.6 — NÃO exposto)
```

A aplicação consome `supabase-pooler:6543` **internamente** pela overlay Docker. **Não há saída para internet** entre app e Postgres — latência sub-milissegundo.

---

## 4. Deploy

### 4.1 Configuração no EasyPanel (já provisionada)

| Campo | Valor |
|---|---|
| Projeto | `desenvolvimento_web` |
| Serviço | `acolhimento_faesa` |
| Fonte | GitHub `GabrielMalheirosdeCastro/Desenvolvimento-WEB-II` |
| Branch | `master` |
| Build path | `/` (raiz) |
| Construção | **Dockerfile** (`./Dockerfile`) |
| Domínio | `acolhimento.faesa.gmcsistemas.com.br` (Traefik com Let's Encrypt) |

### 4.2 Webhook (gatilho de implantação)

**URL:** `POST https://vps.gmcsistemas.com.br/api/deploy/3144cfe...e306ebbf` (token completo no `.env` local e no GitHub Secret).

**Tratar como segredo.** Quem possuir o token pode disparar redeploys arbitrários.

### 4.3 Mecanismos disponíveis

| # | Forma | Uso típico |
|---|---|---|
| 1 | `git push origin master` | Fluxo padrão. GitHub Action [`deploy.yml`](../.github/workflows/deploy.yml) chama o webhook automaticamente. |
| 2 | `npm run deploy` | Disparo manual a partir da estação dev. |
| 3 | `./scripts/deploy.sh` | Mesmo, em bash. |
| 4 | VS Code task **Deploy: trigger EasyPanel webhook** | Pelo Command Palette ▸ *Tasks: Run Task*. |
| 5 | `curl -fsS -X POST "$EASYPANEL_DEPLOY_WEBHOOK"` | Fallback de emergência. |

### 4.4 Fluxo de deploy

```
git push origin master
        │
        ▼
GitHub Action `Deploy to EasyPanel`
        │  POST  https://vps.gmcsistemas.com.br/api/deploy/<token>
        ▼
EasyPanel
        │  1. git fetch master
        │  2. docker build -f Dockerfile .
        │  3. cria nova revisão do serviço Swarm
        │  4. Traefik faz rolling update (zero downtime)
        ▼
https://acolhimento.faesa.gmcsistemas.com.br (HTTP 200)
```

---

## 5. Runbook operacional

### 5.1 Validar saúde da app

```bash
curl -fsS https://acolhimento.faesa.gmcsistemas.com.br/healthz | jq
# Esperado: {"status":"ok","service":"site-acolhimento-faesa","version":"X.Y.Z",...}
```

### 5.2 Inspecionar logs via SSH

```bash
ssh root@vps.gmcsistemas.com.br
# Identificar nome do container EasyPanel:
docker ps --format '{{.Names}}' | grep -i acolhimento
# Logs em tempo real:
docker logs -f <container>
```

> Pela UI do EasyPanel: serviço *acolhimento_faesa* ▸ aba **Logs**.

### 5.3 Forçar rebuild

- **Via painel:** botão **Implantar** no serviço.
- **Via webhook:** `npm run deploy` (após commit).
- **Via SSH (último recurso):** `docker service update --force <stack>_acolhimento_faesa`.

### 5.4 Restart do banco

```bash
ssh root@vps.gmcsistemas.com.br
cd /opt/supabase && ./dc restart db
```

> Restart do Postgres derruba conexões abertas; o Supavisor reconecta automaticamente.

### 5.5 Backup do banco

Procedimento documentado em `/opt/supabase/.../DEPLOY-EXECUTADO-2026-04.md` §5.3:

```bash
mkdir -p /opt/backups/supabase
docker exec supabase-db pg_dumpall -U postgres -c \
    | gzip > /opt/backups/supabase/dump_$(date +%F_%H%M).sql.gz
```

---

## 6. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| HTTP 502 / 504 no domínio | App caída ou crash-loop | `docker logs <container>` na UI EasyPanel; verificar `npm run docker:run` localmente |
| HTTP 404 no domínio | Roteamento Traefik não bateu hostname | Verificar configuração de domínio no EasyPanel (UI) |
| Cert TLS inválido | Let's Encrypt rate-limit ou DNS errado | `dig +short acolhimento.faesa.gmcsistemas.com.br` deve retornar `187.77.47.53` |
| App sobe mas não conecta no DB | Container fora da overlay `easypanel` | EasyPanel ▸ serviço ▸ **Networks** ▸ adicionar `easypanel` |
| Build do Dockerfile falha | `package-lock.json` ausente / Node version | Rodar `docker build .` localmente para diagnosticar |
| Webhook retorna 401/403 | Token revogado ou mudou | Regerar webhook no EasyPanel e atualizar GitHub Secret |
| GitHub Action “secret missing” | Secret não cadastrado | Settings ▸ Secrets ▸ Actions ▸ `EASYPANEL_DEPLOY_WEBHOOK` |
| Postgres com `too many connections` | App não usa o pooler | Confirmar `DATABASE_URL` aponta para `supabase-pooler:6543`, não `supabase-db:5432` |

---

## 7. Limites e próximos passos

### Capacidade atual (2026-04-26)

- **RAM disponível:** ≈ 4.0 GiB livres → cabe ≈ 4–6 containers leves adicionais.
- **Disco:** 79 GB livres.
- **CPU:** carga média 0.55–0.59 (uso confortável em 2 vCPU).

### Próximos passos sugeridos (fora do escopo deste deploy inicial)

1. **Monitoria** — Uptime Kuma probando `/healthz` da app + `/auth/v1/health` do Supabase, alertas Telegram/email.
2. **Backup off-host** — replicar `/opt/backups/supabase/` para Backblaze B2 ou Hetzner Storage Box (regra 3-2-1).
3. **Snapshot Hostinger** — antes de upgrades maiores (PG 17 → 18).
4. **fail2ban** + 2FA SSH (atualmente: chave SSH only).
5. **Aumentar limite de RAM** do `supabase-analytics` (97% utilizado).
6. **Cloudflare proxied** (laranja) opcional para WAF/CDN, depois de validar todas integrações.

---

## 8. Referências

- [`/root/projects/postgres17-supabase-easypanel/docs/DEPLOY-EXECUTADO-2026-04.md`](../../postgres17-supabase-easypanel/docs/DEPLOY-EXECUTADO-2026-04.md) — fonte da verdade da stack Supabase.
- [`Dockerfile`](../Dockerfile) — imagem da aplicação.
- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — pipeline CI.
- [`scripts/deploy.mjs`](../scripts/deploy.mjs) e [`scripts/deploy.sh`](../scripts/deploy.sh) — disparo manual.
- [`docs/setup-desenvolvimento-windows.md`](setup-desenvolvimento-windows.md) — setup local no Windows 11.
