// ============================================================
// Site de Acolhimento FAESA — backend Express (apps/api).
// ------------------------------------------------------------
// Responsabilidades:
//   - expor /healthz e /version (mecanismo de validacao de redeploy)
//   - servir a SPA React buildada em apps/web/dist (fallback SPA *)
//   - fallback para a antiga pagina "Em Construcao" caso o build da web
//     ainda nao tenha sido gerado (uteis em dev local sem 'npm run build').
// ============================================================

import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { apiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Versao oficial do projeto vive no package.json da raiz (regra 0.1 do plano).
const rootDir = path.resolve(__dirname, '..', '..');
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

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

// Endpoint simples com a versão (útil para validar redeploy + badge da SPA).
app.get('/version', (_req, res) => {
    res.json({ name: pkg.name, version: pkg.version });
});

// API REST do prototipo (Sprint 7). Resiliente: se DATABASE_URL nao
// estiver setado os endpoints retornam fallback estatico.
app.use('/api', apiRouter);

// Resolve o diretorio servido como SPA (apps/web/dist).
const webDist = path.resolve(rootDir, 'apps', 'web', 'dist');
const legacyPublic = path.join(__dirname, 'public');
const hasWebBuild = existsSync(path.join(webDist, 'index.html'));
const staticDir = hasWebBuild ? webDist : legacyPublic;

console.log(`[${new Date().toISOString()}] estatico: ${staticDir} (web build: ${hasWebBuild ? 'OK' : 'AUSENTE — usando legacyPublic'})`);

app.use(express.static(staticDir, {
    extensions: ['html'],
    maxAge: hasWebBuild ? '1h' : '5m',
}));

// Fallback SPA: qualquer rota nao servida acima devolve index.html da SPA
// para que o React Router cuide do roteamento client-side. Se nao houver
// build da SPA, devolve 404 simples (modo legado).
app.use((req, res) => {
    if (hasWebBuild) {
        res.sendFile(path.join(staticDir, 'index.html'));
        return;
    }
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
