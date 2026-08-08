/**
 * 紫微斗数本地兜底知识库（Vercel 版 · 精简版）
 *
 * 设计原则（ponytail ladder 强制执行）：
 *  1. 复用原项目 STAR_DESCRIPTIONS / PALACE_MEANINGS（在 constants.ts）
 *  2. 6 主题各保留核心 5-8 条主星解读 + 宫位映射
 *  3. 删掉飞星派格局识别 v2（1118 行 → 200 行）
 *  4. 不存"必须/加分/破格"三层（数据模型过度设计）
 *
 * 用途：AI 引擎不可用时的兜底解读（保证任何访客都能看到解读内容）
 */

import type { ZiweiChart, Palace } from './types';
import { STAR_DESCRIPTIONS, PALACE_MEANINGS, BRANCHES, STEMS } from './constants';

// ─── 14 主星特质（精简版，每星 1 段）────────────────────────
export const STAR_TRAITS: Record<string, string> = {
  '紫微': '帝星入命，主贵显、有领导力。性格刚毅果决，自尊心强，喜居上位。命宫有紫微者，少年早发，但忌孤高，需有左辅右弼、文昌文曲夹辅方为上格。',
  '天机': '智慧之星，主谋略、善策划。心思缜密，善分析，但易多虑。命宫有天机者，聪明伶俐，适合幕僚、顾问、策划类工作。忌与巨门同宫，防多思多虑。',
  '太阳': '阳刚之男星，主博爱、贵显。在命宫者，性格慷慨，乐于助人，有领导气质。在父宫、官禄宫最吉，主父显子贵。在夫妻宫女命忌守，易克夫。',
  '武曲': '财星，主刚毅、决断、善理财。在命宫者，性格刚直，不善言辞，但对钱财敏感，适合金融、会计、技术工作。武曲化忌主破财。',
  '天同': '福星，主温和、享受、随缘。在命宫者，性格柔和，不争不抢，但易流于懒散。天同坐命喜见化禄，主一生福气。',
  '廉贞': '次桃花星，主才艺、情感强烈。在命宫者，多才多艺，有艺术天分，但感情丰富，易有情感纠纷。廉贞化忌主官非。',
  '天府': '财库之星，主稳重、保守、理财。在命宫者，性格稳重，善积累财富，但易保守谨慎。命宫有天府，主一生衣食无忧。',
  '太阴': '财星，主柔美、阴柔、财禄。在命宫女命最吉，主美丽聪慧。在命宫男命忌守，防优柔寡断。在父母宫主母亲贤惠。',
  '贪狼': '桃花兼才艺星，主欲望、才艺、交际。在命宫者，才艺出众，人缘极好，但欲望强烈，感情复杂。贪狼化忌主感情困扰。',
  '巨门': '口舌之星，主口才、善辩、但易招口舌是非。在命宫者，善辩好辩，适合律师、教师、记者。巨门在夫妻宫主夫妻多口舌。',
  '天相': '印星，主辅佐、稳重、协调。在命宫者，为人稳重可靠，适合行政、管理、辅佐类工作。天相喜见化禄，主事业顺遂。',
  '天梁': '荫星，主庇荫、寿星、医药。在命宫者，性格温和，常得长辈庇护。老人星入命，主健康长寿。天梁化禄主解厄。',
  '七杀': '将星，主孤克、果决、刚烈。在命宫者，性格刚强果断，独断独行。适合军警、企业家。七杀忌与火铃同宫，防意外灾厄。',
  '破军': '破坏与开创之星，主变动、革新。在命宫者，一生多变动起伏，不守旧，善于开创新局。破军化禄主先破后立。',
};

// ─── 6 主题解读核心规则（每个主题 5-8 条）────────────────
export const TOPIC_RULES = {
  wealth: {
    title: '财运',
    primaryPalaces: ['财帛宫', '命宫', '官禄宫'],
    keyStars: ['武曲', '天府', '太阴', '贪狼', '紫微'],
    rules: [
      '财帛宫有武曲化禄者，主正财运旺，宜实业、稳健投资。',
      '财帛宫见天府化禄者，主财库丰盈，可守财聚财。',
      '财帛宫有太阴化禄者，女命财运亨通；男命宜防阴耗。',
      '命宫化禄落财帛宫，主一生财源滚滚。',
      '武曲化忌入财帛宫，主破财、投资失利，需防金融风险。',
      '贪狼化忌入财帛宫，主欲望难填、财来财去，感情破财。',
      '财帛宫会照擎羊、陀罗者，主财来必有是非争夺。',
    ],
  },
  career: {
    title: '事业',
    primaryPalaces: ['官禄宫', '命宫', '财帛宫', '迁移宫'],
    keyStars: ['紫微', '天相', '天府', '七杀', '破军', '廉贞'],
    rules: [
      '官禄宫有紫微化禄者，主事业格局大、可居高位。',
      '官禄宫有天相化禄者，主行政能力强，宜幕僚、辅佐类工作。',
      '官禄宫有七杀者，主开创事业、果决有为，适合军警、企业家。',
      '官禄宫见破军化禄者，主先破后立，适合改革创新。',
      '廉贞化忌入官禄宫者，主官非缠身，工作变动频繁。',
      '命宫化禄落官禄宫，主事业顺遂，可得高位。',
      '迁移宫有紫微者，主在外发展更胜本地，宜外出创业。',
    ],
  },
  love: {
    title: '感情',
    primaryPalaces: ['夫妻宫', '命宫', '福德宫', '子女宫'],
    keyStars: ['贪狼', '廉贞', '紫微', '天府', '太阴', '天相'],
    rules: [
      '夫妻宫有紫微天府者，主婚姻和顺、配偶尊贵。',
      '夫妻宫有贪狼者，主桃花旺盛，但感情复杂多变。',
      '夫妻宫有廉贞化忌者，主感情纠纷多，易有三角关系。',
      '夫妻宫有天相者，主配偶贤淑、婚姻稳定。',
      '夫妻宫见太阳化忌（女命），主夫缘浅薄、聚少离多。',
      '夫妻宫见太阴化忌（男命），主妻体弱或感情受挫。',
      '命宫化禄落夫妻宫者，主夫妻情深、相敬如宾。',
      '福德宫有天同者，主感情生活和谐、享受型婚姻。',
    ],
  },
  health: {
    title: '健康',
    primaryPalaces: ['疾厄宫', '命宫', '福德宫'],
    keyStars: ['天梁', '天同', '廉贞', '贪狼', '七杀'],
    rules: [
      '疾厄宫有天梁者，主健康长寿、得长辈医药庇荫。',
      '疾厄宫有天同者，主体质平和、少病少灾。',
      '疾厄宫有廉贞化忌者，主心火旺盛、血液循环系统问题。',
      '疾厄宫有贪狼者，主内分泌、情志类问题。',
      '疾厄宫有七杀者，主意外伤害、需防意外血光。',
      '疾厄宫见擎羊、陀罗、火星、铃星者，主该宫所主脏腑易有慢性病。',
      '福德宫有化忌者，主精神压力较大，影响身心健康。',
    ],
  },
  personality: {
    title: '性格',
    primaryPalaces: ['命宫', '身宫', '迁移宫'],
    keyStars: ['紫微', '天机', '太阳', '太阴', '贪狼', '巨门'],
    rules: [
      '命宫主星决定基本人格特质。',
      '紫微坐命：领导型人格，刚毅果敢，但忌孤高。',
      '天机坐命：智慧型人格，善谋略，但易多虑。',
      '太阳坐命：博爱型人格，慷慨热情，男命尤吉。',
      '太阴坐命：内敛型人格，细腻敏感，女命尤吉。',
      '贪狼坐命：欲望型人格，才艺多门，但感情复杂。',
      '巨门坐命：口才型人格，善辩好辩，需防口舌。',
      '迁移宫主星显示社会舞台上的外在表现，常与命宫互补。',
    ],
  },
  basic: {
    title: '命格',
    primaryPalaces: ['命宫', '官禄宫', '财帛宫', '迁移宫'],
    keyStars: ['紫微', '天府', '武曲', '天相', '天梁', '七杀'],
    rules: [
      '命宫主星决定先天格局基调。',
      '三方四正（命宫+财帛+官禄+迁移）星情决定整体格局高低。',
      '夹宫（命宫前后两宫）的辅星影响命格稳定性。',
      '身宫所在宫位，决定中年后的发力点。',
      '五行局数决定大限起运年龄。',
    ],
  },
};

// ─── 流年/大限主题规则（与上面类似）────────────────────
export const LIUNIAN_TOPIC_RULES = {
  liunian_wealth: {
    title: '流年财运',
    rule: '流年财帛宫有武曲化禄，主当年财运亨通；有化忌，主破财。',
  },
  liunian_career: {
    title: '流年事业',
    rule: '流年官禄宫有紫微化禄，主升迁得位；有廉贞化忌，主官非变动。',
  },
  liunian_love: {
    title: '流年感情',
    rule: '流年夫妻宫有红红天喜，主当年桃花旺；有廉贞化忌，主感情波折。',
  },
  liunian_health: {
    title: '流年健康',
    rule: '流年疾厄宫有煞星者，主当年需防意外；天梁化禄可解厄。',
  },
};

// ─── 工具函数 ────────────────────────────────────────────
export function getMainStars(chart: ZiweiChart): Array<{ palace: string; stars: string[] }> {
  return chart.palaces
    .filter(p => p.stars.some(s => s.type === 'major'))
    .map(p => ({
      palace: p.name,
      stars: p.stars.filter(s => s.type === 'major').map(s => s.name),
    }));
}

export function getTopicData(topic: string) {
  if (topic in TOPIC_RULES) return TOPIC_RULES[topic as keyof typeof TOPIC_RULES];
  if (topic in LIUNIAN_TOPIC_RULES) return LIUNIAN_TOPIC_RULES[topic as keyof typeof LIUNIAN_TOPIC_RULES];
  return TOPIC_RULES.basic;
}

/** 找到指定宫位 */
export function findPalaceByName(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.name === name);
}

/** 找到包含某主星的宫位 */
export function findPalaceWithStar(chart: ZiweiChart, starName: string): Palace | undefined {
  return chart.palaces.find(p => p.stars.some(s => s.name === starName && s.type === 'major'));
}

/** 命宫主星 */
export function getMingMainStars(chart: ZiweiChart): string[] {
  const mingPalace = chart.palaces.find(p => p.isMingGong);
  if (!mingPalace) return [];
  return mingPalace.stars.filter(s => s.type === 'major').map(s => s.name);
}

/** 三方四正宫位 */
export function getSanFangPalaces(chart: ZiweiChart): Palace[] {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter(p => branches.includes(p.branch));
}

/** 当前大限信息 */
export function getCurrentDaXian(chart: ZiweiChart): { age: [number, number]; palace: string } | null {
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (!dx) return null;
  return { age: [dx.startAge, dx.endAge], palace: dx.palaceName };
}

/** 格式化宫位地支天干 */
export function formatPalace(p: Palace): string {
  return `${STEMS[p.stem]}${BRANCHES[p.branch]}·${p.name}`;
}