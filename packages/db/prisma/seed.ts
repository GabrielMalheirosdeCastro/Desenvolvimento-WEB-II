import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Instituicao FAESA Vitoria
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

  // 2. Cursos: Sistemas de Informacao + Psicologia
  const si = await prisma.curso.upsert({
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

  const psi = await prisma.curso.upsert({
    where: { id: 2 },
    update: {},
    create: {
      instituicaoId: faesa.id,
      codigo: "PSI",
      nome: "Psicologia",
      nivel: "Graduacao",
      ativo: true,
    },
  });

  // 3. Tres usuarios das personas
  const lucas = await prisma.usuario.upsert({
    where: { matriculaInstitucional: "20260001" },
    update: {},
    create: {
      matriculaInstitucional: "20260001",
      emailInstitucional: "lucas.silva@faesa.br",
      nome: "Lucas Silva",
      tipoUsuario: "ALUNO",
      eMentor: false,
      dataNascimento: new Date("2008-03-15"),
    },
  });

  const mariana = await prisma.usuario.upsert({
    where: { matriculaInstitucional: "20210042" },
    update: {},
    create: {
      matriculaInstitucional: "20210042",
      emailInstitucional: "mariana.costa@faesa.br",
      nome: "Mariana Costa",
      tipoUsuario: "ALUNO",
      eMentor: true,
      dataNascimento: new Date("2004-07-22"),
    },
  });

  const ricardo = await prisma.usuario.upsert({
    where: { matriculaInstitucional: "DOC-0123" },
    update: {},
    create: {
      matriculaInstitucional: "DOC-0123",
      emailInstitucional: "ricardo.almeida@faesa.br",
      nome: "Prof. Ricardo Almeida",
      tipoUsuario: "DOCENTE",
      eMentor: false,
      dataNascimento: new Date("1981-11-03"),
    },
  });

  console.log("Seed OK:");
  console.log("  Instituicao:", faesa.nome);
  console.log("  Cursos:", si.codigo, psi.codigo);
  console.log("  Usuarios:");
  console.log("    -", lucas.nome, "(", lucas.tipoUsuario, ", eMentor=", lucas.eMentor, ")");
  console.log("    -", mariana.nome, "(", mariana.tipoUsuario, ", eMentor=", mariana.eMentor, ")");
  console.log("    -", ricardo.nome, "(", ricardo.tipoUsuario, ", eMentor=", ricardo.eMentor, ")");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
