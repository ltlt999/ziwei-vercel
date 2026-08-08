// ============================================================
// 紫微斗数核心常量（Vercel 版，1:1 移植自原项目）
// ============================================================

// 天干 Heavenly Stems
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支 Earthly Branches
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 时辰对应地支
export const SHICHEN = [
  { branch: 0, name: '子时', range: '23:00-01:00' },
  { branch: 1, name: '丑时', range: '01:00-03:00' },
  { branch: 2, name: '寅时', range: '03:00-05:00' },
  { branch: 3, name: '卯时', range: '05:00-07:00' },
  { branch: 4, name: '辰时', range: '07:00-09:00' },
  { branch: 5, name: '巳时', range: '09:00-11:00' },
  { branch: 6, name: '午时', range: '11:00-13:00' },
  { branch: 7, name: '未时', range: '13:00-15:00' },
  { branch: 8, name: '申时', range: '15:00-17:00' },
  { branch: 9, name: '酉时', range: '17:00-19:00' },
  { branch: 10, name: '戌时', range: '19:00-21:00' },
  { branch: 11, name: '亥时', range: '21:00-23:00' },
];

// 十二宫名（从命宫顺时针）
export const PALACE_NAMES_ORDER = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
];

// 纳音五行（30组干支对的五行）
export const NAYIN_ELEMENTS = [
  '金','火','木','土','金','火','水','土','金','木',
  '水','土','火','木','水','金','火','木','土','金',
  '火','水','土','金','木','水','土','火','木','水'
];

// 五行 → 局数
export const ELEMENT_TO_JU: Record<string, number> = {
  '水': 2, '木': 3, '金': 4, '土': 5, '火': 6
};

// 局数名称
export const JU_NAMES: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局'
};

// 四化表（年干 → [化禄, 化权, 化科, 化忌]）倪海夏《天纪》体系
export const SI_HUA_TABLE: Record<number, [string, string, string, string]> = {
  0: ['廉贞', '破军', '武曲', '太阳'],   // 甲
  1: ['天机', '天梁', '紫微', '太阴'],   // 乙
  2: ['天同', '天机', '文昌', '廉贞'],   // 丙
  3: ['太阴', '天同', '天机', '巨门'],   // 丁
  4: ['贪狼', '太阴', '右弼', '天机'],   // 戊
  5: ['武曲', '贪狼', '天梁', '文曲'],   // 己
  6: ['太阳', '武曲', '太阴', '天同'],   // 庚
  7: ['巨门', '太阳', '文曲', '文昌'],   // 辛
  8: ['天梁', '紫微', '左辅', '武曲'],   // 壬
  9: ['破军', '巨门', '太阴', '贪狼'],   // 癸
};

// 天魁天钺表（年干 → [天魁branch, 天钺branch]）
export const TIANKUI_TABLE: Record<number, [number, number]> = {
  0: [1, 7],   // 甲: 魁丑 钺未
  1: [0, 8],   // 乙: 魁子 钺申
  2: [11, 9],  // 丙: 魁亥 钺酉
  3: [11, 9],  // 丁: 魁亥 钺酉
  4: [1, 7],   // 戊: 魁丑 钺未
  5: [0, 8],   // 己: 魁子 钺申
  6: [1, 7],   // 庚: 魁丑 钺未
  7: [6, 2],   // 辛: 魁午 钺寅
  8: [3, 5],   // 壬: 魁卯 钺巳
  9: [3, 5],   // 癸: 魁卯 钺巳
};

// 禄存表（年干 → 禄存branch）
export const LUCUN_TABLE: Record<number, number> = {
  0: 2, 1: 3, 2: 5, 3: 6, 4: 5,
  5: 6, 6: 8, 7: 9, 8: 11, 9: 0,
};

// 天马表（年支三合 → 天马branch）
// 寅午戌→申, 申子辰→寅, 巳酉丑→亥, 亥卯未→巳
export const TIANMA_TABLE: Record<number, number> = {
  2: 8, 6: 8, 10: 8,    // 寅午戌 → 申
  8: 2, 0: 2, 4: 2,     // 申子辰 → 寅
  5: 11, 9: 11, 1: 11,  // 巳酉丑 → 亥
  11: 5, 3: 5, 7: 5,    // 亥卯未 → 巳
};

// 14 主星亮度表
export const STAR_BRIGHTNESS: Record<string, Record<number, string>> = {
  '紫微': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           1: 'normal', 4: 'normal', 7: 'bright', 10: 'normal',
           0: 'normal', 3: 'dim', 6: 'dim', 9: 'normal' },
  '天机': { 5: 'bright', 11: 'bright', 3: 'bright', 9: 'bright',
           1: 'normal', 7: 'normal', 2: 'dim', 8: 'dim',
           0: 'normal', 4: 'normal', 6: 'normal', 10: 'normal' },
  '太阳': { 3: 'bright', 4: 'bright', 5: 'bright', 6: 'bright',
           7: 'normal', 8: 'normal', 9: 'normal', 10: 'dim',
           11: 'dim', 0: 'dim', 1: 'dim', 2: 'normal' },
  '武曲': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 3: 'normal', 6: 'normal', 9: 'normal',
           1: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '天同': { 0: 'bright', 3: 'bright', 6: 'bright', 9: 'bright',
           2: 'normal', 5: 'normal', 8: 'normal', 11: 'normal',
           1: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '廉贞': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 3: 'normal', 6: 'normal', 9: 'normal',
           1: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '天府': { 1: 'bright', 2: 'bright', 5: 'bright', 6: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 4: 'normal', 9: 'normal', 10: 'normal',
           3: 'dim', 7: 'dim' },
  '太阴': { 0: 'bright', 1: 'bright', 5: 'bright', 6: 'bright', 11: 'bright',
           2: 'normal', 8: 'normal', 9: 'normal',
           3: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '贪狼': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 1: 'normal', 6: 'normal', 7: 'normal', 9: 'normal', 10: 'normal',
           3: 'dim', 4: 'dim' },
  '巨门': { 1: 'bright', 5: 'bright', 8: 'bright',
           0: 'normal', 4: 'normal', 9: 'normal',
           2: 'dim', 3: 'dim', 6: 'dim', 7: 'dim', 10: 'dim', 11: 'dim' },
  '天相': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 1: 'normal', 6: 'normal', 9: 'normal',
           3: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '天梁': { 1: 'bright', 5: 'bright', 6: 'bright', 9: 'bright',
           0: 'normal', 2: 'normal', 4: 'normal', 7: 'normal', 8: 'normal', 10: 'normal', 11: 'normal',
           3: 'dim' },
  '七杀': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 3: 'normal', 6: 'normal', 9: 'normal',
           1: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
  '破军': { 2: 'bright', 5: 'bright', 8: 'bright', 11: 'bright',
           0: 'normal', 3: 'normal', 6: 'normal', 9: 'normal',
           1: 'dim', 4: 'dim', 7: 'dim', 10: 'dim' },
};

// 主星描述（倪海夏体系）
export const STAR_DESCRIPTIONS: Record<string, { keywords: string; nature: string; element: string }> = {
  '紫微': { keywords: '帝王·尊贵·独立', nature: '中性偏吉', element: '土' },
  '天机': { keywords: '智慧·机变·谋略', nature: '吉星', element: '木' },
  '太阳': { keywords: '阳刚·官贵·慷慨', nature: '吉星', element: '火' },
  '武曲': { keywords: '财富·刚毅·果断', nature: '中性', element: '金' },
  '天同': { keywords: '温和·享福·随缘', nature: '吉星', element: '水' },
  '廉贞': { keywords: '才艺·刑囚·桃花', nature: '凶中带吉', element: '火' },
  '天府': { keywords: '财库·稳重·保守', nature: '吉星', element: '土' },
  '太阴': { keywords: '柔美·财富·阴柔', nature: '吉星', element: '水' },
  '贪狼': { keywords: '欲望·桃花·多才', nature: '中性', element: '木' },
  '巨门': { keywords: '口舌·是非·善辩', nature: '凶中带吉', element: '水' },
  '天相': { keywords: '辅佐·行政·印绶', nature: '吉星', element: '水' },
  '天梁': { keywords: '荫护·医药·长辈', nature: '吉星', element: '土' },
  '七杀': { keywords: '将星·果决·孤克', nature: '凶星', element: '金' },
  '破军': { keywords: '开创·变动·破坏', nature: '凶星', element: '水' },
};

// ============================================================
// 12 宫位解读（倪师体系，每宫核心要点）
// ============================================================
export const PALACE_MEANINGS: Record<string, { core: string; concern: string; keys: string[] }> = {
  '命宫': {
    core: '先天禀赋、性格特质、人生格局',
    concern: '自我、才能、命运基调',
    keys: ['性格', '天赋', '格局', '精神'],
  },
  '兄弟宫': {
    core: '手足关系、同辈缘分',
    concern: '兄弟姊妹、朋友、同侪',
    keys: ['兄弟', '手足', '同辈'],
  },
  '夫妻宫': {
    core: '配偶特质、婚姻缘份',
    concern: '婚姻、配偶、感情对象',
    keys: ['配偶', '婚姻', '感情'],
  },
  '子女宫': {
    core: '子女缘分、晚年运势',
    concern: '子女、下属、创作',
    keys: ['子女', '下属', '创作'],
  },
  '财帛宫': {
    core: '财富来源、求财能力',
    concern: '钱财、收入、理财',
    keys: ['财富', '收入', '理财'],
  },
  '疾厄宫': {
    core: '体质健康、灾厄倾向',
    concern: '健康、疾病、体质',
    keys: ['健康', '体质', '疾病'],
  },
  '迁移宫': {
    core: '出外运、社会舞台',
    concern: '外出、迁移、社会表现',
    keys: ['外出', '迁移', '社会'],
  },
  '交友宫': {
    core: '人际关系、部下助力',
    concern: '朋友、部下、人脉',
    keys: ['朋友', '人脉', '部下'],
  },
  '官禄宫': {
    core: '事业格局、贵显成就',
    concern: '事业、工作、社会地位',
    keys: ['事业', '工作', '地位'],
  },
  '田宅宫': {
    core: '不动产、家庭根基',
    concern: '房产、家产、家庭',
    keys: ['房产', '家产', '家庭'],
  },
  '福德宫': {
    core: '精神世界、享福程度',
    concern: '精神、享福、嗜好',
    keys: ['精神', '享福', '嗜好'],
  },
  '父母宫': {
    core: '与父母缘、长辈庇荫',
    concern: '父母、长辈、命源',
    keys: ['父母', '长辈', '庇荫'],
  },
};

// 主题 Tab 配置
export const TOPICS = [
  { key: 'overview', label: '命格', icon: '✦', color: '#d4a843' },
  { key: 'love', label: '感情', icon: '♡', color: '#e8758a' },
  { key: 'career', label: '事业', icon: '◆', color: '#5b9bd5' },
  { key: 'wealth', label: '财运', icon: '◈', color: '#70b878' },
  { key: 'health', label: '健康', icon: '◎', color: '#e8a44c' },
  { key: 'personality', label: '性格', icon: '●', color: '#9b7ed8' },
];