# syntax=docker/dockerfile:1.7
# ============================================================
# Site de Acolhimento FAESA — imagem para EasyPanel (monorepo)
# Base node:20-alpine; instala apenas o workspace apps/api
# (a SPA web sera integrada em sprint posterior).
# ============================================================
FROM node:20-alpine AS base

ENV NODE_ENV=production \
    PORT=3010 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /app

# 1) Manifesto raiz + manifesto do workspace api (camada cacheavel).
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
RUN if [ -f package-lock.json ]; then \
            npm ci --omit=dev --workspace @site-acolhimento/api --include-workspace-root; \
        else \
            npm install --omit=dev --workspace @site-acolhimento/api --include-workspace-root --no-package-lock; \
        fi

# 2) Codigo da aplicacao.
COPY apps/api ./apps/api

# 3) Usuario nao-root.
RUN chown -R node:node /app
USER node

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3010)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/server.js"]

