'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import DailyFortune from '@/components/DailyFortune';
import FontSizeControl from '@/components/FontSizeControl';
import type { ZiweiChart, BirthInfo, Palace } from '@/lib/ziwei/types';

const STORAGE_INPUT_KEY = 'ziwei-chart-input';
const STORAGE_CHART_KEY = 'ziwei-chart-data';

const LAYOUT_KEY = 'ziwei-layout-mode';
type LayoutMode = 'horizontal' | 'vertical';

export default function ChartPage() {
  const router = useRouter();
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── 加载 chart（cached → generate）───────────────
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CHART_KEY);
      if (cached) {
        setChart(JSON.parse(cached));
        return;
      }
    } catch {}

    try {
      const inputStr = localStorage.getItem(STORAGE_INPUT_KEY);
      if (!inputStr) {
        router.replace('/');
        return;
      }
      const input: BirthInfo = JSON.parse(inputStr);

      // 动态 import 以避免 SSR 阶段执行 iztro
      import('@/lib/ziwei/algorithm').then(mod => {
        try {
          const newChart = mod.generateChart(input);
          setChart(newChart);
          try {
            localStorage.setItem(STORAGE_CHART_KEY, JSON.stringify(newChart));
          } catch {}
        } catch (err: any) {
          setError(`排盘失败：${err.message}`);
        }
      });
    } catch (err: any) {
      setError(`读取输入失败：${err.message}`);
      router.replace('/');
    }
  }, [router]);

  // ─── 加载布局选择 ─────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === 'vertical' || saved === 'horizontal') setLayoutMode(saved);
    } catch {}
  }, []);

  const changeLayout = (m: LayoutMode) => {
    setLayoutMode(m);
    try {
      localStorage.setItem(LAYOUT_KEY, m);
    } catch {}
  };

  // ─── 检查 AI 配置 ──────────────────────────────
  useEffect(() => {
    fetch('/api/ai-settings')
      .then(r => r.json())
      .then(data => setAiConfigured(!!data.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  // ─── 重新起盘 ──────────────────────────────────
  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_CHART_KEY);
      localStorage.removeItem(STORAGE_INPUT_KEY);
    } catch {}
    router.replace('/');
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-3">⚠</div>
          <p className="text-[var(--red)] mb-4">{error}</p>
          <button onClick={() => router.replace('/')} className="rounded-lg bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold-deep)] px-4 py-2 text-[var(--bg-base)]">
            ← 回到首页
          </button>
        </div>
      </main>
    );
  }

  if (!chart) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tx-3)] text-sm">排盘推算中...</div>
      </main>
    );
  }

  return (
    <main className="font-scale-container min-h-screen bg-cosmic px-3 py-4 md:px-6 md:py-6">
      {/* 顶部工具栏 */}
      <div className="mx-auto mb-3 flex max-w-7xl flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--bdr)] bg-[var(--bg-card)]/60 px-3 py-2 backdrop-blur-xl">
        <button
          onClick={handleReset}
          className="rounded-lg border border-[var(--bdr)] px-3 py-1.5 text-xs text-[var(--tx-2)] hover:border-[var(--bdr-strong)] transition active:scale-95"
        >
          ← 重新起盘
        </button>

        <div className="flex items-center gap-2">
          {/* AI 状态指示器 */}
          {aiConfigured !== null && (
            <span
              className="rounded-md px-2 py-0.5 text-[11px]"
              style={{
                background: aiConfigured ? 'rgba(90,154,114,0.15)' : 'rgba(201,112,112,0.15)',
                color: aiConfigured ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${aiConfigured ? 'var(--green)' : 'var(--red)'}40`,
              }}
            >
              {aiConfigured ? '✦ AI 已配置' : '○ AI 未配置'}
            </span>
          )}

          {/* 字号调节 */}
          <FontSizeControl />

          {/* 布局切换 */}
          <div className="flex rounded-md border border-[var(--bdr)] p-0.5">
            <button
              type="button"
              onClick={() => changeLayout('horizontal')}
              className="rounded px-2 py-0.5 text-xs"
              style={layoutMode === 'horizontal' ? { background: 'var(--gold)', color: '#0a0a0f' } : { color: 'var(--tx-2)' }}
              title="左右布局"
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => changeLayout('vertical')}
              className="rounded px-2 py-0.5 text-xs"
              style={layoutMode === 'vertical' ? { background: 'var(--gold)', color: '#0a0a0f' } : { color: 'var(--tx-2)' }}
              title="上下布局"
            >
              ⊟
            </button>
          </div>
        </div>
      </div>

      {/* 今日运势（个性化版）*/}
      <div className="mx-auto mb-3 max-w-7xl">
        <DailyFortune chart={chart} />
      </div>

      {/* 主区域：命盘 + 解读 */}
      <div
        className={`mx-auto grid max-w-7xl chart-grid chart-grid--${layoutMode}`}
        style={{
          gap: layoutMode === 'vertical' ? 18 : 22,
        }}
      >
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <InsightPanel chart={chart} selectedPalace={selectedPalace} />
      </div>

      {/* 底部免责 */}
      <p className="mx-auto mt-6 max-w-7xl text-center text-[11px] text-[var(--tx-4)] italic">
        本站工具仅供命理学习与娱乐参考，不构成任何人生决策建议。
      </p>
    </main>
  );
}
