'use client';

import { motion } from 'framer-motion';

interface Props {
  /** 主题色（hex/rgba），Tab 颜色联动 */
  color?: string;
  /** 主题图标（emoji/字符）*/
  icon?: string;
  /** 主标题（如 "推演命格总览"）*/
  main?: string;
  /** 副标题（如 "结合 14 主星与 12 宫位..."）*/
  sub?: string;
}

/**
 * 加载等待指示器
 *
 * 5 个命理点逐步点亮（排定 / 推演 / 解析 / 印证 / 落笔），
 * 主题色 + 主题图标跟随当前 Tab 颜色变化。
 *
 * 设计经验（来自 skill `ziwei-doushu-development`）：
 *  - 圆环旋转 1.8s/圈
 *  - 5 点错开 300ms（制造思考节奏感）
 *  - 主副标题错开 100ms + 250ms
 *  - 主题色要联动上下文（不要全局一种金）
 */
const POINTS = ['排定', '推演', '解析', '印证', '落笔'];

export default function LoadingIndicator({
  color = 'var(--gold)',
  icon = '✦',
  main = '推演中…',
  sub = '正在排定星辰、理气化神',
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 select-none">
      {/* 旋转圆环 + 中心主题图标 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        className="relative h-12 w-12"
      >
        <div
          className="absolute inset-0 rounded-full border-[1.5px] border-transparent"
          style={{ borderTopColor: color }}
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center text-xl"
          style={{ color }}
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* 主标题 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-3 text-base font-medium text-[var(--tx-1)]"
      >
        {main}
      </motion.p>

      {/* 副标题 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-1 text-sm text-[var(--tx-3)]"
      >
        {sub}
      </motion.p>

      {/* 5 个命理点 */}
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        {POINTS.map((label, i) => (
          <motion.div
            key={label}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity }}
            className="flex flex-col items-center gap-0.5"
          >
            <span className="h-1 w-1 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
            <span className="text-[var(--tx-3)]">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
