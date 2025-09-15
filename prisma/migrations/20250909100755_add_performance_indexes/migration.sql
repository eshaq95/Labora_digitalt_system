-- CreateIndex
CREATE INDEX "Item_name_idx" ON "public"."Item"("name");

-- CreateIndex
CREATE INDEX "Item_sku_idx" ON "public"."Item"("sku");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "public"."Item"("categoryId");

-- CreateIndex
CREATE INDEX "Item_departmentId_idx" ON "public"."Item"("departmentId");

-- CreateIndex
CREATE INDEX "Item_minStock_idx" ON "public"."Item"("minStock");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "public"."Item"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "public"."PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_requestedDate_idx" ON "public"."PurchaseOrder"("requestedDate");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "public"."PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_requestedBy_idx" ON "public"."PurchaseOrder"("requestedBy");
