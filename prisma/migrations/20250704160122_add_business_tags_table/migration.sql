/*
  Warnings:

  - You are about to drop the `_NegocioToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_NegocioToTag" DROP CONSTRAINT "_NegocioToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_NegocioToTag" DROP CONSTRAINT "_NegocioToTag_B_fkey";

-- DropTable
DROP TABLE "_NegocioToTag";

-- CreateTable
CREATE TABLE "negocio_tag" (
    "businessId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_tag_pkey" PRIMARY KEY ("businessId","tagId")
);

-- AddForeignKey
ALTER TABLE "negocio_tag" ADD CONSTRAINT "negocio_tag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_tag" ADD CONSTRAINT "negocio_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
