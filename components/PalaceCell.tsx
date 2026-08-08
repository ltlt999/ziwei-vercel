'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Palace } from '@/lib/ziwei/types';

interface Props {
  palace: Palace;
  onClick?: (palace: Palace) => void;
  compact?: boolean;  // 流年/流月叠加视图用紧凑模式
}

/**
 * 单个宫位渲染单元
 *
 * 设计要点：
 *  - 暗色背景 + 金色虚线边框（空宫专属）
 *  - 命宫金色脉冲（hover 时缩放）
 *  - 主星加粗 + 四化角标
 *  - 副星透明度 0.65
 *  - 借对宫"在 X 宫"提示（空宫时）
 */
export default function PalaceCell({ palace, onClick, compact }: Props) {
  const handleClick = () => onClick?.(palace);

  const siHuaColor: Record<string, string> = {
    '禄': 'text-[var(--gold)]',
    '权': 'text-[var(--red)]',
    '科': 'text-[var(--blue)]',
    '忌': 'text-[var(--green)]',
  };

  // 命宫：边框金色 + 阴影辉光
  // 空宫：虚线 + "借对宫"提示
  // 当前大限：底部小条金色高亮
  const isEmpty = palace.isEmpty;
  const isMing = palace.isMingGong;
  const isCurrentDx = palace.isCurrentDaXian;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={clsx(
        'group relative h-full w-full text-left p-2 transition-colors',
        'bg-[var(--bg-card)] border rounded-lg overflow-hidden',
        isMing
          ? 'border-[var(--gold)] shadow-[0_0_12px_var(--gold-glow)]'
          : isEmpty
            ? 'border-dashed border-[var(--bdr)]'
            : 'border-[var(--bdr)] hover:border-[var(--bdr-strong)]',
      )}
    >
      {/* 宫名（顶部） */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={clsx(
            'tracking-wider truncate',
            isMing ? 'text-[var(--gold-soft)] font-semibold' : 'text-[var(--tx-2)]',
          )}
        >
          {palace.name}
        </span>
        {isCurrentDx && (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold-glow)]" />
        )}
      </div>

      {/* 星曜列表 */}
      <div className={clsx('mt-1 space-y-0.5', compact && 'text-[10px]')}>
        {palace.stars.length === 0 ? (
          <div className="text-[10px] text-[var(--tx-4)] italic mt-1">
            {isEmpty && palace.borrowedFromName
              ? `借${palace.borrowedFromName}`
              : '—'}
          </div>
        ) : (
          palace.stars.map((s, idx) => {
            const isMajor = s.type === 'major';
            return (
              <div
                key={`${s.name}-${idx}`}
                className={clsx(
                  'flex items-center justify-between gap-1 truncate',
                  isMajor ? 'text-sm font-medium text-[var(--tx-1)]' : 'text-[11px] text-[var(--tx-3)] opacity-80',
                )}
              >
                <span className="truncate">{s.name}</span>
                {s.siHua && (
                  <span
                    className={clsx(
                      'ml-1 text-[10px] font-bold px-1 rounded',
                      siHuaColor[s.siHua] || 'text-[var(--tx-2)]',
                    )}
                  >
                    {s.siHua}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 大限底部条 */}
      {palace.daXianAge && !compact && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--bdr)]" />
      )}
    </motion.button>
  );
}
