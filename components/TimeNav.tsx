'use client';

import { motion } from 'framer-motion';

type View = 'benming' | 'daxian' | 'liunian' | 'liuyue';

interface Props {
  view: View;
  onViewChange: (v: View) => void;
  liunianYear: number;
  onLiunianYearChange: (y: number) => void;
}

const VIEWS: { key: View; label: string; icon: string }[] = [
  { key: 'benming', label: '本命', icon: '☯' },
  { key: 'daxian', label: '大限', icon: '⏳' },
  { key: 'liunian', label: '流年', icon: '🌊' },
  { key: 'liuyue', label: '流月', icon: '🌙' },
];

/**
 * 时间维度导航条（命盘上方）
 *
 * 4 个 Tab + 流年选择器。
 * Tab 间切换通过 props 回调通知父组件，父组件（ChartBoard）控制命盘视图。
 */
export default function TimeNav({ view, onViewChange, liunianYear, onLiunianYearChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)]/60 p-0.5">
        {VIEWS.map(v => {
          const isActive = view === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onViewChange(v.key)}
              className={[
                'relative px-2.5 py-1 text-xs font-medium transition-colors rounded-md',
                isActive ? 'text-[var(--gold-soft)]' : 'text-[var(--tx-2)] hover:text-[var(--tx-1)]',
              ].join(' ')}
            >
              {isActive && (
                <motion.div
                  layoutId="time-nav-pill"
                  className="absolute inset-0 rounded-md bg-[var(--gold)]/15 border border-[var(--gold)]/40"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative">
                <span className="mr-0.5">{v.icon}</span>
                {v.label}
              </span>
            </button>
          );
        })}
      </div>

      {view === 'liunian' && (
        <div className="flex items-center gap-1 rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)]/80 px-1 py-0.5">
          <button
            type="button"
            onClick={() => onLiunianYearChange(liunianYear - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-[var(--gold-soft)] transition hover:bg-[var(--gold)]/15 active:scale-90"
            aria-label="上一年"
          >
            ‹
          </button>
          <span className="min-w-[52px] text-center text-sm font-semibold text-[var(--gold-soft)] select-none">
            {liunianYear} 年
          </span>
          <button
            type="button"
            onClick={() => onLiunianYearChange(liunianYear + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-[var(--gold-soft)] transition hover:bg-[var(--gold)]/15 active:scale-90"
            aria-label="下一年"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
