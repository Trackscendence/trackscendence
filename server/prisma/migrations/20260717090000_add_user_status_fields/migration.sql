CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "statusReason" TEXT,
ADD COLUMN "suspendedUntil" TIMESTAMP(3),
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

CREATE INDEX "User_status_idx" ON "User"("status");
