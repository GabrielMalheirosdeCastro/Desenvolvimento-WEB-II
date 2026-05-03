import { prisma } from "./lib/prisma";

async function main() {
  const usuarios = await prisma.usuario.findMany({
    take: 5,
    orderBy: { id: "asc" },
  });

  const conversas = await prisma.chatbotConversa.findMany({
    take: 5,
    orderBy: { id: "desc" },
    include: {
      mensagens: {
        take: 3,
        orderBy: { id: "desc" },
      },
      usuario: {
        select: {
          id: true,
          nome: true,
          emailInstitucional: true,
        },
      },
    },
  });

  console.log("Usuarios (top 5):", JSON.stringify(usuarios, null, 2));
  console.log("ChatbotConversa (top 5 com mensagens):", JSON.stringify(conversas, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao executar script Prisma SQLite:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
