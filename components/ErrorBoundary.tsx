'use client';

import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 静默上报到日志 API
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        ts: Date.now(),
      }),
    }).catch(() => {});
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-ink-800 border border-gold-700/30 rounded-xl p-6 shadow-lg">
            <h2 className="text-gold-gradient text-xl font-semibold mb-3">
              ⚠ 命盘推算出现偏差
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              命理推演过程发生异常，请重新起盘。
            </p>
            <details className="text-xs text-gray-500 mb-4">
              <summary className="cursor-pointer">查看异常详情</summary>
              <pre className="mt-2 p-2 bg-ink-900 rounded overflow-auto text-[11px]">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="btn-primary w-full"
            >
              重新起盘
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}