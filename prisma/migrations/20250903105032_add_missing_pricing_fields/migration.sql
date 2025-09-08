-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "standingOrderDetails" TEXT;

-- AlterTable
ALTER TABLE "public"."SupplierItem" ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "lastVerifiedBy" TEXT,
ADD COLUMN     "priceEvaluationStatus" TEXT,
ADD COLUMN     "supplierRole" TEXT DEFAULT 'PRIMARY';
