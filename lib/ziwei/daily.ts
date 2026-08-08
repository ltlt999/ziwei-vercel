/**
 * 今日运势生成（Vercel 版）
 * 基于当日干支 + 用户命盘做个性化运势
 *
 * 设计：保持原项目功能一致，砍掉 lunar-javascript 之外的复杂逻辑
 */

import { Solar } from 'lunar-javascript';
import type { ZiweiChart } from './types';
import { STEMS, BRANCHES } from './constants';

// 天干五行
const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 五行相生相克
const ELEMENT_RELATIONS: Record<string, { sheng: string; ke: string }> = {
  '木': { sheng: '火', ke: '土' },
  '火': { sheng: '土', ke: '金' },
  '土': { sheng: '金', ke: '水' },
  '金': { sheng: '水', ke: '木' },
  '水': { sheng: '木', ke: '火' },
};

export interface DailyFortune {
  date: string;             // YYYY-MM-DD
  dayGan: string;           // 日干
  dayZhi: string;           // 日支
  dayElement: string;       // 日干五行
  score: number;            // 综合评分 1-5
  scoreLabel: string;       // 大吉/平稳/偏弱/需谨慎
  summary: string;          // 摘要
  tips: string[];           // 宜/忌提示
  elementRelation: string;   // 与命主关系
  palaceHint: string;       // 命盘关联提示
}

/**
 * 计算今日运势
 * @param chart 用户命盘（可选，传 null 给通用运势）
 */
export function buildDailyFortune(chart: ZiweiChart | null = null): DailyFortune {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const solar = Solar.fromDate(now);
  const lunar = solar.getLunar();

  const dayGan = lunar.getDayGan();
  const dayZhi = lunar.getDayZhi();
  const dayElement = STEM_ELEMENTS[dayGan] ?? '木';

  // 五行评分（基于日干强弱）
  let score = 3;
  let scoreLabel = '平稳';

  if (chart) {
    // 个性化：日干与命主年干五行生克
    const mingGan = STEMS[chart.lunarInfo.yearStem] ?? '甲';
    const mingElement = STEM_ELEMENTS[mingGan] ?? '木';
    const rel = ELEMENT_RELATIONS[dayElement];

    if (rel.sheng === mingElement) {
      score = 5;
      scoreLabel = '大吉';
    } else if (rel.ke === mingElement) {
      score = 2;
      scoreLabel = '需谨慎';
    } else if (dayElement === mingElement) {
      score = 4;
      scoreLabel = '平稳偏吉';
    } else {
      score = 3;
      scoreLabel = '平稳';
    }
  }

  // 综合摘要
  const summary = `今日日干 ${dayGan}（${dayElement}），${scoreLabel}。`;

  // 提示
  const tips: string[] = [];
  if (score >= 4) {
    tips.push('宜：主动出击，把握机遇');
    tips.push('宜：重要决策、社交往来');
    tips.push('忌：保守迟疑');
  } else if (score <= 2) {
    tips.push('宜：修身养性、低调行事');
    tips.push('宜：整理思路、修复关系');
    tips.push('忌：冲动决策、大额投资');
  } else {
    tips.push('宜：稳中求进、循序渐进');
    tips.push('忌：冒进急躁');
  }

  // 命盘关联
  const palaceHint = chart
    ? `日干 ${dayGan} 与命主年干 ${STEMS[chart.lunarInfo.yearStem]} 五行关系：${dayElement === STEM_ELEMENTS[STEMS[chart.lunarInfo.yearStem]] ? '比和' : '生克'}.`
    : '通用今日运势，未关联个人命盘。';

  return {
    date: dateStr,
    dayGan,
    dayZhi,
    dayElement,
    score,
    scoreLabel,
    summary,
    tips,
    elementRelation: palaceHint,
    palaceHint,
  };
}