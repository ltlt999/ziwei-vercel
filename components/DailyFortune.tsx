'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { buildDailyFortune } from '@/lib/ziwei/daily';
import type { ZiweiChart } from '@/lib/ziwei/types';

interface Props {
  chart?: ZiweiChart | null;
}

/**
 * 今日运势卡片
 *
 * - 传 chart → 个性化版本（结合日干五行与命主五行生克分析）
 * - 不传 chart → 通用版本（只显示当日干支与宜忌）
 *
 * 设计要点：
 *  - 评分四级：🟢大吉 (5) / 🟡平稳 (3-4) / 🟠偏弱 (2) / 🔴需谨慎 (1)
 *  - 动画：进入时从下方上升 + 渐显
 *  - 可折叠：标题点击展开/收起
 */
export default function DailyFortune({ chart }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [fortune, setFortune] = useState(() => buildDailyFortune(chart ?? null));

  // chart prop 变化时（如起盘后）重新计算
  useEffect(() => {
    setFortune(buildDailyFortune(chart ?? null));
  }, [chart]);

  const isPersonalized = !!chart;

  const scoreColor: Record<number, string> = {
    5: 'var(--green)',
    4: 'var(--gold)',
    3: 'var(--gold)',
    2: '#d49043',
    1: 'var(--red)',
  };
  const scoreEmoji: Record<number, string> = {
    5: '🟢',
    4: '🟢',
    3: '🟡',
    2: '🟠',
    1: '🔴',
  };

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-[var(--bdr)] bg-[var(--bg-card)]/80 backdrop-blur-xl p-4 shadow-[var(--sh-sm)]"
    >
      {/* 头部（点击折叠） */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <div>
            <div className="text-sm font-medium text-[var(--tx-1)]">
              今日运势 {isPersonalized && <span className="ml-1 text-[10px] text-[var(--gold)]">· 个性化</span>}
            </div>
            <div className="text-[10px] text-[var(--tx-3)]">{today}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: `${scoreColor[fortune.score]}25`,
              color: scoreColor[fortune.score],
              border: `1px solid ${scoreColor[fortune.score]}50`,
            }}
          >
            {scoreEmoji[fortune.score]} {fortune.scoreLabel}
          </div>
          <span
            className="text-[var(--tx-3)] transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-2.5"
        >
          {/* 干支 */}
          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs">
            <span className="text-[var(--tx-3)]">
              {fortune.dayGan}{fortune.dayZhi}日 · 五行属 <span style={{ color: scoreColor[fortune.score] }}>{fortune.dayElement}</span>
            </span>
            {isPersonalized && (
              <span className="text-[10px] text-[var(--gold)]">
                ⚡ {fortune.elementRelation}
              </span>
            )}
          </div>

          {/* 摘要 */}
          <p className="text-sm leading-relaxed text-[var(--tx-1)]">{fortune.summary}</p>

          {/* 命盘关联提示（仅个性化版）*/}
          {isPersonalized && fortune.palaceHint && (
            <div className="rounded-lg border border-dashed border-[var(--gold)]/40 bg-[var(--gold)]/5 px-3 py-2 text-xs text-[var(--gold-soft)]">
              🪐 {fortune.palaceHint}
            </div>
          )}

          {/* 宜/忌 */}
          {fortune.tips && fortune.tips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {fortune.tips.map((tip, i) => (
                <span
                  key={i}
                  className="rounded-md border border-[var(--bdr)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--tx-2)]"
                >
                  {tip}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 免责 */}
      <p className="mt-2 text-center text-[10px] italic text-[var(--tx-4)]">
        {isPersonalized ? '结合命盘与天干地支，仅供参考' : '通用运势，仅供娱乐参考'}
      </p>
    </motion.div>
  );
}
