-- AlterTable
ALTER TABLE "User"
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorPendingSecretCiphertext" TEXT,
ADD COLUMN "twoFactorSecretCiphertext" TEXT;

-- CreateTable
CREATE TABLE "UserTwoFactorRecoveryCode" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTwoFactorRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTwoFactorRecoveryCode_userId_codeHash_key" ON "UserTwoFactorRecoveryCode"("userId", "codeHash");

-- CreateIndex
CREATE INDEX "UserTwoFactorRecoveryCode_userId_isPending_idx" ON "UserTwoFactorRecoveryCode"("userId", "isPending");

-- AddForeignKey
ALTER TABLE "UserTwoFactorRecoveryCode" ADD CONSTRAINT "UserTwoFactorRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
