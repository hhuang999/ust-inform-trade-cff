/**
 * 私信(沟通留言)的纯常量。独立成无服务端依赖的模块,
 * 以便客户端组件(@/components/site/message-thread)与 server action 共用,
 * 不会把 @/lib/db / pg 拖进浏览器打包。
 */

/** 单条留言正文最大字符数。 */
export const MESSAGE_BODY_MAX = 500;
