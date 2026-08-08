import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * 静默错误日志接收
 * Vercel 版：使用 /tmp 目录（Serverless 唯一可写目录）
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = new Date().toISOString().slice(0, 10);
    // Vercel 上 /tmp 是唯一可写目录
    const logDir = process.env.VERCEL
      ? '/tmp/logs/errors'
      : path.join(process.cwd(), 'logs', 'errors');

    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch {}

    const logFile = path.join(logDir, `${date}.log`);
    const line = `\n════════════════════════════════════════════════════════════
[${new Date().toISOString()}] ${body.message}
  URL: ${body.url}
  Stack: ${body.stack?.slice(0, 500) || 'N/A'}
  Component: ${body.componentStack?.slice(0, 300) || 'N/A'}
`;

    try {
      await fs.appendFile(logFile, line, 'utf-8');
    } catch {
      // 写入失败静默忽略（不影响用户）
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}