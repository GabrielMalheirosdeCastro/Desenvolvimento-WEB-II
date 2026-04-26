// ============================================================
// Site de Acolhimento FAESA — servidor minimalista (Em Construção)
// ------------------------------------------------------------
// Objetivo: validar o pipeline GitHub → EasyPanel → Traefik → HTTPS.
// NÃO conecta ao banco de dados. NÃO inicia a aplicação real.
// Quando o desenvolvimento de fato começar, este arquivo será
// substituído pelo bootstrap do framework escolhido (Next.js/NestJS).
// ============================================================

import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const HOST = process.env.HOST || '0.0.0.0';

// Healthcheck antes do estático para responder mesmo se public/ falhar.
app.get('/healthz', (_req, res) => {
    res.json({
        status: 'ok',
        service: pkg.name,
        version: pkg.version,
        env: process.env.NODE_ENV || 'development',
        node: process.version,
        uptime_s: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Endpoint simples com a versão (útil para validar redeploy).
app.get('/version', (_req, res) => {
    res.json({ name: pkg.name, version: pkg.version });
});

// Conteúdo estático: página Em Construção + assets.
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    maxAge: '5m',
}));

// Fallback 404 simples.
app.use((_req, res) => {
    res.status(404).type('text/plain').send('404 — Recurso não encontrado.\n');
});

const server = app.listen(PORT, HOST, () => {
    console.log(`[${new Date().toISOString()}] ${pkg.name} v${pkg.version} ouvindo em http://${HOST}:${PORT}`);
});

// Graceful shutdown — Docker/EasyPanel envia SIGTERM em redeploy.
const shutdown = (signal) => {
    console.log(`[${new Date().toISOString()}] recebido ${signal}, encerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
