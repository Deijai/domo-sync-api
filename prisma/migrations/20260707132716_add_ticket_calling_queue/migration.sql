-- AlterEnum
ALTER TYPE "TicketMovementAction" ADD VALUE 'CALLED';

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'CALLED';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "calledAt" TIMESTAMP(3),
ADD COLUMN     "calledByUserId" TEXT,
ADD COLUMN     "counterLabel" TEXT;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_calledByUserId_fkey" FOREIGN KEY ("calledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
