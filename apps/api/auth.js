// ============================================================
// Camada de autenticacao local do Site de Acolhimento FAESA.
// ------------------------------------------------------------
// Estrategia (plano docs/plano-2026-06-13-bloco-a-autenticacao-local.md):
//   - Hash de senha com bcryptjs (cost 12) — pure-JS, sem build nativo.
//   - Sessao via JWT HS256 assinado com JWT_SECRET (env).
//   - Token entregue em cookie httpOnly + SameSite=Strict + Secure.
//   - RBAC pela coluna usuarios.tipo_usuario (ALUNO/MENTOR/COORDENADOR).
//
// Convencao de papeis (RBAC efetivo — A4):
//   - tipo_usuario assume os valores canonicos ALUNO ou COORDENADOR
//     (String livre no schema; comparacao case-insensitive).
//   - O papel "mentor" NAO e um tipo_usuario separado: e a flag
//     e_mentor = true sobreposta a um ALUNO. Portanto requireRole trata
//     papel pela coluna tipo_usuario, enquanto recursos de mentoria
//     verificam req.usuario.eMentor.
//   - A autorizacao por papel e SEMPRE imposta no backend (requireRole);
//     o frontend apenas esconde/mostra a UI (nunca e a fronteira real).
//
// Resiliencia (regra "zero quebra"): este modulo NUNCA derruba o
// servidor no boot. Se JWT_SECRET estiver ausente em producao, as
// rotas de auth respondem 503 (authIndisponivel) e o restante da
// aplicacao continua funcionando normalmente.
// ============================================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Nome do cookie de sessao.
export const COOKIE_NAME = 'sa_token';

// Custo do bcrypt (D4 do plano).
const BCRYPT_COST = 12;

// Expiracao do token. Aceita formato do jsonwebtoken (ex: '8h').
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Segredo de desenvolvimento: usado SOMENTE fora de producao para
// permitir testes locais sem configurar env. Em producao a ausencia
// de JWT_SECRET desativa as rotas de auth (503), sem derrubar o app.
const DEV_FALLBACK_SECRET = 'dev-insecure-secret-trocar-em-producao';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Resolve o segredo do JWT.
 * @returns {string|null} segredo valido ou null se indisponivel em producao.
 */
export function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length >= 16) return secret;
    if (!isProd) {
        return DEV_FALLBACK_SECRET;
    }
    return null;
}

/** Indica se o subsistema de autenticacao esta operacional. */
export function authDisponivel() {
    return getJwtSecret() !== null;
}

/**
 * Calcula o hash bcrypt de uma senha em texto puro.
 * @param {string} senha
 * @returns {Promise<string>}
 */
export async function hashPassword(senha) {
    return bcrypt.hash(senha, BCRYPT_COST);
}

/**
 * Compara senha em texto puro com um hash bcrypt.
 * @param {string} senha
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(senha, hash) {
    if (!hash) return false;
    return bcrypt.compare(senha, hash);
}

/**
 * Assina um JWT a partir de um payload de usuario.
 * @param {{ id:number, nome:string, matricula:string, email:string, tipo:string, eMentor:boolean }} usuario
 * @returns {string|null} token assinado ou null se auth indisponivel.
 */
export function signToken(usuario) {
    const secret = getJwtSecret();
    if (!secret) return null;
    return jwt.sign(
        {
            sub: usuario.id,
            nome: usuario.nome,
            matricula: usuario.matricula,
            email: usuario.email,
            tipo: usuario.tipo,
            eMentor: Boolean(usuario.eMentor),
        },
        secret,
        { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' },
    );
}

/**
 * Verifica e decodifica um token JWT.
 * @param {string} token
 * @returns {object|null} payload decodificado ou null se invalido/indisponivel.
 */
export function verifyToken(token) {
    const secret = getJwtSecret();
    if (!secret || !token) return null;
    try {
        return jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {
        return null;
    }
}

/**
 * Opcoes do cookie de sessao. Secure por padrao; em dev local sem HTTPS
 * defina COOKIE_SECURE=false para o cookie funcionar via http://localhost.
 * @returns {import('express').CookieOptions}
 */
export function cookieOptions() {
    const secure = process.env.COOKIE_SECURE
        ? process.env.COOKIE_SECURE !== 'false'
        : isProd;
    return {
        httpOnly: true,
        sameSite: 'strict',
        secure,
        path: '/',
        maxAge: 8 * 60 * 60 * 1000, // 8h, alinhado ao JWT_EXPIRES_IN padrao
    };
}

/**
 * Middleware: exige sessao valida. Le o cookie httpOnly, valida o JWT
 * e injeta req.usuario. Responde 401 quando ausente/invalido e 503
 * quando o subsistema de auth nao esta configurado.
 */
export function requireAuth(req, res, next) {
    if (!authDisponivel()) {
        return res.status(503).json({ error: 'auth_indisponivel' });
    }
    const token = req.cookies?.[COOKIE_NAME];
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'nao_autenticado' });
    }
    req.usuario = payload;
    next();
}

/**
 * Middleware de autorizacao por papel (RBAC). Use apos requireAuth.
 * @param {...string} papeis tipos permitidos (case-insensitive).
 */
export function requireRole(...papeis) {
    const permitidos = papeis.map((p) => String(p).toUpperCase());
    return (req, res, next) => {
        const tipo = String(req.usuario?.tipo || '').toUpperCase();
        if (!permitidos.includes(tipo)) {
            return res.status(403).json({ error: 'acesso_negado' });
        }
        next();
    };
}
