/*
  Warnings:

  - A unique constraint covering the columns `[itemId,locationId]` on the table `InventoryLot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_itemId_locationId_key" ON "public"."InventoryLot"("itemId", "locationId");
