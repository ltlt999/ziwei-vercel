'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

interface Props {
  /** 弹窗开关 */
  open: boolean;
  onClose: () => void;
  /** 要分享的内容 */
  text: string;
  /** 主题名（财运/事业/感情/...）*/
  topic: string;
  /** 主题色（用于卡片边框）*/
  color?: string;
}

/**
 * 解读分享弹窗
 *
 * 设计要点（沿用本地版 skill ziwei-doushu-development 的 ShareModal 经验）：
 *  - 暗色渐变 + 金色装饰线 + 主题色光晕
 *  - 标题：紫微斗数 + 主题标签
 *  - 内容：段落标题（【】格式）+ 正文摘要（最多 14 行 + maxHeight + scroll）
 *  - html2canvas 截图前临时移除 maxHeight，避免截到截断
 *  - iOS 滚动陷阱：fixed inset-0 + overflow-y-auto 内 maxHeight 用 auto
 */
export default function ShareModal({ open, onClose, text, topic, color = '#d4a843' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal 需等客户端挂载完成（避免 SSR hydration mismatch）
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(stripMd(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 静默失败
    }
  };

  const downloadPNG = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      // 截图前临时取消内部滚动限制（让 html2canvas 截完整内容）
      const contentEl = cardRef.current.querySelector('[data-share-content]') as HTMLElement | null;
      const prevMaxHeight = contentEl?.style.maxHeight;
      const prevOverflow = contentEl?.style.overflowY;
      if (contentEl) {
        contentEl.style.maxHeight = 'none';
        contentEl.style.overflowY = 'visible';
      }

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0f',
        useCORS: true,
        logging: false,
      });

      // 恢复
      if (contentEl) {
        contentEl.style.maxHeight = prevMaxHeight ?? '';
        contentEl.style.overflowY = prevOverflow ?? '';
      }

      const link = document.createElement('a');
      const filename = `紫微斗数_${topic}_${new Date().toISOString().slice(0, 10)}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Share download failed:', err);
    } finally {
      setBusy(false);
    }
  };

  // 用 Portal 挂到 body 直系，避免父级 transform/backdrop-filter 影响 fixed 定位
  if (!mounted) return null;
  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-stretch justify-center overflow-hidden bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden sm:h-auto sm:max-h-[90vh] sm:min-h-0 sm:rounded-2xl"
            style={{
              paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
              paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            }}
          >
            {/* 顶部标题栏（固定可见，含关闭按钮） */}
            <div className="flex flex-shrink-0 items-center justify-end px-2 pb-1">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)]/80 text-[var(--tx-2)] shadow-lg backdrop-blur transition hover:text-[var(--tx-1)] active:scale-90"
                title="关闭 (ESC)"
              >
                ✕
              </button>
            </div>

            {/* 分享卡片本体（移动端 flex 收缩，操作栏始终可见） */}
            <div
              ref={cardRef}
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-[var(--sh-lg)] sm:flex-none"
              style={{
                background: `linear-gradient(135deg, #0a0a0f 0%, #1a1428 50%, #0a0a0f 100%)`,
                border: `1px solid ${color}50`,
              }}
            >
              {/* 顶部光晕（截图用，flex-none） */}
              <div
                className="h-1.5 w-full flex-shrink-0"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  boxShadow: `0 0 12px ${color}`,
                }}
              />

              {/* 内容（min-h-0 才能内部滚动） */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5" data-share-content>
                {/* 标题 */}
                <div className="mb-3 text-center">
                  <div className="text-[10px] tracking-[0.3em] text-[var(--tx-3)] uppercase">倪海夏《天纪》</div>
                  <div className="mt-1 text-2xl font-bold bg-gradient-to-br from-[var(--gold-soft)] via-[var(--gold)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                    紫微斗数 · {topic}
                  </div>
                  <div
                    className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${color}25`,
                      color,
                      border: `1px solid ${color}50`,
                    }}
                  >
                    AI 解读
                  </div>
                </div>

                {/* 解读内容 */}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-[var(--bdr-strong)] to-transparent" />

                <div className="space-y-2 text-[13px] leading-[1.85] text-[var(--tx-1)]">
                  {text.split('\n').map((line, i) => {
                    const sectionMatch = /^\*\*【(.+?)】\*\*$/.exec(line.trim());
                    if (sectionMatch) {
                      return (
                        <div
                          key={i}
                          className="mt-2.5 mb-1 flex items-center gap-1.5 text-[13px] font-semibold tracking-wide"
                          style={{ color }}
                        >
                          <span className="inline-block h-3 w-0.5" style={{ background: color }} />
                          {sectionMatch[1]}
                        </div>
                      );
                    }
                    if (!line.trim()) return <br key={i} />;

                    const parts = line.split(/\*\*(.+?)\*\*/g);
                    return (
                      <p key={i} className="text-[13px] leading-[1.85]">
                        {parts.map((p, j) => (
                          <span key={j} className={j % 2 === 1 ? 'text-[var(--gold-soft)] font-medium' : ''}>
                            {p}
                          </span>
                        ))}
                      </p>
                    );
                  })}
                </div>

                <div className="my-4 h-px bg-gradient-to-r from-transparent via-[var(--bdr)] to-transparent" />

                {/* 底部品牌 */}
                <div className="text-center text-[9px] text-[var(--tx-4)]">
                  <div>紫微斗数排盘 · 倪海夏《天纪》体系</div>
                  <div className="mt-0.5 opacity-60">
                    {new Date().toLocaleDateString('zh-CN')} · 仅供娱乐参考
                  </div>
                </div>
              </div>
            </div>

            {/* 操作栏（始终在底部，移动端永远可见） */}
            <div className="mt-3 flex flex-shrink-0 gap-2">
              <button
                onClick={copyText}
                className="flex-1 rounded-lg border border-[var(--bdr)] bg-[var(--bg-card)] py-2.5 text-sm text-[var(--tx-1)] transition hover:border-[var(--bdr-strong)] active:scale-[0.97]"
              >
                {copied ? '✅ 已复制' : '📋 复制文本'}
              </button>
              <button
                onClick={downloadPNG}
                disabled={busy}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-[var(--bg-base)] transition active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                }}
              >
                {busy ? '生成中…' : '⤓ 保存图片'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return createPortal(modal, document.body);
}

/** 清理 Markdown 标记，复制时给纯文本用 */
function stripMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^#{1,3}\s+/gm, '')
    .trim();
}
