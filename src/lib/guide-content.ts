/**
 * 用户指南(新手上手指南)内容数据源。
 *
 * 设计目标:面向普通用户的、精美分层的产品说明,而不是开发者文档。
 * 每个章节 = 一个功能领域,包含「概述 / 分步操作 / 小贴士 / 常见问题」,
 * 由 Hub 页(`/guide`)与详情页(`/guide/[section]`)共同渲染。
 *
 * 所有内容面向未注册用户开放,因此措辞以"邀请了解"为主,不假设已登录。
 * 文案与真实 UI 保持一致(按钮名、菜单名均取自代码),避免误导。
 */

import type { ComponentType } from "react";
import {
  Bell,
  HandHeart,
  Package,
  Rocket,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

type IconType = ComponentType<{ className?: string }>;

export type GuideStep = { title: string; body: string };
export type GuideFaq = { q: string; a: string };

export type GuideSection = {
  slug: string;
  title: string;
  icon: IconType;
  /** 图标底色(浅 tint),给章节卡片视觉区分。 */
  accent: string;
  /** Hub 卡片上的一句话简介。 */
  tagline: string;
  /** 详情页顶部的概述段落。 */
  summary: string[];
  /** 「如何使用」分步。 */
  steps?: GuideStep[];
  /** 「小贴士」。 */
  tips?: string[];
  /** 「常见问题」。 */
  faqs?: GuideFaq[];
  /** Hub 上置顶高亮(新手入门)。 */
  featured?: boolean;
};

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    slug: "getting-started",
    title: "新手入门",
    icon: Rocket,
    accent: "bg-primary/10 text-primary",
    tagline: "三分钟开启你的校园枢纽之旅",
    featured: true,
    summary: [
      "注册账号、完善资料、（推荐）完成学生证认证，即可发布闲置、预约服务、撮合需求，参与校园互助。",
      "浏览全部内容无需登录；但发布、交易、收藏等完整功能，登录后即可一键解锁。",
    ],
    steps: [
      {
        title: "注册账号",
        body: "点击右上角「注册」，用邮箱或手机号创建你的账号。",
      },
      {
        title: "登录并完善资料",
        body: "登录后进入「设置」，上传头像、填写昵称，让同学在校园里认出你。",
      },
      {
        title: "学生证认证（推荐）",
        body: "在「设置 → 学生证认证」上传清晰的学生证照片，提交后由管理员审核。通过后即可发布内容，并获得「已认证」可信标识。",
      },
      {
        title: "开始探索",
        body: "浏览物品、服务、需求，或发布你自己的闲置与技能，开启校园流转。",
      },
    ],
    tips: [
      "学生证认证是发布内容与建立信任的前提，建议尽早完成。",
      "未登录也能浏览全部广场内容；遇到喜欢的功能，登录即可使用。",
    ],
    faqs: [
      {
        q: "必须认证才能使用平台吗？",
        a: "浏览无需认证。但发布物品 / 服务 / 需求、以及获得信誉标识，需要先通过学生证认证。",
      },
    ],
  },
  {
    slug: "items",
    title: "物品交易",
    icon: Package,
    accent: "bg-verified/15 text-verified",
    tagline: "把闲置流转给需要的同学",
    summary: [
      "物品广场汇集校园二手好物。你可以发布闲置、对心仪的物品表达意向，并在「我的」里管理进行中的交易。",
    ],
    steps: [
      {
        title: "发布物品",
        body: "在「物品」页点「发布物品」，填写标题、价格、分类、成色并上传图片（发布需先通过学生证认证）。",
      },
      {
        title: "表达意向",
        body: "看到心仪物品，点「我想要」（可附留言）加入卖家的意向队列。",
      },
      {
        title: "卖家选定",
        body: "卖家从意向队列中选定买家后，会生成一笔「交易中」的订单。",
      },
      {
        title: "双方确认完成",
        body: "买卖双方各自点「确认完成」，双方都确认后交易即告完成。",
      },
      {
        title: "互相评价",
        body: "交易完成后，双方可互相评价，为彼此积累信誉。",
      },
    ],
    tips: [
      "意向按时间排队，越早点「我想要」排位越靠前。",
      "在「我的 → 我的物品」一站式管理：我发布的、我想要的、交易中。",
      "价格可选「定价 / 面议 / 免费」，面议便于线下协商。",
    ],
  },
  {
    slug: "services",
    title: "服务预约",
    icon: Wrench,
    accent: "bg-warning/15 text-warning",
    tagline: "让技能变现，预约专业帮助",
    summary: [
      "服务广场汇集同学们提供的咨询、教学、代办等技能服务。你可以上架自己的服务，也可以预约他人的帮助。",
    ],
    steps: [
      {
        title: "发布服务",
        body: "在「服务」页发布你能提供的服务（需认证），写清分类、形式与价格。",
      },
      {
        title: "预约服务",
        body: "浏览服务广场，向提供者发起预约。",
      },
      {
        title: "接单与确认",
        body: "提供者在「我的 → 服务预约」处理预约；双方「确认完成」后服务结束。",
      },
      {
        title: "取消与拒绝",
        body: "未确认前可免责取消；已确认后取消，需由对方决定是否同意免责。",
      },
      {
        title: "互相评价",
        body: "服务完成后，双方互相评价，沉淀口碑。",
      },
    ],
    tips: [
      "「服务预约」页聚合三个视图：我发布的服务、我接的预约、我的预约，待确认的预约会标红提醒。",
      "清晰的服务介绍与示例图，能帮你更快接到预约。",
    ],
  },
  {
    slug: "needs",
    title: "需求撮合",
    icon: HandHeart,
    accent: "bg-primary-container text-primary",
    tagline: "说出你的需要，让同学来帮忙",
    summary: [
      "没找到现成的？发布一条需求，让有能力的同学主动应征；也可以去帮别人解决需求。",
    ],
    steps: [
      {
        title: "发布需求",
        body: "在「需求」页点「发布需求」，描述你需要什么、期望时间与酬谢。",
      },
      {
        title: "应征帮忙",
        body: "浏览别人的需求，点「我可以帮忙」应征。",
      },
      {
        title: "选择 / 拒绝应征者",
        body: "作为发布者，在需求详情页或「我的 → 需求撮合」里，对每位应征者「选择 TA」或「拒绝」。",
      },
      {
        title: "确认对接",
        body: "选定提供者后，双方「确认完成」完成对接。",
      },
      {
        title: "互相评价",
        body: "对接完成后，双方互相评价。",
      },
    ],
    tips: [
      "选择或拒绝应征者都会通知对方，过程礼貌且透明。",
      "「需求撮合」页聚合三个视图：我发布的需求、我的需求匹配、我的应征，撮合进展清晰可追踪。",
    ],
  },
  {
    slug: "profile",
    title: "个人主页",
    icon: UserRound,
    accent: "bg-accent text-foreground",
    tagline: "你的校园交易名片",
    summary: [
      "个人主页展示你的发布历史、收到的评价与综合信誉，是其他同学了解你的窗口。",
      "主页数据每次访问都实时读取，新发布的交易与评价会即时体现，无需手动刷新。",
    ],
    steps: [
      {
        title: "查看主页",
        body: "点头像菜单里的「我的主页」进入自己的主页，也可以访问其他同学的主页。",
      },
      {
        title: "发布历史",
        body: "查看你发布过的物品、服务与需求记录。",
      },
      {
        title: "评价与信誉",
        body: "查看收到的星级评价、评价数量与综合信誉分。",
      },
    ],
    tips: [
      "完善昵称与头像，让主页更有温度。",
      "高质量的评价积累，是你在社区里的信任资产。",
    ],
  },
  {
    slug: "trust",
    title: "信誉与认证",
    icon: ShieldCheck,
    accent: "bg-verified/15 text-verified",
    tagline: "真实身份 + 信誉积累，安心交易",
    summary: [
      "平台通过学生证认证与交易互评，构建一个可信的校园互助社区。",
    ],
    steps: [
      {
        title: "学生证认证",
        body: "在「设置 → 学生证认证」上传学生证，管理员审核通过后获得「已认证」标识。",
      },
      {
        title: "信誉累积",
        body: "每笔物品交易、服务预约、需求撮合完成后，双方互评，星级汇总为你的信誉分。",
      },
      {
        title: "查看对方信誉",
        body: "浏览物品 / 服务 / 需求时，可看到卖家或提供者的信誉标签与评分。",
      },
      {
        title: "已公开评价",
        body: "你公开的评价会展示在对方主页，共同维护社区口碑。",
      },
    ],
    tips: [
      "认证是发布内容与获得信誉标识的前提。",
      "恶意取消等违规行为会影响信用，请诚实履约、彼此尊重。",
    ],
  },
  {
    slug: "notifications",
    title: "通知与消息",
    icon: Bell,
    accent: "bg-primary/10 text-primary",
    tagline: "重要动态，一点即达",
    summary: [
      "平台通过站内通知提醒你应征、选定、预约、评价等重要事件，点击即可直达相关页面。",
    ],
    steps: [
      {
        title: "通知中心",
        body: "点右上角铃铛查看最新通知，未读数量会以红点标示。",
      },
      {
        title: "点击跳转",
        body: "点击任意通知，可直接跳转到对应的物品、服务、需求或交易详情页。",
      },
      {
        title: "全部通知",
        body: "点「查看全部通知」进入通知列表，集中管理已读与未读。",
      },
    ],
    tips: [
      "点击通知会自动标记为已读。",
      "撮合、预约、交易等进展，都会第一时间推送给你。",
    ],
  },
];

/** 按 slug 取章节;详情页用于兜底 404。 */
export function getGuideSection(slug: string): GuideSection | undefined {
  return GUIDE_SECTIONS.find((s) => s.slug === slug);
}

/** Hub 页置顶的「快速开始」章节。 */
export const FEATURED_GUIDE_SECTION: GuideSection =
  GUIDE_SECTIONS.find((s) => s.featured) ?? GUIDE_SECTIONS[0];
