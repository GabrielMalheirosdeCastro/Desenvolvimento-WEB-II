// ============================================================
// Pool Postgres compartilhado da API.
// ------------------------------------------------------------
// Le DATABASE_URL do ambiente. No EasyPanel apontar para
// supabase-pooler:6543 (rede overlay docker `easypanel`).
// Se DATABASE_URL nao estiver definido, o pool fica nulo e os
// endpoints retornam fallback estatico (modo prototipo).
// ============================================================
import pg from 'pg';

const { Pool } = pg;

let pool = null;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
    try {
        pool = new Pool({
            connectionString: dbUrl,
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            // Supabase pooler aceita SSL opcional; em rede interna desativamos.
            ssl: dbUrl.includes('localhost') || dbUrl.includes('supabase-pooler')
                ? false
                : { rejectUnauthorized: false },
        });
        console.log(`[db] pool inicializado para ${new URL(dbUrl).host}`);
    } catch (err) {
        console.error('[db] falha ao inicializar pool:', err.message);
        pool = null;
    }
} else {
    console.warn('[db] DATABASE_URL ausente — endpoints da API usarao fallback estatico.');
}

/** Executa uma query parametrizada. Retorna null se nao houver pool. */
export async function query(sql, params = []) {
    if (!pool) return null;
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (err) {
        console.error('[db] query erro:', err.message);
        return null;
    }
}

export function isConnected() {
    return pool !== null;
}
