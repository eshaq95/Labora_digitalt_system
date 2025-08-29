-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Unit" ADD VALUE 'BOTTLE';
ALTER TYPE "public"."Unit" ADD VALUE 'TUBE';
ALTER TYPE "public"."Unit" ADD VALUE 'PLATE';
ALTER TYPE "public"."Unit" ADD VALUE 'KIT';
ALTER TYPE "public"."Unit" ADD VALUE 'LITER';
ALTER TYPE "public"."Unit" ADD VALUE 'GRAM';
ALTER TYPE "public"."Unit" ADD VALUE 'KILOGRAM';
ALTER TYPE "public"."Unit" ADD VALUE 'MILLILITER';
ALTER TYPE "public"."Unit" ADD VALUE 'PACK';
ALTER TYPE "public"."Unit" ADD VALUE 'ROLL';

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "conversionFactor" INTEGER,
ADD COLUMN     "defaultLocationId" TEXT,
ADD COLUMN     "orderUnit" "public"."Unit",
ADD COLUMN     "requiresLotNumber" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
