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

/** 检查公历日期是否合法 */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** 下拉选项：年份 1900-2026（倒序，最新在前） */
const YEAR_OPTIONS = Array.from({ length: 127 }, (_, i) => 2026 - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * 起盘表单（4 步向导）
 *
 * Step 1: 年月日（公历）— datalist combobox：既可下拉选择，也可手动输入
 * Step 2: 时辰（子丑寅...）
 * Step 3: 性别
 * Step 4: 确认 + 起盘
 *
 * 设计要点（复刻原始紫微命盘版 + 修复 Vercel 版手动输入 bug）：
 *  - 年/月/日用 string 存储 → 用户自由输入不被 clamp 打断（Vercel 旧版 bug 根因）
 *  - <input list> + <datalist> → 原生下拉候选 + 手动键盘输入双支持
 *  - 失焦时校验范围，提交时校验真实日期（如 2月30日 非法）
 */
export default function BirthForm({ onSubmit }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [year, setYear] = useState<string>('1990');
  const [month, setMonth] = useState<string>('1');
  const [day, setDay] = useState<string>('1');
  const [hour, setHour] = useState<number>(0);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');

  const y = parseInt(year) || 0;
  const m = parseInt(month) || 0;
  const d = parseInt(day) || 0;

  // 日期校验（只在 Step 1 显示错误）
  let dateError = '';
  if (step === 1) {
    if (y < 1900 || y > 2026) dateError = '年份范围 1900–2026';
    else if (m < 1 || m > 12) dateError = '月份 1–12';
    else if (d < 1 || d > 31) dateError = '日期 1–31';
    else if (!isValidDate(y, m, d)) dateError = `${m}月没有${d}日`;
  }

  const stepValid = {
    1: () => !!year && !!month && !!day && !dateError,
    2: () => hour >= 0 && hour <= 11,
    3: () => gender === 'male' || gender === 'female',
    4: () => true,
  }[step]();

  const handleNext = () => {
    if (!stepValid) return;
    if (step < 4) setStep((step + 1) as Step);
    else {
      onSubmit({
        year: y,
        month: m,
        day: d,
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
                <p className="mb-3 text-xs text-[var(--tx-4)]">
                  点击下拉选择，或直接键盘输入（公历）
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <DateCombo
                    label="年"
                    value={year}
                    onChange={setYear}
                    options={YEAR_OPTIONS}
                    display={v => String(v)}
                    placeholder="年份"
                  />
                  <DateCombo
                    label="月"
                    value={month}
                    onChange={setMonth}
                    options={MONTH_OPTIONS}
                    display={v => `${v} 月`}
                    placeholder="月份"
                  />
                  <DateCombo
                    label="日"
                    value={day}
                    onChange={setDay}
                    options={DAY_OPTIONS}
                    display={v => `${v} 日`}
                    placeholder="日期"
                  />
                </div>
                {dateError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-[var(--red)]"
                  >
                    ✕ {dateError}
                  </motion.p>
                )}
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
                  className="mt-3 w-full rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)] px-3 py-2 text-[15px] placeholder:text-[var(--tx-4)] focus:border-[var(--gold)] focus:outline-none"
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

/**
 * 日期下拉 + 手动输入 combobox
 *
 * 用原生 <input list="xxx"> + <datalist>：
 *  - 点击输入框 → 浏览器弹出候选列表（下拉选择）
 *  - 直接打字 → 自由输入（string 存储，不打断）
 *  - 失焦时自动规范化：空 → 保留，数字超范围 → 截断到边界
 */
function DateCombo({
  label,
  value,
  onChange,
  options,
  display,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: number[];
  display: (v: number) => string;
  placeholder: string;
}) {
  const listId = `date-${label}-list`;

  const handleBlur = () => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      const min = Math.min(...options);
      const max = Math.max(...options);
      const clamped = Math.max(min, Math.min(max, num));
      onChange(String(clamped));
    }
    // 空值保留（允许用户继续编辑）
  };

  return (
    <label className="block">
      <span className="text-xs text-[var(--tx-3)]">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        list={listId}
        value={value}
        onChange={e => {
          // 只保留数字，但允许清空（清空时不回退，修复旧版打断 bug）
          const cleaned = e.target.value.replace(/\D/g, '');
          onChange(cleaned);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="mt-1 w-full cursor-pointer rounded-lg border border-[var(--bdr)] bg-[var(--bg-elevated)] px-2 py-2.5 text-center text-lg font-medium text-[var(--tx-1)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/40"
      />
      <datalist id={listId}>
        {options.map(o => (
          <option key={o} value={String(o)} label={display(o)} />
        ))}
      </datalist>
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
