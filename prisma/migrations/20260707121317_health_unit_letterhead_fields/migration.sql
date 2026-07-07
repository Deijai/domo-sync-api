-- AlterTable
ALTER TABLE "health_units" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "institutionName" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "stateName" TEXT;
