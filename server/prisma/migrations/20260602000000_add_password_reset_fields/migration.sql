-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordResetTokenId" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetTokenId_key" ON "User"("passwordResetTokenId");
