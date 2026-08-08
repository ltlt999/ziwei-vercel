import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: '紫微斗数排盘 | 倪海夏《天纪》体系',
  description:
    '传统紫微斗数排盘工具，遵循倪海夏《天纪》体系，支持 14 主星、12 宫位、四化飞星、流年大限解读。',
  keywords: ['紫微斗数', '排盘', '倪海夏', '天纪', '命理', '四化', '流年'],
  authors: [{ name: 'Ziwei Studio' }],
  openGraph: {
    title: '紫微斗数排盘',
    description: '倪海夏《天纪》体系 · 14 主星 · 12 宫位 · AI 解读',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 字体缩放防闪烁（hydration 前恢复） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('ziwei-font-scale')||'{}');if(s&&s.scale)document.documentElement.style.setProperty('--font-scale',s.scale);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-ink-900 text-gray-100 antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}