/*
  Warnings:

  - You are about to drop the column `category` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "category";

-- DropEnum
DROP TYPE "public"."ItemCategory";
