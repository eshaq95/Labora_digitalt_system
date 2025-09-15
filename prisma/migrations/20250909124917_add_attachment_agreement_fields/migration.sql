-- AlterTable
ALTER TABLE "public"."Attachment" ADD COLUMN     "agreementReference" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3);
