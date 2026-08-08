import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 紫蓝渐变主色（金色高亮）
        gold: {
          50: '#fdf8e7',
          100: '#faedc4',
          200: '#f5d97d',
          300: '#efc547',
          400: '#e8b322',
          500: '#d4a843',  // 主金色
          600: '#b8922a',
          700: '#9a7820',
          800: '#7c5e1a',
          900: '#5e4514',
        },
        // 暗色背景
        ink: {
          900: '#0a0a0f',
          800: '#11121a',
          700: '#181a26',
          600: '#1f2230',
          500: '#262938',
          400: '#3a3d4e',
        },
      },
      fontFamily: {
        // 中文命理 - Noto Serif SC（衬线）
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'spin-slow': 'spin 1.8s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;