/*
  Warnings:

  - The values [DRAFT] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `department` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `lotNumber` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `Item` table. All the data in the column will be lost.
  - The `priority` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `quantity` on the `PurchaseOrderLine` table. All the data in the column will be lost.
  - Added the required column `quantityOrdered` to the `PurchaseOrderLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('REQUESTED', 'APPROVED', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED');
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "department",
DROP COLUMN "lotNumber",
DROP COLUMN "salePrice",
ADD COLUMN     "agreementPrice" DECIMAL(10,2),
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "contentPerPack" TEXT,
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "hmsCode" TEXT,
ADD COLUMN     "manufacturer" TEXT;

-- AlterTable
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "approvedDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "orderedDate" TIMESTAMP(3),
ADD COLUMN     "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "supplierOrderNumber" TEXT,
ALTER COLUMN "status" SET DEFAULT 'REQUESTED',
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "public"."PurchaseOrderLine" DROP COLUMN "quantity",
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quantityOrdered" INTEGER NOT NULL,
ADD COLUMN     "quantityReceived" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Receipt" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "public"."Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "public"."Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "public"."Category"("code");

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receipt" ADD CONSTRAINT "Receipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
