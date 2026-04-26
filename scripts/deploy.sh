#!/usr/bin/env bash
# ============================================================
# scripts/deploy.sh
# Equivalente bash do scripts/deploy.mjs.
# Uso: ./scripts/deploy.sh   (lê EASYPANEL_DEPLOY_WEBHOOK do .env)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Carrega .env (não falha se ausente).
if [[ -f "${ROOT}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT}/.env"
    set +a
fi
if [[ -f "${ROOT}/.env.local" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT}/.env.local"
    set +a
fi

WEBHOOK="${EASYPANEL_DEPLOY_WEBHOOK:-}"

if [[ -z "${WEBHOOK}" || "${WEBHOOK}" == *REPLACE_ME* ]]; then
    echo "[deploy] ERRO: EASYPANEL_DEPLOY_WEBHOOK não configurado." >&2
    echo "[deploy] Defina em .env ou como variável de ambiente." >&2
    exit 1
fi

echo "[deploy] disparando webhook EasyPanel..."
HTTP_CODE=$(curl -fsS -o /tmp/deploy-response.$$ -w '%{http_code}' \
    -X POST \
    -H 'User-Agent: site-acolhimento-faesa-deploy/0.4.0' \
    "${WEBHOOK}") || {
        rc=$?
        echo "[deploy] FALHA na requisição (curl exit ${rc})" >&2
        rm -f /tmp/deploy-response.$$
        exit 2
}

BODY="$(cat /tmp/deploy-response.$$ 2>/dev/null || true)"
rm -f /tmp/deploy-response.$$

echo "[deploy] OK · HTTP ${HTTP_CODE}"
if [[ -n "${BODY}" ]]; then
    echo "[deploy] resposta: ${BODY:0:500}"
fi
echo "[deploy] Acompanhe o build em: https://vps.gmcsistemas.com.br"
