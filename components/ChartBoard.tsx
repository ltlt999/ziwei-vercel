'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import PalaceCell from './PalaceCell';
import TimeNav from './TimeNav';

interface Props {
  chart: ZiweiChart;
  onPalaceSelect?: (palace: Palace) => void;
}

/**
 * 12 宫位命盘棋盘
 *
 * 布局：3×4 网格，左到右上到下逆时针
 *  ┌──┬──┬──┬──┐
 *  │ 巳│ 午│ 未│ 申│
 *  │寅宫│卯宫│辰宫│巳宫│
 *  │ 辰│ 卯│ 寅│ 丑│
 *  ├──────中央（大限/流年中央信息）──────┤
 *  │ 酉│ ── │ 丑│ 子│
 *  │申宫│ 中 │子宫│亥宫│
 *  │ 戌│ ── │ 寅│ 亥│
 *  └─────┴──┴──┴──┘
 * （4×3 标准紫微盘布局）
 *
 * 顶层 TimeNav 切换本命 / 大限 / 流年 / 流月：
 *  - 本命：当前 chart.palaces 十二宫
 *  - 大限：星曜按四化飞星重新挂载（Phase 7 时暂简化为宫中显示当前大限）
 *  - 流年/流月：根据 view 切换简化展示（标记当前流年/流月宫）
 *
 * 设计原则：
 *  - 本命视图：12 格完整显示，所有宫位
 *  - 大限视图：当前大限宫位加金色边框，其他宫位降透明度
 *  - 流年视图：命盘主体不变，加金色"流年命宫"标记
 */
export default function ChartBoard({ chart, onPalaceSelect }: Props) {
  const [timeView, setTimeView] = useState<'benming' | 'daxian' | 'liunian' | 'liuyue'>('benming');
  const [liunianYear, setLiunianYear] = useState(new Date().getFullYear());
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);

  const handlePalaceClick = (palace: Palace) => {
    setSelectedPalace(palace);
    onPalaceSelect?.(palace);
  };

  // ─── 排序：12 宫按地支顺序，支 0=子 1=丑 ... 11=亥
  // 紫微盘显示顺序：寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑（命宫起逆时针）
  // 对应：从命宫地支开始，按地支逆时针布 12 格
  const orderedPalaces = useMemo(() => {
    if (!chart.palaces.length) return [];

    const mingPalace = chart.palaces.find(p => p.isMingGong);
    if (!mingPalace) return chart.palaces;

    const startBranch = mingPalace.branch;
    const result: Palace[] = [];
    for (let i = 0; i < 12; i++) {
      const targetBranch = (startBranch - i + 12) % 12;
      const palace = chart.palaces.find(p => p.branch === targetBranch);
      if (palace) result.push(palace);
    }
    return result;
  }, [chart.palaces]);

  // 视图模式下对宫位的额外 CSS class
  const getPalaceClass = (palace: Palace): string => {
    if (timeView === 'daxian' && !palace.isCurrentDaXian) {
      return 'opacity-50';
    }
    return '';
  };

  if (orderedPalaces.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--tx-3)]">
        排盘中...
      </div>
    );
  }

  return (
    <div className="chart-panel panel-topline rounded-2xl border border-[var(--bdr)] bg-[var(--bg-card)]/60 backdrop-blur-xl p-3 shadow-[var(--sh-md)]">
      {/* 顶部时间维度切换 */}
      <TimeNav
        view={timeView}
        onViewChange={setTimeView}
        liunianYear={liunianYear}
        onLiunianYearChange={setLiunianYear}
      />

      {/* 命盘中央信息条（三徽章） */}
      <div className="panel-topline my-2 md:my-3 flex items-center justify-between gap-1 md:gap-2 rounded-lg bg-gradient-to-r from-[var(--purple)]/12 via-transparent to-[var(--blue)]/12 border border-[var(--bdr)] px-2 md:px-3 py-1.5 md:py-2">
        <span className="info-badge text-[10px] md:text-xs px-2 md:px-2.5">☯ {chart.wuxingJuName}</span>
        <span className="info-badge info-badge--muted text-[10px] md:text-xs px-2 md:px-2.5">🎂 {chart.currentAge} 岁</span>
        <span className="info-badge text-[10px] md:text-xs px-2 md:px-2.5">{liunianYear}</span>
      </div>

      {/* 12 格命盘（4×4 标准紫微盘：四边 12 宫 + 中央 2×2 信息块） */}
      <div className="chart-grid-board grid grid-cols-4 grid-rows-4 gap-1 p-1 aspect-square w-full">
        {/* 四角角饰 */}
        <div className="chart-corners" />

        {/* 上排 4 格 */}
        {orderedPalaces.slice(0, 4).map((p, i) => (
          <PalaceCell key={`p-${p.branch}`} palace={{ ...p, name: wrapName(p.name) }} onClick={handlePalaceClick} enterDelay={i * 0.05} />
        ))}

        {/* 中上：左格 + 中央 2×2 信息块 + 右格 */}
        <PalaceCell palace={{ ...orderedPalaces[4], name: wrapName(orderedPalaces[4].name) }} onClick={handlePalaceClick} enterDelay={4 * 0.05} />
        <div className="chart-center-block col-span-2 row-span-2 flex flex-col items-center justify-center rounded-lg px-1 md:px-2 text-center">
          <div className="text-[9px] md:text-[11px] text-[var(--tx-3)] tracking-[0.3em] mt-3">紫微斗数</div>
          <div className="my-0.5 md:my-1 text-sm md:text-xl chart-center-title">命 盘</div>
          <div className="hidden md:block text-[11px] text-[var(--gold-soft)] tracking-wider">五行局 · {chart.wuxingJuName}</div>
          <div className="hidden md:block text-[11px] text-[var(--tx-2)]">{chart.currentAge} 岁</div>
          <div className="mt-2 rounded-full border border-[var(--bdr)] px-2.5 py-0.5 text-[10px] text-[var(--tx-3)] tracking-wider">
            {timeView === 'benming' && '☯ 本命'}
            {timeView === 'daxian' && '⏳ 大限'}
            {timeView === 'liunian' && `🌊 ${liunianYear} 流年`}
            {timeView === 'liuyue' && '🌙 本月'}
          </div>
          {selectedPalace && (
            <button
              onClick={() => setSelectedPalace(null)}
              className="mt-1.5 text-[10px] text-[var(--tx-3)] underline hover:text-[var(--tx-1)]"
            >
              ✕ 清除选中
            </button>
          )}
        </div>
        <PalaceCell palace={{ ...orderedPalaces[5], name: wrapName(orderedPalaces[5].name) }} onClick={handlePalaceClick} enterDelay={5 * 0.05} />

        {/* 中下：左格 + 右格（中央块已占） */}
        <PalaceCell palace={{ ...orderedPalaces[6], name: wrapName(orderedPalaces[6].name) }} onClick={handlePalaceClick} enterDelay={6 * 0.05} />
        <PalaceCell palace={{ ...orderedPalaces[7], name: wrapName(orderedPalaces[7].name) }} onClick={handlePalaceClick} enterDelay={7 * 0.05} />

        {/* 下排 4 格 */}
        {orderedPalaces.slice(8, 12).map((p, i) => (
          <PalaceCell key={`p-${p.branch}`} palace={{ ...p, name: wrapName(p.name) }} onClick={handlePalaceClick} enterDelay={(i + 8) * 0.05} />
        ))}
      </div>

      {/* 宫位详情侧栏（如果选中） */}
      <AnimatePresence>
        {selectedPalace && (
          <motion.aside
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--bdr)] p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--gold-soft)] font-medium">{wrapName(selectedPalace.name)}</span>
              <button onClick={() => setSelectedPalace(null)} className="text-[var(--tx-3)] hover:text-[var(--tx-1)]">✕</button>
            </div>
            <div className="text-[var(--tx-2)] space-y-1.5">
              {selectedPalace.stars.length === 0 ? (
                <div className="italic">
                  空宫{selectedPalace.borrowedFromName ? ` · 借${selectedPalace.borrowedFromName}主星` : ''}
                </div>
              ) : (
                selectedPalace.stars.map((s, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span>{s.name}</span>
                    <span className="text-[var(--tx-3)]">{s.siHua || ''}{s.brightness === 'bright' ? '·庙' : s.brightness === 'dim' ? '·陷' : ''}</span>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 宫名简化包装：本地版风格 "寅宫 命宫" → 显示成 "寅"
 * 这里简单地保留，但展示位置在 cell 顶部空间有限，留给 cell 自行 truncate
 */
function wrapName(name: string): string {
  if (name.endsWith('宫')) return name;
  return name;
}
