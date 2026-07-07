ALTER TABLE "User" ADD COLUMN "isBot" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_isBot_idx" ON "User"("isBot");
