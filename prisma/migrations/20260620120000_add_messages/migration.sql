-- 站内私信:把原本"一次性的"意向/预约/应征留言升级为多轮沟通。
-- 纯新增(additive):仅 CREATE TYPE / CREATE TABLE / CREATE INDEX / ADD FK,不改动既有数据。
-- 上下文(contextType+contextId)为多态链接,无 FK;一对用户会话 = 同上下文下双方互发的消息。

-- CreateEnum
CREATE TYPE "MessageContextType" AS ENUM ('ITEM', 'SERVICE', 'NEED');

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "contextType" "MessageContextType" NOT NULL,
    "contextId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_contextType_contextId_idx" ON "Message"("contextType", "contextId");
CREATE INDEX "Message_recipientId_createdAt_idx" ON "Message"("recipientId", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
