# syntax=docker/dockerfile:1.7
# ============================================================
# Site de Acolhimento FAESA — imagem multi-stage para EasyPanel.
# Estagio 1: builda a SPA Vite (apps/web) com todas as devDeps.
# Estagio 2: imagem final com node:20-alpine + apenas API + dist.
# ============================================================

# ---------- Estagio 1: build da SPA ----------
FROM node:20-alpine AS web-build

WORKDIR /repo

ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# Copia manifestos para aproveitar cache de instalacao.
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/db/package.json ./packages/db/package.json

# Instala dependencias completas apenas do workspace web (inclui devDeps).
RUN npm ci --include-workspace-root --workspace @site-acolhimento/web

# Copia o codigo da SPA e builda.
COPY apps/web ./apps/web
RUN npm run build -w @site-acolhimento/web

# ---------- Estagio 2: runtime ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3010 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /app

# Manifestos + lockfile para instalacao reprodutivel da API.
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
RUN if [ -f package-lock.json ]; then \
            npm ci --omit=dev --workspace @site-acolhimento/api --include-workspace-root; \
        else \
            npm install --omit=dev --workspace @site-acolhimento/api --include-workspace-root --no-package-lock; \
        fi

# Codigo da API.
COPY apps/api ./apps/api

# Artefato buildado da SPA.
COPY --from=web-build /repo/apps/web/dist ./apps/web/dist

# Usuario nao-root.
RUN chown -R node:node /app
USER node

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3010)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/server.js"]


