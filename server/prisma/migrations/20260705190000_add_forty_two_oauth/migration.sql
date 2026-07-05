-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fortyTwoId" INTEGER,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_fortyTwoId_key" ON "User"("fortyTwoId");
