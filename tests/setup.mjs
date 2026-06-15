// ============================================================
// Setup global das suites Vitest (roda antes de cada arquivo de teste).
// ------------------------------------------------------------
// Define um segredo JWT deterministico para que auth.js opere de forma
// reproduzivel nos testes de integracao (signToken/verifyToken). O
// NODE_ENV fica como 'test' (nao-producao) para nao exigir cookie Secure
// nem derrubar o subsistema de auth. Os testes que precisam exercitar o
// ramo de PRODUCAO sem segredo fazem isso isoladamente via vi.resetModules.
// ============================================================
process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'test' : (process.env.NODE_ENV || 'test');
process.env.JWT_SECRET = 'segredo-de-teste-suficientemente-longo-123';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
// Garante modo fallback (sem banco) nos testes de integracao — nunca
// apontar para o Postgres de producao a partir da suite.
delete process.env.DATABASE_URL;
