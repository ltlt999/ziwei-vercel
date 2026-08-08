'use client';

import { useRouter } from 'next/navigation';
import BirthForm from '@/components/BirthForm';
import DailyFortune from '@/components/DailyFortune';
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
    <main className="font-scale-container min-h-screen bg-cosmic px-4 py-10 md:py-16">
      <header className="mx-auto mb-8 max-w-md text-center">
        <div className="mb-2 text-4xl">☯</div>
        <h1 className="mb-2 text-3xl font-bold leading-tight bg-gradient-to-br from-[var(--gold-soft)] via-[var(--gold)] to-[var(--gold-deep)] bg-clip-text text-transparent md:text-4xl">
          紫微斗数排盘
        </h1>
        <p className="text-sm text-[var(--tx-3)]">
          倪海夏《天纪》体系 · 14 主星 · 12 宫位 · AI 解读
        </p>
      </header>

      <BirthForm onSubmit={handleSubmit} />

      <div className="mx-auto mt-6 max-w-md">
        <DailyFortune chart={null} />
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-[11px] text-[var(--tx-4)] italic">
        本站工具仅供命理学习与娱乐参考，不构成任何人生决策建议。
      </p>
    </main>
  );
}
