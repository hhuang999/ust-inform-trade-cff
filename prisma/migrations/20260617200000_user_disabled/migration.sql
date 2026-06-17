-- User 增加 disabled 字段:管理员 BAN 后置 true,禁止登录 + 在线会话失效。
-- 纯加列(NOT NULL DEFAULT false),不影响既有数据。
ALTER TABLE "User" ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false;
