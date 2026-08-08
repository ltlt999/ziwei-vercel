'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BirthInfo } from '@/lib/ziwei/types';

interface Props {
  onSubmit: (birth: BirthInfo) => void;
}

const HOURS: { index: number; label: string; range: string }[] = [
  { index: 0, label: '子时', range: '23-01' },
  { index: 1, label: '丑时', range: '01-03' },
  { index: 2, label: '寅时', range: '03-05' },
  { index: 3, label: '卯时', range: '05-07' },
  { index: 4, label: '辰时', range: '07-09' },
  { index: 5, label: '巳时', range: '09-11' },
  { index: 6, label: '午时', range: '11-13' },
  { index: 7, label: '未时', range: '13-15' },
  { index: 8, label: '申时', range: '15-17' },
  { index: 9, label: '酉时', range: '17-19' },
  { index: 10, label: '戌时', range: '19-21' },
  { index: 11, label: '亥时', range: '21-23' },
];

type Step = 1 | 2 | 3 | 4;

/**
 * 起盘表单（4 步向导）
 *
 * Step 1: 年月日（公历）
 * Step 2: 时辰（子丑寅...）
 * Step 3: 性别
 * Step 4: 确认 + 起盘
 *
 * 设计要点：
 *  - 进度条 4 段，每段 25%
 *  - 上一步/下一步按钮在底部
 *  - 不能跳过（必须顺序填）
 */
export default function BirthForm({ onSubmit }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [year, setYear] = useState<number>(1990);
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [hour, setHour] = useState<number>(0);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');

  const stepValid = {
    1: () => year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31,
    2: () => hour >= 0 && hour <= 11,
    3: () => gender === 'male' || gender === 'female',
    4: () => true,
  }[step]();

  const handleNext = () => {
    if (!stepValid) return;
    if (step < 4) setStep((step + 1) as Step);
    else {
      onSubmit({
        year,
        month,
        day,
        hour,
        gender,
        name: name.trim() || undefined,
      });
    }
  };

  const handlePrev = () => step > 1 && setStep((step - 1) as Step);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--bdr)] bg-[var(--bg-card)]/80 backdrop-blur-xl p-5 shadow-[var(--sh-md)]">
      {/* 进度条 */}
      <div className="mb-5 flex items-center gap-1.5">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold)]' : 'bg-[var(--bg-elevated)]'
            }`}
          />
        ))}
      </div>

      {/* 步骤主体 */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 text-sm text-[var(--tx-3)]">
              第 <span className="text-[var(--gold)] font-mono">{step}</span> / 4 步
            </div>

            {step === 1 && (
              <>
                <h2 className="mb-4 text-xl font-semibold bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                  出生日期
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput label="年" value={year} min={1900} max={2100} onChange={setYear} />
                  <NumberInput label="月" value={month} min={1} max={12} onChange={setMonth} />
                  <NumberInput label="日" value={day} min={1} max={31} onChange={setDay} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mb-4 text-xl font-semibold bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                  出生时辰
                </h2>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {HOURS.map(h => (
                    <button
                      key={h.index}
                      type="button"
                      onClick={() => setHour(h.index)}
                      className={`rounded-lg border px-2.5 py-2.5 text-left transition ${
                        hour === h.index
                          ? 'border-[var(--gold)] bg-[var(--gold)]/15 shadow-[0_0_8px_var(--gold-glow)]'
                          : 'border-[var(--bdr)] bg-[var(--bg-elevated)] hover:border-[var(--bdr-strong)]'
                      }`}
                    >
                      <div className="text-sm font-medium">{h.label}</div>
                      <div className="text-[10px] text-[var(--tx-3)]">{h.range}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="mb-4 text-xl font-semibold bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                  性别
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-xl border-2 px-4 py-8 text-2xl transition ${
                        gender === g
                          ? 'border-[var(--gold)] bg-[var(--gold)]/15 shadow-[0_0_8px_var(--gold-glow)]'
                          : 'border-[var(--bdr)] bg-[var(--bg-elevated)] hover:border-[var(--bdr-strong)]'
                      }`}
                    >
                      <div>{g === 'male' ? '♂' : '♀'}</div>
                      <div className="mt-2 text-sm text-[var(--tx-2)]">{g === 'male' ? '男命' : '女命'}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="mb-4 text-xl font-semibold bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)] bg-clip-text text-transparent">
                  确认起盘
                </h2>
                <div className="space-y-2.5 rounded-xl bg-[var(--bg-elevated)] p-3.5 text-sm">
                  <Row label="出生日期" value={`${year}年${month}月${day}日`} />
                  <Row label="出生时辰" value={HOURS.find(h => h.index === hour)?.label + ' ' + HOURS.find(h => h.index === hour)?.range} />
                  <Row label="性别" value={gender === 'male' ? '男命' : '女命'} />
                </div>
                <input
                  type="text"
                  placeholder="姓名（可选）"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  className="mt-3 w-full rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)] px-3 py-2 text-sm placeholder:text-[var(--tx-4)] focus:border-[var(--gold)] focus:outline-none"
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部按钮 */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm text-[var(--tx-2)] disabled:opacity-30 transition hover:border-[var(--bdr-strong)]"
        >
          ← 上一步
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!stepValid}
          className="rounded-lg bg-gradient-to-r from-[var(--gold-soft)] via-[var(--gold)] to-[var(--gold-deep)] px-5 py-2 text-sm font-medium text-[var(--bg-base)] shadow-[var(--sh-sm)] disabled:opacity-40 transition active:scale-95"
        >
          {step === 4 ? '✦ 开始推算' : '下一步 →'}
        </button>
      </div>
    </div>
  );
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] text-[var(--tx-3)]">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="mt-0.5 w-full rounded border border-[var(--bdr)] bg-[var(--bg-elevated)] px-2 py-1.5 text-center text-sm focus:border-[var(--gold)] focus:outline-none"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--tx-3)] text-xs">{label}</span>
      <span className="text-[var(--tx-1)]">{value}</span>
    </div>
  );
}
