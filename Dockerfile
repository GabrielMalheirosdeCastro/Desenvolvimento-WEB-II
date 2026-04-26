# syntax=docker/dockerfile:1.7
# ============================================================
# Site de Acolhimento FAESA — imagem para EasyPanel
# Estágio único, baseado em node:20-alpine (≈ 50 MB final).
# ============================================================
FROM node:20-alpine AS base

ENV NODE_ENV=production \
    PORT=3010 \
    HOST=0.0.0.0 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /app

# 1) Instala dependências (camada cacheável).
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
            npm ci --omit=dev; \
        else \
            npm install --omit=dev --no-package-lock; \
        fi

# 2) Copia código da aplicação.
COPY server.js ./
COPY public ./public

# 3) Reduz superfície: usuário não-root (já existe na imagem oficial).
RUN chown -R node:node /app
USER node

EXPOSE 3010

# Healthcheck nativo do Docker (EasyPanel/Swarm honram).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3010)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
