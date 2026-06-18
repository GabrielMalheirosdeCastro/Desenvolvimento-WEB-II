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
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { apiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Versao oficial do projeto vive no package.json da raiz (regra 0.1 do plano).
const rootDir = path.resolve(__dirname, '..', '..');
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const app = express();

// Atras do Traefik (EasyPanel): confia no primeiro proxy para que o IP real
// chegue via X-Forwarded-For. Necessario para o rate-limit contar o cliente
// correto (e nao o IP do proxy). Em dev local nao tem efeito colateral.
app.set('trust proxy', 1);

// Endurecimento de seguranca (D1 / RNF03). Helmet adiciona cabecalhos como
// X-Content-Type-Options, Referrer-Policy, HSTS e uma Content-Security-Policy
// compativel com a SPA (assets same-origin + <style> inline do index.html).
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            // Tailwind/Vite injeta um <style> inline no index.html da SPA.
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'", 'data:'],
            'connect-src': ["'self'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'frame-ancestors': ["'self'"],
            'upgrade-insecure-requests': [],
        },
    },
    // A SPA e servida na mesma origem; CORP/COEP estritos podem bloquear
    // assets/imagens externas (https:). Mantemos o restante do Helmet ativo.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
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

// Rate limiting (D1 / RNF03). Resposta JSON padronizada em 429. Aplicado
// apenas a API; /healthz e /version (acima) ficam livres para monitoria.
const limiterMsg = (req, res) => res.status(429).json({
    error: 'rate_limit',
    detalhe: 'Muitas requisições em pouco tempo. Tente novamente em instantes.',
});

// Limite estrito para autenticacao (login/ativar) — mitiga brute force.
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limiterMsg,
});

// Limite geral, generoso, para o restante da API.
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limiterMsg,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

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

// Tratamento explícito de falha no bind. Em dev local (node --watch) um
// reinício rápido pode colidir com a instância anterior que ainda não
// liberou a porta (EADDRINUSE). Sem este handler, o erro sobe como stack
// trace e o --watch apenas imprime "Failed running 'server.js'". Aqui o
// log fica explícito e o processo encerra com código 1 de forma limpa.
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[${new Date().toISOString()}] porta ${PORT} em uso (instância anterior não liberou). Encerre o processo antigo e reinicie.`);
    } else {
        console.error(`[${new Date().toISOString()}] erro no listen:`, err.message);
    }
    process.exit(1);
});

// Graceful shutdown — Docker/EasyPanel envia SIGTERM em redeploy.
const shutdown = (signal) => {
    console.log(`[${new Date().toISOString()}] recebido ${signal}, encerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
