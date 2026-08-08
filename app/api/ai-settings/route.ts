import { NextResponse } from 'next/server';
import { resolveAIConfig } from '@/lib/ziwei/ai-config';

export const runtime = 'nodejs';

/**
 * 公开 AI 配置状态查询
 *
 * Vercel 部署版：admin 通过 /api/admin/ai-config 写入（本地）/ Vercel 控制台配 env（生产），
 * 这里返回**公开信息**（apiUrl + model + 是否已配置 + apiKey 掩码），
 * 永远不返回 apiKey 明文。
 *
 * 普通访客：知道"AI 已配置可用 / 模型是哪个"，不能读/改 apiKey。
 */
export async function GET() {
  const resolved = await resolveAIConfig();

  if (!resolved) {
    return NextResponse.json({
      configured: false,
      message: 'AI 引擎尚未配置，请联系管理员。',
    });
  }

  return NextResponse.json({
    configured: true,
    apiUrl: resolved.apiUrl.replace(/\/$/, ''),
    model: resolved.model,
    apiKeyMask: maskKey(resolved.apiKey),
  });
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key[0] + '***';
  return `${key.slice(0, 3)}${'*'.repeat(Math.min(key.length - 6, 12))}${key.slice(-3)}`;
}
