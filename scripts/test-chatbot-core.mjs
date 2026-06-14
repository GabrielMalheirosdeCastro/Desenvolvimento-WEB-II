// Teste local do motor do chatbot (sem DB). Roda: node scripts/test-chatbot-core.mjs
import assert from 'node:assert/strict';

const cb = await import('../apps/api/chatbot.js');

// ------------------------------------------------------------
// FAIXAS e validacao.
// ------------------------------------------------------------
assert.deepEqual(cb.FAIXAS, ['17-20', '21-25', '26+'], 'faixas esperadas');
assert.equal(cb.faixaValida('21-25'), true, 'faixa valida reconhecida');
assert.equal(cb.faixaValida('30-40'), false, 'faixa invalida rejeitada');
assert.equal(cb.faixaValida(null), false, 'null nao e faixa valida');

// ------------------------------------------------------------
// derivarFaixa a partir de data de nascimento.
// ------------------------------------------------------------
const hoje = new Date();
const anoAtual = hoje.getFullYear();
const nasc = (anos) => new Date(anoAtual - anos, hoje.getMonth(), hoje.getDate());
assert.equal(cb.derivarFaixa(nasc(18)), '17-20', '18 anos -> 17-20');
assert.equal(cb.derivarFaixa(nasc(23)), '21-25', '23 anos -> 21-25');
assert.equal(cb.derivarFaixa(nasc(30)), '26+', '30 anos -> 26+');
assert.equal(cb.derivarFaixa(null), null, 'sem data -> null');
assert.equal(cb.derivarFaixa('data-invalida'), null, 'data invalida -> null');

// ------------------------------------------------------------
// Rede de seguranca: crise tem prioridade absoluta e encaminha p/ CVV.
// ------------------------------------------------------------
const crise = cb.gerarResposta('nao aguento mais, penso em suicidio', '21-25');
assert.equal(crise.intencao, 'crise', 'mensagem de crise detectada');
assert.equal(crise.crise, true, 'flag de crise ativa');
assert.equal(crise.sentimento, 'critico', 'sentimento critico');
assert.ok(crise.conteudo.includes('188'), 'resposta de crise cita o CVV 188');
assert.ok(/NAP/i.test(crise.conteudo), 'resposta de crise cita o NAP');

// ------------------------------------------------------------
// Deteccao de intencoes comuns (tolerante a acentos).
// ------------------------------------------------------------
assert.equal(cb.gerarResposta('estou com muita ansiedade', '21-25').intencao, 'ansiedade');
assert.equal(cb.gerarResposta('nao consigo dormir, insonia', '21-25').intencao, 'sono');
assert.equal(cb.gerarResposta('preciso organizar meu tempo', '21-25').intencao, 'organizacao');
assert.equal(cb.gerarResposta('estou desanimado, quero desistir', '21-25').intencao, 'motivacao');
assert.equal(cb.gerarResposta('tenho prova amanha', '21-25').intencao, 'prova');
assert.equal(cb.gerarResposta('me sinto sozinho na faesa', '21-25').intencao, 'adaptacao');
assert.equal(cb.gerarResposta('ola, bom dia', '21-25').intencao, 'saudacao');
assert.equal(cb.gerarResposta('quero falar com um psicologo', '21-25').intencao, 'apoio_humano');

// ------------------------------------------------------------
// Fallback acolhedor para mensagem sem intencao mapeada.
// ------------------------------------------------------------
assert.equal(cb.gerarResposta('xyzqwerty texto aleatorio', '21-25').intencao, 'outro');

// ------------------------------------------------------------
// RF16: a resposta deve ADAPTAR por faixa etaria (conteudo difere).
// ------------------------------------------------------------
const r1720 = cb.gerarResposta('estou ansioso', '17-20').conteudo;
const r2125 = cb.gerarResposta('estou ansioso', '21-25').conteudo;
const r26 = cb.gerarResposta('estou ansioso', '26+').conteudo;
assert.notEqual(r1720, r2125, 'faixa 17-20 difere de 21-25');
assert.notEqual(r2125, r26, 'faixa 21-25 difere de 26+');
assert.notEqual(r1720, r26, 'faixa 17-20 difere de 26+');

// Faixa invalida cai no padrao (mesmo conteudo de 21-25 para ansiedade).
const rInvalida = cb.gerarResposta('estou ansioso', 'faixa-x').conteudo;
assert.equal(rInvalida, r2125, 'faixa invalida usa o padrao 21-25');

// Mensagem vazia/sem termos nao deve quebrar.
assert.equal(cb.gerarResposta('', '21-25').intencao, 'outro', 'mensagem vazia -> outro');

console.log('OK: chatbot-core (faixas/deriva/crise/intencoes/adaptacao por faixa)');
