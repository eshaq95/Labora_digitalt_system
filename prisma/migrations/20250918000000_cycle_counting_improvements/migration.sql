-- Cycle Counting Improvements: Blind counting, recount thresholds, scanned fields, reason codes

-- Session-level controls
ALTER TABLE "public"."CycleCountingSession"
ADD COLUMN IF NOT EXISTS "isBlind" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "recountThresholdPercent" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "requireRecountAboveThreshold" BOOLEAN NOT NULL DEFAULT true;

-- Line-level flags and scanned data
ALTER TABLE "public"."CycleCountingLine"
ADD COLUMN IF NOT EXISTS "needsRecount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "scannedGtin" TEXT,
ADD COLUMN IF NOT EXISTS "scannedLotNumber" TEXT,
ADD COLUMN IF NOT EXISTS "scannedExpiryDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reasonCode" TEXT,
ADD COLUMN IF NOT EXISTS "lotMismatch" BOOLEAN NOT NULL DEFAULT false;


