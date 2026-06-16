# syntax=docker/dockerfile:1.7
# ============================================================
# Site de Acolhimento FAESA — imagem single-stage para EasyPanel.
# ------------------------------------------------------------
# Decisao 2026-05-03 (em vigor ate v1.30.0): o build do Vite falhava
# silenciosamente no EasyPanel/VPS (provavelmente OOM no estagio
# web-build com multi-stage). Estrategia adotada: o `apps/web/dist/`
# e gerado localmente (`npm run build`) e VERSIONADO no Git, sendo
# RECONSTRUIDO a cada release antes do commit/deploy. O Dockerfile
# apenas instala a API (sem devDependencies) e copia o dist pronto.
# Imagem version-agnostica: nao requer alteracao a cada bump de
# versao. Trade-off academico aceitavel para um prototipo em VPS
# apertada (a VPS tem 4 GiB de swap para mitigar OOM residual).
# ============================================================
FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=3010 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /app

# 1) Manifestos para cache de instalacao da API.
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
RUN if [ -f package-lock.json ]; then \
            npm ci --omit=dev --workspace @site-acolhimento/api --include-workspace-root; \
        else \
            npm install --omit=dev --workspace @site-acolhimento/api --include-workspace-root --no-package-lock; \
        fi

# 2) Codigo da API.
COPY apps/api ./apps/api

# 3) Build pre-gerado da SPA (versionado no repo).
COPY apps/web/dist ./apps/web/dist

# 4) Usuario nao-root.
RUN chown -R node:node /app
USER node

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3010)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/server.js"]



