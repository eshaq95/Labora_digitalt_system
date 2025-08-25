-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
