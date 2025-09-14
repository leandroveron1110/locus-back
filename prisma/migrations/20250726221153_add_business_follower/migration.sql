-- CreateTable
CREATE TABLE "BusinessFollower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFollower_userId_businessId_key" ON "BusinessFollower"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "BusinessFollower" ADD CONSTRAINT "BusinessFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFollower" ADD CONSTRAINT "BusinessFollower_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
