#!/bin/bash
# ============================================================
# Self-check de disponibilidade — Site de Acolhimento FAESA (D4 / RNF05).
# ------------------------------------------------------------
# RODA NA PROPRIA VPS (cron), NAO nos runners do GitHub. Motivo: o caminho
# de rede GitHub(Azure) -> VPS Hostinger sofre filtragem intermitente de
# faixas de IP, gerando connect-timeout (curl rc=28) mesmo com a aplicacao
# 100% no ar. De dentro da VPS o caminho e confiavel e valida Traefik + TLS
# + app de ponta a ponta, batendo na URL publica.
#
# PONTOS CRITICOS RESPEITADOS:
#   - NAO toca em containers do EasyPanel/Docker Swarm nem no banco.
#   - Vive em /opt/uptime-faesa (fora do fluxo Docker): nao entra na imagem,
#     nao dispara redeploy, nao interfere no EasyPanel.
#   - Idempotente e reversivel (basta remover o crontab + o diretorio).
#
# INSTALACAO (uma vez, na VPS):
#   mkdir -p /opt/uptime-faesa
#   # copie este arquivo para /opt/uptime-faesa/check.sh e de chmod +x
#   ( crontab -l 2>/dev/null | grep -v 'uptime-faesa/check.sh' ; \
#     echo '*/5 * * * * /opt/uptime-faesa/check.sh' ) | crontab -
# ============================================================
set -uo pipefail

BASE_URL="${BASE_URL:-https://acolhimento.faesa.gmcsistemas.com.br}"
LOG_DIR="/opt/uptime-faesa"
LOG_FILE="$LOG_DIR/uptime.log"
MAX_LINES=20000               # rotacao simples: mantem o log enxuto
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$LOG_DIR"

# /healthz — espera HTTP 200 e corpo com "status":"ok".
H_BODY="$(curl -fsS --connect-timeout 10 --max-time 20 \
  -H 'User-Agent: vps-uptime-self-check/1.0' \
  -w $'\n%{http_code} %{time_total}' "$BASE_URL/healthz" 2>/dev/null)"
H_RC=$?
H_TAIL="$(printf '%s' "$H_BODY" | tail -n1)"
H_CODE="$(printf '%s' "$H_TAIL" | awk '{print $1}')"
H_TIME="$(printf '%s' "$H_TAIL" | awk '{print $2}')"
H_PAYLOAD="$(printf '%s' "$H_BODY" | sed '$d')"

# /version — espera HTTP 200 e campo "version".
V_TAIL="$(curl -fsS --connect-timeout 10 --max-time 20 \
  -H 'User-Agent: vps-uptime-self-check/1.0' \
  -w $'\n%{http_code}' "$BASE_URL/version" 2>/dev/null | tail -n1)"
V_RC=$?
V_CODE="$(printf '%s' "$V_TAIL" | awk '{print $1}')"

STATUS="OK"
if [ "$H_RC" -ne 0 ] || [ "$H_CODE" != "200" ] || ! printf '%s' "$H_PAYLOAD" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  STATUS="FAIL_HEALTHZ"
elif [ "$V_RC" -ne 0 ] || [ "$V_CODE" != "200" ]; then
  STATUS="FAIL_VERSION"
fi

echo "$TS status=$STATUS healthz_rc=$H_RC healthz_http=$H_CODE healthz_time=${H_TIME}s version_rc=$V_RC version_http=$V_CODE" >> "$LOG_FILE"

# Rotacao: se passar de MAX_LINES, mantem apenas a cauda.
LINES="$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)"
if [ "$LINES" -gt "$MAX_LINES" ]; then
  tail -n "$MAX_LINES" "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

[ "$STATUS" = "OK" ] && exit 0 || exit 1
