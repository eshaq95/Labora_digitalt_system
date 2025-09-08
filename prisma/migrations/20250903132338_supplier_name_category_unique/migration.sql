/*
  Warnings:

  - A unique constraint covering the columns `[name,categoryId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Supplier_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_categoryId_key" ON "public"."Supplier"("name", "categoryId");
