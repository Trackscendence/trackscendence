CREATE TYPE "ChatRoomVisibility" AS ENUM ('PUBLIC', 'INVITE_ONLY');
CREATE TYPE "ChatRoomMemberRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "ChatRoomMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'KICKED', 'LEFT');

CREATE TABLE "ChatRoom" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "visibility" "ChatRoomVisibility" NOT NULL DEFAULT 'PUBLIC',
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatRoomMember" (
  "id" SERIAL NOT NULL,
  "roomId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" "ChatRoomMemberRole" NOT NULL DEFAULT 'MEMBER',
  "status" "ChatRoomMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "isMuted" BOOLEAN NOT NULL DEFAULT false,
  "invitedById" INTEGER,
  "joinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" SERIAL NOT NULL,
  "roomId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatRoom_visibility_idx" ON "ChatRoom"("visibility");
CREATE INDEX "ChatRoom_createdById_idx" ON "ChatRoom"("createdById");

CREATE UNIQUE INDEX "ChatRoomMember_roomId_userId_key" ON "ChatRoomMember"("roomId", "userId");
CREATE INDEX "ChatRoomMember_userId_status_idx" ON "ChatRoomMember"("userId", "status");
CREATE INDEX "ChatRoomMember_roomId_status_idx" ON "ChatRoomMember"("roomId", "status");
CREATE INDEX "ChatRoomMember_invitedById_idx" ON "ChatRoomMember"("invitedById");

CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
