/**
 * 解读引擎（Vercel 版）
 *
 * 双层架构：
 *  1. AI 引擎（DeepSeek V4 Flash）— 主路径，由 callDeepSeek() 调用
 *  2. 本地兜底引擎 — AI 失败时自动降级
 *
 * 主题路由 → AI prompt 构建 → SSE 流式输出
 *
 * 设计原则（ponytail ladder）：
 *  - 复用 TOPIC_RULES / STAR_TRAITS（patterns.ts）
 *  - 不重复写四化逻辑（sihua.ts 已有）
 *  - 砍掉原项目 786 行里的 SQLite 查询、缓存、加密等 Vercel 不兼容逻辑
 */

import type { ZiweiChart, InterpretMessage } from './types';
import { TOPIC_RULES, LIUNIAN_TOPIC_RULES, getMainStars, getMingMainStars, getCurrentDaXian } from './patterns';

// ─── 主题类型 ────────────────────────────────────────────
export type Topic =
  | 'basic' | 'wealth' | 'career' | 'love' | 'health'
  | 'children' | 'parents' | 'recent' | 'personality'
  | 'liunian_wealth' | 'liunian_career' | 'liunian_love' | 'liunian_health'
  | 'daily';

// ─── 主题检测 ────────────────────────────────────────────
export function detectTopic(question: string): Topic {
  const q = question.toLowerCase();
  if (!q.trim()) return 'basic';

  const isLiunian = /(今年|明年|后年|流年|大运|今年丙午|2026|2027|2025|近年|来年|今岁|本年)/.test(q);

  if (isLiunian) {
    if (/(财|钱|赚|收入|财富|理财|投资|偏财|正财|漏财|破财|求财)/.test(q)) return 'liunian_wealth';
    if (/(事业|工作|升职|跳槽|职场|官|学业|考试|功名|创业)/.test(q)) return 'liunian_career';
    if (/(感情|爱情|婚姻|桃花|对象|伴侣|老公|老婆|配偶|恋爱)/.test(q)) return 'liunian_love';
    if (/(健康|身体|病|疾|寿|养生|睡眠|失眠|压力)/.test(q)) return 'liunian_health';
  }

  if (/(财|钱|赚|收入|财富|理财|投资|偏财|正财|漏财|破财|求财)/.test(q)) return 'wealth';
  if (/(事业|工作|升职|跳槽|职场|官|学业|考试|功名|创业)/.test(q)) return 'career';
  if (/(感情|爱情|婚姻|桃花|对象|伴侣|老公|老婆|配偶|恋爱|分手|复合|出轨|暧昧)/.test(q)) return 'love';
  if (/(健康|身体|病|疾|寿|养生|睡眠|失眠|压力|情绪|心理)/.test(q)) return 'health';
  if (/(子女|孩子|儿子|女儿|怀孕|生育|生产)/.test(q)) return 'children';
  if (/(父母|家|父亲|母亲|家运|祖业)/.test(q)) return 'parents';
  if (/(运势|运气|未来|将来|近期)/.test(q)) return 'recent';
  if (/(性格|脾气|特点|人格|我是什么样)/.test(q)) return 'personality';

  return 'basic';
}

// ─── 构建基础事实摘要（喂给 AI 的本地预计算） ─────────────────
export function buildChartSummary(chart: ZiweiChart): string {
  const mingStars = getMingMainStars(chart);
  const daXian = getCurrentDaXian(chart);
  const palacesWithMajor = getMainStars(chart);

  let s = `【命盘基础事实】
五行局：${chart.wuxingJuName}
命宫主星：${mingStars.join('、') || '无主星（空宫）'}`;

  if (daXian) {
    s += `\n当前大限：${daXian.age[0]}-${daXian.age[1]} 岁（${daXian.palace}）`;
  }

  s += `\n年龄：${chart.currentAge} 岁`;
  s += `\n十二宫主星分布：`;

  palacesWithMajor.forEach(p => {
    s += `\n  ${p.palace}：${p.stars.join('、')}`;
  });

  return s;
}

// ─── 主题规则摘要 ────────────────────────────────────────
export function buildTopicRules(topic: Topic): string {
  if (topic in TOPIC_RULES) {
    const r = TOPIC_RULES[topic as keyof typeof TOPIC_RULES];
    let s = `【主题：${r.title}】\n核心宫位：${r.primaryPalaces.join('、')}\n关键主星：${r.keyStars.join('、')}\n规则：\n`;
    r.rules.forEach((rule, i) => {
      s += `${i + 1}. ${rule}\n`;
    });
    return s;
  }
  if (topic in LIUNIAN_TOPIC_RULES) {
    const r = LIUNIAN_TOPIC_RULES[topic as keyof typeof LIUNIAN_TOPIC_RULES];
    return `【主题：${r.title}】\n${r.rule}`;
  }
  return '';
}

// ─── 构建 AI prompt ──────────────────────────────────────
export function buildAIPrompt(
  chart: ZiweiChart,
  question: string,
  topic: Topic,
  history: InterpretMessage[] = [],
): { system: string; user: string } {
  const isFirstAsk = history.filter(m => m.role === 'user').length === 0;

  const system = `你是紫微斗数解读师，严格遵循倪海夏《天纪》体系（十四主星固定法）。
**重要规则**：
1. 不要编造不存在的星曜或格局，仅基于以下提供的事实进行解读
2. 用"推算""排定""印星"等命理术语，不要用"生成""生产"等机械感词汇
3. 解读要落到具体宫位和主星，避免空泛说教
4. ${isFirstAsk ? '首次提问：包含命格总览 + 主题专项' : '追问：只聚焦主题，不重复基础解读'}
5. 输出格式：先简短结论（1-2句），再分段解读（用 **【段落】** 标记）

${buildChartSummary(chart)}
${isFirstAsk ? '\n' + buildTopicRules(topic) : ''}`;

  const user = question;

  return { system, user };
}

// ─── 流式输出辅助 ─────────────────────────────────────────
export function* chunkText(text: string, size = 6): Generator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}

// ─── 本地兜底解读（AI 失败时用） ──────────────────────────
export function buildLocalInterpretation(
  chart: ZiweiChart,
  topic: Topic,
  question: string,
): string {
  const mingStars = getMingMainStars(chart);
  const topicData = topic in TOPIC_RULES
    ? TOPIC_RULES[topic as keyof typeof TOPIC_RULES]
    : topic in LIUNIAN_TOPIC_RULES
      ? LIUNIAN_TOPIC_RULES[topic as keyof typeof LIUNIAN_TOPIC_RULES]
      : TOPIC_RULES.basic;

  let s = `**【命格定性】**\n`;

  if (mingStars.length === 0) {
    s += `命宫无主星（空宫），需借对宫主星判定。`;
  } else if (mingStars.length === 1) {
    s += `命宫主星为 **${mingStars[0]}**，`;
  } else {
    s += `命宫主星为 **${mingStars.join('、')}** 双星组合，`;
  }
  s += `五行局 **${chart.wuxingJuName}**。\n\n`;

  if ('rules' in topicData) {
    s += `**【${topicData.title}解读】**\n`;
    topicData.rules.forEach((rule, i) => {
      s += `${i + 1}. ${rule}\n\n`;
    });
  } else if ('rule' in topicData) {
    s += `**【${topicData.title}解读】**\n${topicData.rule}\n\n`;
  }

  // 当前大限
  const dx = getCurrentDaXian(chart);
  if (dx) {
    s += `**【当前大限（${dx.age[0]}-${dx.age[1]} 岁）】**\n大限落在 ${dx.palace}，该十年以此宫星情主导。\n\n`;
  }

  s += `\n— *本地离线解读（AI 引擎暂不可用时自动降级）*`;

  return s;
}

// ─── AI 调用（Vercel env，无任何数据库依赖） ─────────────────
export interface AICConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function callDeepSeek(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  config: AICConfig,
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal,
  });

  return response;
}