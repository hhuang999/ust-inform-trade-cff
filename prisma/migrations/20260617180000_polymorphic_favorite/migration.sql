-- 收藏(Favorite)改为多态:targetType + targetId 指向 Item/Service/Need(无 FK)。
-- 现有按 itemId 收藏的行回填为 targetType='ITEM' / targetId=原 itemId,不丢数据。

CREATE TYPE "FavoriteTargetType" AS ENUM ('ITEM', 'SERVICE', 'NEED');

-- 先以默认值新增 NOT NULL 列(兼容已有 1 行),再回填,再去掉默认值。
ALTER TABLE "Favorite" ADD COLUMN "targetType" "FavoriteTargetType" NOT NULL DEFAULT 'ITEM';
ALTER TABLE "Favorite" ADD COLUMN "targetId" TEXT NOT NULL DEFAULT '';

UPDATE "Favorite" SET "targetType" = 'ITEM', "targetId" = "itemId";

ALTER TABLE "Favorite" ALTER COLUMN "targetType" DROP DEFAULT;
ALTER TABLE "Favorite" ALTER COLUMN "targetId" DROP DEFAULT;

-- 拆除旧的 itemId 维度:唯一索引、外键、列。
DROP INDEX "Favorite_userId_itemId_key";
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_itemId_fkey";
ALTER TABLE "Favorite" DROP COLUMN "itemId";

-- 新的多态唯一约束 + 查询索引(Favorite_userId_idx 已存在,保留)。
CREATE UNIQUE INDEX "Favorite_userId_targetType_targetId_key" ON "Favorite"("userId", "targetType", "targetId");
CREATE INDEX "Favorite_targetType_targetId_idx" ON "Favorite"("targetType", "targetId");
