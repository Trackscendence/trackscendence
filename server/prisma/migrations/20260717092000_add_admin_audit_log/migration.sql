CREATE TYPE "AdminActionType" AS ENUM (
  'ROLE_CHANGED',
  'USER_SUSPENDED',
  'USER_BANNED',
  'USER_REINSTATED',
  'USER_DELETED'
);

CREATE TABLE "AdminAuditLog" (
  "id" SERIAL NOT NULL,
  "actorId" INTEGER,
  "targetId" INTEGER,
  "action" "AdminActionType" NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_targetId_fkey"
FOREIGN KEY ("targetId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AdminAuditLog_actorId_createdAt_idx"
ON "AdminAuditLog"("actorId", "createdAt");

CREATE INDEX "AdminAuditLog_targetId_idx"
ON "AdminAuditLog"("targetId");
