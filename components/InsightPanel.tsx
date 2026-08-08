'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { ZiweiChart, InterpretMessage } from '@/lib/ziwei/types';
import LoadingIndicator from './LoadingIndicator';
import ShareModal from './ShareModal';

interface Props {
  chart: ZiweiChart;
  selectedPalace?: any | null;
}

type TopicKey = 'overview' | 'wealth' | 'career' | 'love' | 'health' | 'personality';

interface TopicDef {
  key: TopicKey;
  label: string;
  icon: string;
  color: string;
  greeting: string;  // 首次提问模板
}

const TOPICS: TopicDef[] = [
  { key: 'overview', label: '命格', icon: '✦', color: '#d4a843', greeting: '请帮我详细解读命盘总览' },
  { key: 'wealth', label: '财运', icon: '◆', color: '#5a9a72', greeting: '我的财运如何？什么时候有大的进展？' },
  { key: 'career', label: '事业', icon: '◈', color: '#4a6fa5', greeting: '我的事业运势如何？适合什么方向？' },
  { key: 'love', label: '感情', icon: '♡', color: '#d68489', greeting: '我的感情运势如何？什么时候有正缘？' },
  { key: 'health', label: '健康', icon: '◎', color: '#c97070', greeting: '我的健康要注意什么？' },
  { key: 'personality', label: '性格', icon: '●', color: '#9b7eb8', greeting: '我的性格特点是什么？' },
];

interface TabData {
  messages: InterpretMessage[];
  loaded: boolean;
}

/**
 * 解读面板 — 6 主题 Tab + SSE 流式 + 追问
 *
 * 设计核心（来自 skill ziwei-doushu-development）：
 *  1. **状态机互斥**：empty state / 底部 LoadingIndicator / 流式光标 三者最多同时显示 1 个
 *  2. **每 Tab 独立缓存**：Record<TopicKey, TabData>，切换不丢数据
 *  3. **懒加载**：首次切 Tab 才发请求（!tabs[key].loaded 时才 load）
 *  4. **追问隔离**：API messages 只含当前 Tab 历史
 *  5. **主题色联动**：Tab 颜色、LoadingIndicator 颜色、发送按钮 颜色 跟随当前 Tab
 *  6. **光标**：流式末尾显示 ▌
 */
export default function InsightPanel({ chart, selectedPalace }: Props) {
  const [activeTab, setActiveTab] = useState<TopicKey>('overview');
  const [shareMsg, setShareMsg] = useState<{ text: string; topic: string; color: string } | null>(null);
  const [tabs, setTabs] = useState<Record<TopicKey, TabData>>(() =>
    TOPICS.reduce((acc, t) => {
      acc[t.key] = { messages: [], loaded: false };
      return acc;
    }, {} as Record<TopicKey, TabData>),
  );
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const autoLoadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentTopic = TOPICS.find(t => t.key === activeTab)!;
  const currentTab = tabs[activeTab];

  // ─── 自动加载 overview ─────────────────────────────────
  useEffect(() => {
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    if (!tabs.overview.loaded) {
      handleSend(TOPICS[0].greeting, 'overview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 切 Tab 时懒加载（首次切）───────────────────────────
  const handleTabChange = (key: TopicKey) => {
    if (key === activeTab) return;
    setActiveTab(key);
    if (!tabs[key].loaded) {
      const topic = TOPICS.find(t => t.key === key)!;
      handleSend(topic.greeting, key);
    }
  };

  // ─── 流式 fetch 并把每个 delta 追加到 messages ─────────
  const handleSend = useCallback(async (text: string, tabKey: TopicKey = activeTab) => {
    if (!text.trim() || loading) return;

    const topic = TOPICS.find(t => t.key === tabKey)!;

    // 取当前 tab 已有历史 + 新 user 消息
    const existingMessages = tabs[tabKey].messages;
    const updatedMessages: InterpretMessage[] = [
      ...existingMessages,
      { role: 'user', content: text, ts: Date.now() },
      { role: 'assistant', content: '', ts: Date.now() },  // 占位
    ];

    setTabs(prev => ({
      ...prev,
      [tabKey]: { messages: updatedMessages, loaded: true },
    }));
    setInputValue('');
    setLoading(true);

    // 中断上一次未完成的请求
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart,
          messages: updatedMessages
            .filter((_, i) => i < updatedMessages.length - 1)  // 排除最后一个占位
            .concat([{ role: 'user', content: text }]),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const json = JSON.parse(payload);
            const delta = json?.delta?.text;
            if (delta) {
              setTabs(prev => {
                const msgs = prev[tabKey].messages;
                const last = msgs[msgs.length - 1];
                if (!last || last.role !== 'assistant') return prev;
                return {
                  ...prev,
                  [tabKey]: {
                    ...prev[tabKey],
                    messages: [...msgs.slice(0, -1), { ...last, content: last.content + delta }],
                  },
                };
              });
            }
          } catch {
            // 忽略不完整帧
          }
        }
      }
    } catch (err: any) {
      // 用户中断或失败：标记失败气泡
      setTabs(prev => {
        const msgs = prev[tabKey].messages;
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return {
            ...prev,
            [tabKey]: {
              ...prev[tabKey],
              messages: [
                ...msgs.slice(0, -1),
                { ...last, content: '⚠️ 推演中断，请稍候再试。' },
              ],
            },
          };
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, [tabs, activeTab, loading, chart]);

  // ─── 用户提交追问 ─────────────────────────────────────
  const onUserSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    handleSend(inputValue);
  };

  return (
    <div className="panel-topline flex h-full min-h-[520px] flex-col rounded-2xl border border-[var(--bdr)] bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-[var(--sh-md)]">
      {/* ─── 顶部 Tab 栏 ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--bdr)] px-2 pt-2 pb-1.5">
        {TOPICS.map(t => {
          const isActive = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={clsx(
                'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition',
                isActive
                  ? 'text-[var(--tx-1)]'
                  : 'text-[var(--tx-3)] hover:text-[var(--tx-1)]',
              )}
              style={isActive ? {
                background: `${t.color}25`,
                border: `1px solid ${t.color}80`,
                color: t.color,
              } : {
                background: 'transparent',
                border: '1px solid transparent',
              }}
            >
              <span style={{ color: isActive ? t.color : undefined }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 消息流（互斥 loading 状态机） ─────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ minHeight: 320 }}>
        {/* 状态机 A: 完全空 + 不在 loading → 不显示任何（overview 自动加载会立刻进入状态 C）*/}

        {/* 状态机 B: empty state（消息数为 0 + 没在 load） */}
        {currentTab.messages.length === 0 && !loading && (
          <LoadingIndicator
            color={currentTopic.color}
            icon={currentTopic.icon}
            main={`推演${currentTopic.label}中`}
            sub="AI 正在排定星辰..."
          />
        )}

        {/* 消息列表（已加载的） */}
        {currentTab.messages.map((m, i) => {
          const isLast = i === currentTab.messages.length - 1;
          const isStreaming = loading && isLast && m.role === 'assistant';

          if (m.role === 'user') {
            return (
              <div key={i} className="mb-2.5 flex justify-end">
                <div
                  className="max-w-[80%] rounded-xl px-3.5 py-2.5 text-[15px] leading-[1.7]"
                  style={{ background: `${currentTopic.color}20`, color: 'var(--tx-1)' }}
                >
                  {m.content}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="mb-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-[13px]">
                <span style={{ color: currentTopic.color }}>{currentTopic.icon}</span>
                <span style={{ color: currentTopic.color }} className="font-medium">
                  {currentTopic.label}解读
                </span>
              </div>
              <div className="relative rounded-xl bg-[var(--bg-elevated)] px-3.5 py-3 text-[15px] leading-[1.75] text-[var(--tx-1)]">
                <AiContent text={m.content} streaming={isStreaming} accentColor={currentTopic.color} />
                {isStreaming && m.content.length > 0 && (
                  <span className="ml-0.5 animate-pulse" style={{ color: currentTopic.color }}>▌</span>
                )}
                {/* 分享按钮（流式中隐藏）*/}
                {!isStreaming && m.content && !m.content.startsWith('⚠️') && (
                  <button
                    type="button"
                    onClick={() => setShareMsg({ text: m.content, topic: currentTopic.label, color: currentTopic.color })}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--tx-3)] transition hover:bg-[var(--bg-card)] hover:text-[var(--tx-1)] active:scale-90"
                    title="分享解读"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 状态机 C: 底部 LoadingIndicator（流式刚开始，占位 assistant 为空）*/}
        {loading && currentTab.messages.length > 0 && (() => {
          const last = currentTab.messages[currentTab.messages.length - 1];
          if (last?.role === 'assistant' && last.content.length > 0) return null;  // 有内容 → 流式光标接管
          if (currentTab.messages.filter(m => m.role === 'assistant').length > 0 && last?.role === 'user') {
            // 已发 user，等 AI 占位 → 显示
            return (
              <LoadingIndicator
                color={currentTopic.color}
                icon={currentTopic.icon}
                main={`推演${currentTopic.label}中`}
                sub="AI 正在排定星辰..."
              />
            );
          }
          return null;
        })()}
      </div>

      {/* ─── 输入栏 ──────────────────────────────────── */}
      <form
        onSubmit={onUserSubmit}
        className="flex items-center gap-2 border-t border-[var(--bdr)] px-2.5 py-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={`追问${currentTopic.label}…`}
          disabled={loading}
          className="flex-1 rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)] px-3 py-2 text-[15px] text-[var(--tx-1)] placeholder:text-[var(--tx-4)] focus:border-[var(--gold)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="rounded-lg px-4 py-2 text-[15px] font-medium disabled:opacity-30 transition active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${currentTopic.color}, ${currentTopic.color}cc)`,
            color: '#0a0a0f',
          }}
        >
          发送
        </button>
      </form>

      {/* 分享弹窗（分享解读气泡为 PNG）*/}
      <ShareModal
        open={!!shareMsg}
        onClose={() => setShareMsg(null)}
        text={shareMsg?.text ?? ''}
        topic={shareMsg?.topic ?? ''}
        color={shareMsg?.color}
      />
    </div>
  );
}

/**
 * AI 内容渲染器（Markdown 简化版）
 *
 * - **【段落】** → 金色加粗
 * - 普通文本 → 默认色
 *
 * Phase 6 复用：这里刻意暂简，Phase 6 加 react-markdown + remark-gfm 走富文本渲染
 */
function AiContent({ text, streaming, accentColor }: { text: string; streaming: boolean; accentColor: string }) {
  // 行级处理：**【xxx】** → 段落标题
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const sectionMatch = /^\*\*【(.+?)】\*\*$/.exec(line.trim());
        if (sectionMatch) {
          return (
            <div
              key={i}
              className="mt-2 mb-1 text-[15px] font-semibold"
              style={{ color: accentColor }}
            >
              ▎{sectionMatch[1]}
            </div>
          );
        }
        if (!line.trim()) return <br key={i} />;

        // 行内加粗
        const boldParts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <div key={i} className="text-[15px] leading-[1.75]">
            {boldParts.map((part, j) => (
              <span key={j} className={j % 2 === 1 ? 'text-[var(--gold-soft)] font-medium' : ''}>
                {part}
              </span>
            ))}
          </div>
        );
      })}
      {streaming && text.length === 0 && (
        <span className="text-[var(--tx-3)] text-sm italic">AI 思考中…</span>
      )}
    </div>
  );
}
