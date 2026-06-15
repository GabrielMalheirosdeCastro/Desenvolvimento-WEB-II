// ============================================================
// Motor de respostas do Chatbot de Acolhimento (RF16 / Bloco B - B2).
// ------------------------------------------------------------
// Decisao de arquitetura (ver docs/plano-2026-06-14-v1.11.0-chatbot-rf16.md):
// motor CURADO LOCAL, baseado em regras/intencoes, SEM LLM externa. Respeita
// a politica "tudo na VPS" (sem dependencia de nuvem), a LGPD (nenhuma PII sai
// da infraestrutura propria) e garante uma rede de seguranca DETERMINISTICA
// para mensagens de crise (encaminhamento ao NAP e CVV 188).
//
// Este modulo e PURO: nao acessa banco nem rede. Recebe texto + faixa etaria
// e devolve { conteudo, intencao, sentimento }. Isso o torna unitariamente
// testavel (scripts/test-chatbot-core.mjs) e facil de trocar no futuro por
// outra estrategia sem mexer nas rotas/UI.
// ============================================================

/** Faixas etarias suportadas (espelham o CHECK de chatbot_conversas). */
export const FAIXAS = ['17-20', '21-25', '26+'];

/** Faixa usada quando nao ha data de nascimento nem selecao do usuario. */
export const FAIXA_PADRAO = '21-25';

/** Valida se uma string e uma faixa etaria conhecida. */
export function faixaValida(faixa) {
    return typeof faixa === 'string' && FAIXAS.includes(faixa);
}

/**
 * Deriva a faixa etaria a partir de uma data de nascimento (Date | string | null).
 * Retorna null quando a data e ausente ou invalida (deixa o chamador decidir o padrao).
 */
export function derivarFaixa(dataNascimento) {
    if (!dataNascimento) return null;
    const nascimento = dataNascimento instanceof Date ? dataNascimento : new Date(dataNascimento);
    if (Number.isNaN(nascimento.getTime())) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aniversarioPassou =
        hoje.getMonth() > nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
    if (!aniversarioPassou) idade -= 1;

    if (idade < 0 || idade > 130) return null;
    if (idade <= 20) return '17-20';
    if (idade <= 25) return '21-25';
    return '26+';
}

// ------------------------------------------------------------
// Normalizacao de texto: minusculas + remocao de acentos para
// casar palavras-chave de forma tolerante (ex.: "ansiedade"/"ansioso").
// ------------------------------------------------------------
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/** Verifica se algum dos termos aparece no texto normalizado. */
function contemAlgum(textoNorm, termos) {
    return termos.some((t) => textoNorm.includes(t));
}

// ------------------------------------------------------------
// Rede de seguranca: termos que indicam risco/crise. Tem prioridade
// ABSOLUTA sobre qualquer outra intencao. A resposta encaminha para
// canais humanos (NAP) e de emergencia (CVV 188), sem tentar "tratar".
// ------------------------------------------------------------
const TERMOS_CRISE = [
    'suicid', 'me matar', 'me machucar', 'tirar minha vida', 'nao quero viver',
    'nao aguento mais', 'desistir de tudo', 'sumir do mundo', 'acabar com tudo',
    'me cortar', 'automutil', 'nao vejo sentido',
];

export const RESPOSTA_CRISE =
    'Sinto que voce esta passando por um momento muito dificil, e voce nao precisa enfrentar ' +
    'isso sozinho(a). Procure agora o NAP (Nucleo de Apoio Psicopedagogico) da FAESA para um ' +
    'atendimento humano. Em caso de emergencia ou risco imediato, ligue para o CVV no numero ' +
    '188 (24h, gratuito e sigiloso) ou acesse cvv.org.br. Se houver perigo a sua vida agora, ' +
    'ligue 192 (SAMU). Voce importa, e ha pessoas prontas para te ajudar.';

/**
 * Detecta sinais de crise/risco em um texto livre, reaproveitando a mesma rede
 * de seguranca deterministica do chatbot (RF16). Util para o chat humano com o
 * NAP (RF15): quando uma mensagem do aluno aciona o gatilho, a UI exibe o
 * encaminhamento imediato ao NAP/CVV 188 sem depender de atendente online.
 * Modulo puro (sem banco/rede), portanto unitariamente testavel.
 * @param {string} texto Mensagem livre do usuario.
 * @returns {boolean} true quando ha indicio de crise.
 */
export function detectarCrise(texto) {
    return contemAlgum(normalizar(texto), TERMOS_CRISE);
}

// ------------------------------------------------------------
// Base de intencoes. Cada intencao tem:
//  - termos: palavras-chave (normalizadas, sem acento)
//  - base: mensagem de acolhimento comum
//  - porFaixa: complemento adaptado a faixa etaria (RF16)
//  - sentimento: rotulo registrado em chatbot_mensagens.sentimento
// A ordem do array define a prioridade de deteccao.
// ------------------------------------------------------------
const INTENCOES = [
    {
        intencao: 'ansiedade',
        sentimento: 'negativo',
        termos: ['ansiedade', 'ansios', 'angustia', 'panico', 'nervos', 'preocupad', 'medo'],
        base:
            'A ansiedade e uma resposta comum diante de pressao academica. Respire fundo: ' +
            'tente a tecnica 4-7-8 (inspire 4s, segure 7s, expire 8s) algumas vezes.',
        porFaixa: {
            '17-20':
                ' No inicio da graduacao e normal se sentir assim com tantas novidades. ' +
                'Comece dividindo as tarefas em passos pequenos e celebre cada um.',
            '21-25':
                ' Equilibrar disciplinas, estagio e vida pessoal cansa. Reserve blocos curtos ' +
                'de descanso entre os estudos para nao saturar.',
            '26+':
                ' Conciliar trabalho, familia e estudos exige limites claros. Priorize o ' +
                'essencial da semana e seja gentil com o seu proprio ritmo.',
        },
    },
    {
        intencao: 'sono',
        sentimento: 'negativo',
        termos: ['sono', 'dormir', 'insonia', 'cansad', 'exaust', 'sem energia', 'acordar'],
        base:
            'O sono e a base do seu desempenho. Tente um horario regular para deitar e evite ' +
            'telas na ultima hora antes de dormir.',
        porFaixa: {
            '17-20':
                ' Virar a noite estudando costuma render menos do que dormir bem. Um sono ' +
                'consistente melhora a memoria para as provas.',
            '21-25':
                ' Se a rotina de estagio aperta, proteja ao menos 7h de sono nos dias de aula ' +
                'mais pesados.',
            '26+':
                ' Com multiplas responsabilidades, um ritual curto de relaxamento a noite ajuda ' +
                'a desacelerar a mente.',
        },
    },
    {
        intencao: 'organizacao',
        sentimento: 'neutro',
        termos: [
            'organiz', 'tempo', 'prazo', 'cronograma', 'planejar', 'rotina', 'atrasad',
            'procrastin', 'foco', 'concentr',
        ],
        base:
            'Organizar o tempo reduz muito a sobrecarga. Use o Plano de Estudos do app para ' +
            'registrar metas e a tecnica Pomodoro (25 min de foco, 5 de pausa).',
        porFaixa: {
            '17-20':
                ' Montar uma rotina ainda esta em construcao nessa fase. Comece com 2 a 3 metas ' +
                'por dia para criar consistencia.',
            '21-25':
                ' Com a agenda dividida entre faculdade e estagio, agende blocos fixos de estudo ' +
                'e trate-os como compromissos.',
            '26+':
                ' Aproveite janelas curtas do dia (deslocamento, intervalos) para revisoes ' +
                'rapidas e ganhe tempo na semana.',
        },
    },
    {
        intencao: 'motivacao',
        sentimento: 'negativo',
        termos: [
            'desanim', 'sem motivac', 'desmotivad', 'vontade de desistir', 'cansei',
            'nao consigo', 'fracass', 'incapaz', 'frustrad',
        ],
        base:
            'Momentos de desanimo nao apagam o seu progresso. Lembre-se do motivo pelo qual voce ' +
            'comecou e foque no proximo pequeno passo, nao no caminho inteiro.',
        porFaixa: {
            '17-20':
                ' Estar no comeco significa que ha muito espaco para crescer. Cada disciplina ' +
                'concluida e uma conquista real.',
            '21-25':
                ' A reta do meio do curso costuma ser cansativa. Reconecte-se com a area que ' +
                'voce escolheu participando de um projeto ou monitoria.',
            '26+':
                ' Retomar ou conciliar os estudos ja demonstra muita determinacao. Valorize a ' +
                'maturidade que voce traz para a sala.',
        },
    },
    {
        intencao: 'prova',
        sentimento: 'neutro',
        termos: ['prova', 'avaliac', 'exame', 'nota', 'reprov', 'recuperac', 'trabalho final', 'tcc'],
        base:
            'Para as avaliacoes, estudo distribuido vale mais que vespera unica. Faca resumos ' +
            'ativos e resolva exercicios anteriores para fixar.',
        porFaixa: {
            '17-20':
                ' Se ainda esta descobrindo como estudar, teste metodos (mapas mentais, Cornell) ' +
                'e veja qual rende mais para voce.',
            '21-25':
                ' Forme grupos de estudo com colegas de turma: explicar o conteudo a alguem ' +
                'consolida o seu proprio aprendizado.',
            '26+':
                ' Conecte a materia a sua experiencia profissional; exemplos reais ajudam a ' +
                'memoria e tornam o estudo mais rapido.',
        },
    },
    {
        intencao: 'adaptacao',
        sentimento: 'negativo',
        termos: [
            'sozinh', 'solid', 'nao tenho amigos', 'dificil fazer amigos', 'isolad',
            'nao me encaixo', 'adaptac', 'novo na faesa', 'longe de casa', 'saudade',
        ],
        base:
            'Sentir-se sozinho(a) na universidade e mais comum do que parece. Participar de ' +
            'grupos, monitorias e eventos do app ajuda a criar vinculos aos poucos.',
        porFaixa: {
            '17-20':
                ' A transicao do ensino medio para a faculdade muda muita coisa. De tempo a si ' +
                'mesmo(a): os vinculos surgem com a convivencia.',
            '21-25':
                ' Se a rotina corrida dificulta a vida social, os projetos de extensao sao uma ' +
                'otima ponte para conhecer pessoas com interesses parecidos.',
            '26+':
                ' Pode parecer que ha uma distancia de idade com a turma, mas a sua vivencia ' +
                'agrega muito. A mentoria do app tambem e um bom espaco de troca.',
        },
    },
    {
        intencao: 'financeiro',
        sentimento: 'negativo',
        termos: ['dinheiro', 'financeir', 'mensalidade', 'bolsa', 'fies', 'prouni', 'pagar', 'grana'],
        base:
            'Questoes financeiras pesam nos estudos. Procure o setor de bolsas e financiamento da ' +
            'FAESA para conhecer programas como FIES, ProUni e bolsas internas.',
        porFaixa: {
            '17-20':
                ' Vale conversar com a sua familia e com a secretaria sobre as opcoes de bolsa ' +
                'disponiveis para o seu curso.',
            '21-25':
                ' Estagios remunerados na sua area ajudam no orcamento e ainda contam como ' +
                'experiencia profissional.',
            '26+':
                ' Verifique com o RH do seu trabalho se ha incentivo educacional ou convenio com ' +
                'a instituicao.',
        },
    },
    {
        intencao: 'saudacao',
        sentimento: 'positivo',
        termos: ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'eai', 'e ai'],
        base:
            'Ola! Eu sou o assistente de acolhimento da FAESA. Estou aqui para te ouvir e ajudar ' +
            'com estudos, organizacao, bem-estar e adaptacao. Como voce esta se sentindo hoje?',
        porFaixa: {
            '17-20': '',
            '21-25': '',
            '26+': '',
        },
    },
    {
        intencao: 'agradecimento',
        sentimento: 'positivo',
        termos: ['obrigad', 'valeu', 'agradec', 'ajudou', 'muito bom'],
        base:
            'Fico feliz em ajudar! Conte comigo sempre que precisar. Lembre-se de cuidar de voce ' +
            'no meio da rotina academica.',
        porFaixa: { '17-20': '', '21-25': '', '26+': '' },
    },
    {
        intencao: 'apoio_humano',
        sentimento: 'neutro',
        termos: [
            'psicolog', 'nap', 'atendimento', 'conversar com alguem', 'ajuda profissional',
            'terapia', 'orientac',
        ],
        base:
            'Falar com um profissional faz diferenca. O NAP (Nucleo de Apoio Psicopedagogico) da ' +
            'FAESA oferece atendimento de apoio aos estudantes; procure a coordenacao para ser ' +
            'encaminhado(a).',
        porFaixa: { '17-20': '', '21-25': '', '26+': '' },
    },
];

const RESPOSTA_PADRAO = {
    intencao: 'outro',
    sentimento: 'neutro',
    base:
        'Estou aqui para te apoiar. Pode me contar um pouco mais sobre o que voce esta sentindo? ' +
        'Posso ajudar com ansiedade, sono, organizacao dos estudos, motivacao, provas, adaptacao ' +
        'a universidade ou indicar o NAP para um atendimento humano.',
};

/**
 * Gera a resposta do chatbot para uma mensagem do usuario.
 * @param {string} texto Mensagem enviada pelo aluno.
 * @param {string} faixa Faixa etaria (17-20 | 21-25 | 26+). Cai no padrao se invalida.
 * @returns {{ conteudo: string, intencao: string, sentimento: string, crise: boolean }}
 */
export function gerarResposta(texto, faixa) {
    const faixaUsada = faixaValida(faixa) ? faixa : FAIXA_PADRAO;
    const textoNorm = normalizar(texto);

    // 1) Rede de seguranca tem prioridade absoluta.
    if (contemAlgum(textoNorm, TERMOS_CRISE)) {
        return {
            conteudo: RESPOSTA_CRISE,
            intencao: 'crise',
            sentimento: 'critico',
            crise: true,
        };
    }

    // 2) Deteccao por intencao (primeira correspondencia na ordem definida).
    for (const item of INTENCOES) {
        if (contemAlgum(textoNorm, item.termos)) {
            const complemento = item.porFaixa?.[faixaUsada] || '';
            return {
                conteudo: (item.base + complemento).trim(),
                intencao: item.intencao,
                sentimento: item.sentimento,
                crise: false,
            };
        }
    }

    // 3) Fallback acolhedor.
    return {
        conteudo: RESPOSTA_PADRAO.base,
        intencao: RESPOSTA_PADRAO.intencao,
        sentimento: RESPOSTA_PADRAO.sentimento,
        crise: false,
    };
}
