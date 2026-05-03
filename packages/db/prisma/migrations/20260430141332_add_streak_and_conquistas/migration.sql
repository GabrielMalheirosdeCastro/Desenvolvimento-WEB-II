/*
  Warnings:

  - You are about to drop the column `badges` on the `gamificacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gamificacao" DROP COLUMN "badges",
ADD COLUMN     "data_ultima_atividade" TIMESTAMP(3),
ADD COLUMN     "streak_atual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak_recorde" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "e_mentor" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "conquistas" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "pontos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_conquistas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "conquista_id" INTEGER NOT NULL,
    "conquistada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_codigo_key" ON "conquistas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_conquistas_usuario_id_conquista_id_key" ON "usuarios_conquistas"("usuario_id", "conquista_id");

-- AddForeignKey
ALTER TABLE "usuarios_conquistas" ADD CONSTRAINT "usuarios_conquistas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_conquistas" ADD CONSTRAINT "usuarios_conquistas_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquistas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
