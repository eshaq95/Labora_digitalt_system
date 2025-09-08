-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "generalEmail" TEXT;

-- CreateTable
CREATE TABLE "public"."SupplierCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanySettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Labora Digital',
    "organizationNumber" TEXT,
    "deliveryAddress" TEXT,
    "deliveryPostalCode" TEXT,
    "deliveryCity" TEXT,
    "deliveryCountry" TEXT DEFAULT 'Norge',
    "invoiceAddress" TEXT,
    "invoicePostalCode" TEXT,
    "invoiceCity" TEXT,
    "invoiceCountry" TEXT DEFAULT 'Norge',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCategory_name_key" ON "public"."SupplierCategory"("name");

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."SupplierCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
