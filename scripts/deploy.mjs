// ============================================================
// scripts/deploy.mjs
// Dispara o webhook de implantação do EasyPanel.
// Uso: `npm run deploy` (lê EASYPANEL_DEPLOY_WEBHOOK do .env ou env).
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Carrega .env manualmente (sem dependência externa).
function loadDotenv(file) {
    if (!existsSync(file)) return;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
    }
}

loadDotenv(path.join(ROOT, '.env'));
loadDotenv(path.join(ROOT, '.env.local'));

const WEBHOOK = process.env.EASYPANEL_DEPLOY_WEBHOOK;

if (!WEBHOOK || WEBHOOK.includes('REPLACE_ME')) {
    console.error('[deploy] ERRO: variável EASYPANEL_DEPLOY_WEBHOOK ausente ou não configurada.');
    console.error('[deploy] Configure-a em .env (local) ou como GitHub Secret (CI).');
    process.exit(1);
}

let url;
try {
    url = new URL(WEBHOOK);
} catch {
    console.error(`[deploy] ERRO: URL inválida: ${WEBHOOK}`);
    process.exit(1);
}

console.log(`[deploy] disparando webhook EasyPanel → ${url.origin}${url.pathname.replace(/\/[^/]+$/, '/<redacted>')}`);

const started = Date.now();
try {
    const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'User-Agent': 'site-acolhimento-faesa-deploy/0.4.0' },
    });
    const elapsed = Date.now() - started;
    const body = await res.text();
    if (!res.ok) {
        console.error(`[deploy] HTTP ${res.status} ${res.statusText} (${elapsed} ms)`);
        if (body) console.error(`[deploy] resposta: ${body.slice(0, 500)}`);
        process.exit(2);
    }
    console.log(`[deploy] OK · HTTP ${res.status} · ${elapsed} ms`);
    if (body.trim()) console.log(`[deploy] resposta: ${body.slice(0, 500)}`);
    console.log('[deploy] Acompanhe o build em: https://vps.gmcsistemas.com.br');
} catch (err) {
    console.error(`[deploy] FALHA na requisição: ${err.message}`);
    process.exit(3);
}
