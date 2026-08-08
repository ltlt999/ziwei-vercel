'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import BirthForm from '@/components/BirthForm';
import DailyFortune from '@/components/DailyFortune';
import FontSizeControl from '@/components/FontSizeControl';
import type { BirthInfo } from '@/lib/ziwei/types';

const STORAGE_KEY = 'ziwei-chart-input';  // 用户输入的出生信息（不含完整 chart）

export default function HomePage() {
  const router = useRouter();

  const handleSubmit = (birth: BirthInfo) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(birth));
    } catch {}
    router.push('/chart');
  };

  return (
    <main className="font-scale-container min-h-screen bg-cosmic px-4 py-10 md:py-14">
      {/* 顶部工具栏：字号调节 */}
      <div className="mx-auto mb-8 flex max-w-md items-center justify-end">
        <FontSizeControl />
      </div>

      <header className="mx-auto mb-8 max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-3 flex items-center justify-center"
        >
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-4xl shadow-[0_0_24px_var(--gold-glow)]">
            <span className="taiji-spin">☯</span>
            <span className="absolute inset-0 rounded-full border border-[var(--gold)]/20 animate-pulse" />
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-2 text-4xl font-bold leading-tight title-gold-flow md:text-5xl"
        >
          紫微斗数排盘
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-[var(--tx-3)] tracking-wide"
        >
          倪海夏《天纪》体系 · 14 主星 · 12 宫位 · AI 解读
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="divider-flow mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent"
        />
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <BirthForm onSubmit={handleSubmit} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mx-auto mt-6 max-w-md"
      >
        <DailyFortune chart={null} />
      </motion.div>

      <p className="mx-auto mt-6 max-w-md text-center text-[11px] text-[var(--tx-4)] italic">
        本站工具仅供命理学习与娱乐参考，不构成任何人生决策建议。
      </p>
    </main>
  );
}
