'use client';

import { useEffect, useState } from 'react';

/**
 * 字号调节控件（老年友好）
 *
 * 4 档：小 0.85 / 标准 1.0 / 大 1.15 / 特大 1.35
 * 实现：设置 CSS 变量 --font-scale，配合 globals.css 的 .font-scale-container { zoom }
 * 持久化：localStorage 'ziwei-font-scale'，layout.tsx 有 hydration 前防闪烁脚本
 *
 * 来自本地版 ziwei-doushu 的成熟方案（skill ziwei-doushu-development）
 */
const SIZES = [
  { key: 'small', label: '小', scale: 0.85 },
  { key: 'normal', label: '标准', scale: 1.0 },
  { key: 'large', label: '大', scale: 1.15 },
  { key: 'xlarge', label: '特大', scale: 1.35 },
];

const FONT_KEY = 'ziwei-font-scale';

export default function FontSizeControl() {
  const [current, setCurrent] = useState('normal');

  // 初始化：读 localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FONT_KEY) || '{}');
      if (saved?.key && SIZES.some(s => s.key === saved.key)) {
        setCurrent(saved.key);
      }
    } catch {}
  }, []);

  const handleChange = (key: string) => {
    setCurrent(key);
    const size = SIZES.find(s => s.key === key)!;
    // 设置 CSS 变量（作用于 .font-scale-container）
    document.documentElement.style.setProperty('--font-scale', String(size.scale));
    try {
      localStorage.setItem(FONT_KEY, JSON.stringify({ key, scale: size.scale }));
    } catch {}
  };

  return (
    <div
      className="flex items-center rounded-md border border-[var(--bdr)] p-0.5"
      title="字号大小"
    >
      <span className="px-1.5 text-xs text-[var(--tx-3)]">Aa</span>
      {SIZES.map(s => (
        <button
          key={s.key}
          type="button"
          onClick={() => handleChange(s.key)}
          className="rounded px-1.5 py-0.5 text-xs transition"
          style={
            current === s.key
              ? { background: 'var(--gold)', color: '#0a0a0f', fontWeight: 600 }
              : { color: 'var(--tx-2)' }
          }
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
