/*
  Warnings:

  - A unique constraint covering the columns `[itemId,locationId,lotNumber,expiryDate]` on the table `InventoryLot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."InventoryLot_itemId_locationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_itemId_locationId_lotNumber_expiryDate_key" ON "public"."InventoryLot"("itemId", "locationId", "lotNumber", "expiryDate");
