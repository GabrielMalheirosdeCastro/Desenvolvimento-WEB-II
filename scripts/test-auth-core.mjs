// Teste local do nucleo de auth (sem DB). Roda: node scripts/test-auth-core.mjs
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'segredo-de-teste-suficientemente-longo-123';
process.env.JWT_EXPIRES_IN = '8h';

const auth = await import('../apps/api/auth.js');

assert.equal(auth.authDisponivel(), true, 'auth deve estar disponivel com JWT_SECRET');

const senha = 'Senha#Forte123';
const hash = await auth.hashPassword(senha);
assert.ok(hash.startsWith('$2'), 'hash bcrypt valido');
assert.equal(await auth.verifyPassword(senha, hash), true, 'senha correta confere');
assert.equal(await auth.verifyPassword('errada', hash), false, 'senha errada falha');
assert.equal(await auth.verifyPassword(senha, null), false, 'hash nulo falha');

const token = auth.signToken({ id: 7, matricula: '23110145', email: 'a@faesa.br', tipo: 'ALUNO', eMentor: false });
assert.ok(typeof token === 'string' && token.split('.').length === 3, 'token JWT valido');
const payload = auth.verifyToken(token);
assert.equal(payload.sub, 7);
assert.equal(payload.matricula, '23110145');
assert.equal(payload.tipo, 'ALUNO');
assert.equal(auth.verifyToken('token.invalido.xxx'), null, 'token invalido retorna null');

// Sem segredo em producao -> auth indisponivel.
delete process.env.JWT_SECRET;
assert.equal(auth.authDisponivel(), false, 'sem JWT_SECRET em prod auth fica indisponivel');
assert.equal(auth.signToken({ id: 1 }), null, 'signToken null sem segredo');

console.log('OK — nucleo de auth validado (hash/verify/jwt/secret-guard).');
