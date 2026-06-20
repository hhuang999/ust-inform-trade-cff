/**
 * 搜索词扩展(跨语言同义词 + 分词)。
 *
 * 背景:三个广场页原先只用 `contains` + `mode: "insensitive"` 做子串匹配,
 * 这已经能处理大小写,但无法处理跨语言/近义词 —— 用户搜 "ipad" 时,
 * 标题写的是 "平板电脑" 就搜不到。本模块通过一张双向同义词表把查询展开,
 * 让 "ipad" 也能命中 "平板"/"平板电脑",反之亦然。
 *
 * 设计要点:
 * - 同义词以「组」给出,组内任一词等价于其他所有词(双向,无需手写两次)。
 * - 按空白分词;中文连续串整体作为一个 token(子串匹配天然覆盖 "平板"↔"平板电脑")。
 * - 每个 token 保留原形并追加其同义词,去重后截断,避免 OR 子句爆炸。
 * - 纯函数、无 IO,服务端页面与(必要时)客户端皆可复用。
 */

// 跨语言 / 近义词组(小写为主;中文原样)。组内双向等价。
const SYNONYM_GROUPS: readonly string[][] = [
  // 平板 / 电脑
  ["ipad", "平板", "平板电脑", "tablet"],
  ["macbook", "mac", "苹果笔记本", "苹果电脑", "笔记本", "笔记本电脑", "laptop"],
  ["电脑", "计算机", "computer", "台式机", "主机"],
  ["键盘", "keyboard"],
  ["鼠标", "mouse"],
  ["显示器", "显示屏", "屏幕", "monitor"],
  // 苹果 / 手机
  ["iphone", "苹果手机"],
  ["手机", "phone", "智能手机"],
  ["airpods", "耳机", "苹果耳机", "无线耳机", "蓝牙耳机", "headphone", "earphone"],
  ["充电宝", "移动电源", "powerbank"],
  ["充电器", "电源适配器", "charger"],
  // 游戏
  ["switch", "游戏机", "任天堂", "nintendo"],
  ["ps5", "ps4", "playstation", "索尼", "索尼游戏机"],
  ["xbox", "微软游戏机"],
  // 书籍 / 学习
  ["教材", "课本", "教科书", "书", "书籍", "book"],
  ["笔记", "笔记资料"],
  ["计算器", "calculator"],
  // 出行 / 生活
  ["自行车", "单车", "bike", "bicycle"],
  ["衣服", "服饰", "服装"],
  ["鞋", "鞋子"],
  // 品类兜底
  ["电子", "数码", "数码电子"],
];

// 词(小写)→ 组内其他词的双向索引,构建一次复用。
const SYNONYM_INDEX: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    const lower = group.map((w) => w.toLowerCase());
    for (const w of lower) {
      const others = lower.filter((x) => x !== w);
      const existing = map.get(w);
      map.set(
        w,
        existing ? Array.from(new Set([...existing, ...others])) : others,
      );
    }
  }
  return map;
})();

/**
 * 把原始搜索词拆分为 token 并展开同义词,返回去重后的查询词数组。
 *
 * @param query    原始搜索串
 * @param maxTerms 最多展开多少个词(防止 OR 子句过多拖慢查询)
 */
export function expandSearchTerms(query: string, maxTerms = 12): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const acc = new Set<string>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    acc.add(key);
    const synonyms = SYNONYM_INDEX.get(key);
    if (synonyms) {
      for (const s of synonyms) acc.add(s);
    }
  }
  return Array.from(acc).slice(0, maxTerms);
}

/** 是否存在可搜索词(供页面决定是否拼接 WHERE)。 */
export function hasSearch(query: string): boolean {
  return expandSearchTerms(query).length > 0;
}
