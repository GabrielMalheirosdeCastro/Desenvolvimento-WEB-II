// ============================================================
// Seed de PRODUCAO — Site de Acolhimento FAESA
// ------------------------------------------------------------
// Idempotente. Adiciona a persona principal do prototipo (Gabriel
// Malheiros, matricula 23110145) + plano de estudo + atividades
// (futuras e da semana corrente) + conquistas + eventos
// institucionais. Faz com que os endpoints /api/* parem de cair
// no fallback estatico e passem a responder com source: 'db'.
//
// Uso:
//   $env:DATABASE_URL = "postgresql://postgres.gmc:SENHA@localhost:6543/postgres?pgbouncer=true&connection_limit=1"
//   npm --workspace packages/db run seed:prod
// ============================================================
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MATRICULA = "23110145";

function diasAFrente(n: number, hora = 19, minuto = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

function diasAtras(n: number, hora = 14, minuto = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

async function main() {
  // 1. Instituicao + curso (idempotente; usados como FK)
  const faesa = await prisma.instituicaoFaesa.upsert({
    where: { codigo: "FAESA-VIT" },
    update: {},
    create: {
      codigo: "FAESA-VIT",
      nome: "FAESA Centro Universitario",
      campus: "Campus Vitoria",
      ativo: true,
    },
  });
  await prisma.curso.upsert({
    where: { id: 1 },
    update: {},
    create: {
      instituicaoId: faesa.id,
      codigo: "SI",
      nome: "Sistemas de Informacao",
      nivel: "Graduacao",
      ativo: true,
    },
  });

  // 2. Persona principal — Gabriel (matricula 23110145)
  const gabriel = await prisma.usuario.upsert({
    where: { matriculaInstitucional: MATRICULA },
    update: {
      nome: "Gabriel Malheiros de Castro",
      emailInstitucional: "gabriel.castro@faesa.br",
      eMentor: false,
    },
    create: {
      matriculaInstitucional: MATRICULA,
      emailInstitucional: "gabriel.castro@faesa.br",
      nome: "Gabriel Malheiros de Castro",
      tipoUsuario: "ALUNO",
      eMentor: false,
      dataNascimento: new Date("2003-05-12"),
    },
  });

  // 3. Plano de estudo (1 por usuario, idempotente por nome+usuario)
  let plano = await prisma.planoEstudo.findFirst({
    where: { usuarioId: gabriel.id, nome: "Plano 2026/1 — Gabriel" },
  });
  if (!plano) {
    plano = await prisma.planoEstudo.create({
      data: {
        usuarioId: gabriel.id,
        nome: "Plano 2026/1 — Gabriel",
        descricao: "Rotina semanal de estudos do prototipo do Site de Acolhimento.",
        objetivo: "Manter media >= 8.0 em todas as disciplinas.",
        ativo: true,
      },
    });
  }

  // 4. Atividades de estudo — limpa as do plano + recria deterministicas.
  await prisma.atividadeEstudo.deleteMany({ where: { planoEstudoId: plano.id } });

  const atividadesFuturas = [
    { nome: "Revisao de Calculo I", descricao: "Estudo", data_agendada: diasAFrente(2, 19, 0), status: "pending" },
    { nome: "Trabalho de Programacao", descricao: "Entrega", data_agendada: diasAFrente(4, 23, 59), status: "pending" },
    { nome: "Sessao de Mentoria", descricao: "Mentoria", data_agendada: diasAFrente(6, 18, 0), status: "scheduled" },
    { nome: "Avaliacao de Bem-estar", descricao: "Questionario", data_agendada: diasAFrente(8, 20, 0), status: "pending" },
  ];

  // Atividades realizadas nesta semana (para alimentar /dashboard/week).
  // duracao em minutos.
  const atividadesSemana = [
    { nome: "Estudo Calculo I", descricao: "Estudo", data_realizacao: diasAtras(0, 9, 0), duracao: 240, status: "done" },   // hoje
    { nome: "Estudo POO", descricao: "Estudo", data_realizacao: diasAtras(1, 10, 0), duracao: 300, status: "done" },         // ontem
    { nome: "Lab. de Banco de Dados", descricao: "Estudo", data_realizacao: diasAtras(2, 14, 0), duracao: 180, status: "done" },
    { nome: "Estatistica", descricao: "Estudo", data_realizacao: diasAtras(3, 16, 0), duracao: 360, status: "done" },
    { nome: "Engenharia de Software", descricao: "Estudo", data_realizacao: diasAtras(4, 19, 0), duracao: 240, status: "done" },
  ];

  for (const a of atividadesFuturas) {
    await prisma.atividadeEstudo.create({
      data: {
        planoEstudoId: plano.id,
        usuarioId: gabriel.id,
        nome: a.nome,
        descricao: a.descricao,
        dataAgendada: a.data_agendada,
        status: a.status,
      },
    });
  }
  for (const a of atividadesSemana) {
    await prisma.atividadeEstudo.create({
      data: {
        planoEstudoId: plano.id,
        usuarioId: gabriel.id,
        nome: a.nome,
        descricao: a.descricao,
        dataRealizacao: a.data_realizacao,
        duracaoMinutos: a.duracao,
        status: a.status,
      },
    });
  }

  // 5. Conquistas — catalogo idempotente por codigo.
  const conquistasCatalogo = [
    { codigo: "primeira-semana", titulo: "Primeira Semana", descricao: "Ativou o app e completou a primeira semana.", icone: "🎓", pontos: 50 },
    { codigo: "5h-estudo", titulo: "5 Horas de Estudo", descricao: "Acumulou 5 horas de estudo registradas.", icone: "📚", pontos: 75 },
    { codigo: "meta-cumprida", titulo: "Meta Cumprida", descricao: "Bateu uma meta semanal completa.", icone: "🎯", pontos: 100 },
  ];
  const conquistas = [];
  for (const c of conquistasCatalogo) {
    conquistas.push(
      await prisma.conquista.upsert({
        where: { codigo: c.codigo },
        update: { titulo: c.titulo, descricao: c.descricao, icone: c.icone, pontos: c.pontos },
        create: c,
      }),
    );
  }
  // Vincular as 3 conquistas a Gabriel (idempotente via @@unique).
  for (const [i, c] of conquistas.entries()) {
    await prisma.usuarioConquista.upsert({
      where: { usuarioId_conquistaId: { usuarioId: gabriel.id, conquistaId: c.id } },
      update: {},
      create: {
        usuarioId: gabriel.id,
        conquistaId: c.id,
        // Cada conquista mais "antiga" que a anterior — ordena DESC corretamente.
        conquistadaEm: diasAtras(i + 1, 12, 0),
      },
    });
  }

  // 6. Eventos institucionais — idempotente por titulo.
  const eventos = [
    {
      titulo: "Palestra: Saude Mental no Ambiente Academico",
      descricao: "Roda de conversa com a equipe de psicologia da FAESA.",
      tipo: "Palestra",
      dataEvento: diasAFrente(15, 19, 0),
      local: "Auditorio Central — Campus Vitoria",
      vagas: 80,
    },
    {
      titulo: "Oficina: Tecnicas de Estudo para o Periodo Final",
      descricao: "Workshop pratico sobre Pomodoro, Cornell e mapas mentais.",
      tipo: "Oficina",
      dataEvento: diasAFrente(23, 14, 0),
      local: "Sala B-204",
      vagas: 30,
    },
    {
      titulo: "Encontro de Mentoria — Calouros 2026/2",
      descricao: "Apresentacao do programa de mentoria entre alunos.",
      tipo: "Encontro",
      dataEvento: diasAFrente(31, 18, 30),
      local: "Hall do Bloco A",
      vagas: 120,
    },
  ];
  for (const ev of eventos) {
    const existente = await prisma.evento.findFirst({ where: { titulo: ev.titulo } });
    if (existente) {
      await prisma.evento.update({
        where: { id: existente.id },
        data: { descricao: ev.descricao, tipo: ev.tipo, dataEvento: ev.dataEvento, local: ev.local, vagas: ev.vagas },
      });
    } else {
      await prisma.evento.create({ data: ev });
    }
  }

  // 7. Garantir que existe ao menos 1 mentor para /api/mentorias?papel=mentor.
  await prisma.usuario.upsert({
    where: { matriculaInstitucional: "20210042" },
    update: { eMentor: true },
    create: {
      matriculaInstitucional: "20210042",
      emailInstitucional: "mariana.costa@faesa.br",
      nome: "Mariana Costa",
      tipoUsuario: "ALUNO",
      eMentor: true,
      dataNascimento: new Date("2004-07-22"),
    },
  });

  console.log("[seed-prod] OK");
  console.log("  persona principal:", gabriel.matriculaInstitucional, gabriel.nome);
  console.log("  plano:", plano.nome, "(id=", plano.id, ")");
  console.log("  atividades_futuras:", atividadesFuturas.length);
  console.log("  atividades_semana:", atividadesSemana.length);
  console.log("  conquistas vinculadas:", conquistas.length);
  console.log("  eventos:", eventos.length);
}

main()
  .catch((e) => {
    console.error("[seed-prod] FALHOU:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
