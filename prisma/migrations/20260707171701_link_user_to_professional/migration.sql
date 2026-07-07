-- AlterTable
ALTER TABLE "users" ADD COLUMN     "professionalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_professionalId_key" ON "users"("professionalId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
