import { NextRequest, NextResponse } from 'next/server';
import { resolveAIConfig } from '@/lib/ziwei/ai-config';
import { writeRuntimeOverride, deleteRuntimeOverride } from '@/lib/ziwei/runtime-override';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 管理员 AI 配置 API（Bearer token 鉴权）
 *
 * 鉴权：Authorization: Bearer ${AI_ADMIN_PASSWORD}
 * 默认密码 moss2026，部署时**必须**设置 AI_ADMIN_PASSWORD 环境变量覆盖。
 *
 * ─── Vercel 部署的特殊性 ────────────────────────────────────
 * Vercel 上 process.env.* 是构建时烧死的，运行时**只读**。
 * 所以：
 *   - GET  返回当前生效配置（脱敏：apiKey 永远掩码）
 *   - POST 在本地开发时：写到 .runtime-ai-config.json（覆盖 env）
 *   - POST 在 Vercel 生产时：返回 clear instructions（请去 Vercel 控制台配 env + Redeploy）
 *
 * 真正的 Vercel env 修改流程：
 *   Vercel 控制台 → Project → Settings → Environment Variables
 *   → 改完触发 Redeploy → 重新构建时新 env 才生效
 */

// ─── 鉴权 ────────────────────────────────────────────────
function checkAuth(req: NextRequest): boolean {
  const expected = process.env.AI_ADMIN_PASSWORD || 'moss2026';
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 && token === expected;
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key[0] + '***';
  return `${key.slice(0, 3)}${'*'.repeat(Math.min(key.length - 6, 12))}${key.slice(-3)}`;
}

// ─── GET — 管理员查看当前配置（脱敏） ─────────────────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: '未授权，请检查 Bearer token' }, { status: 401 });
  }

  const resolved = await resolveAIConfig();

  return NextResponse.json({
    configured: !!resolved,
    apiUrl: resolved?.apiUrl || '',
    model: resolved?.model || '',
    apiKeyMask: maskKey(resolved?.apiKey || ''),
    source: resolved?.source || 'none',
    vercel: !!process.env.VERCEL,
  });
}

// ─── POST — 管理员更新配置 ────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: '未授权，请检查 Bearer token' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { apiUrl, apiKey, model } = body as { apiUrl?: string; apiKey?: string; model?: string };

  if (!apiUrl || !apiKey || !model) {
    return NextResponse.json({ error: 'apiUrl、apiKey、model 均为必填' }, { status: 400 });
  }

  if (process.env.VERCEL) {
    // Vercel 生产：env 只读，API 改不了。返回清晰指引给管理员。
    return NextResponse.json({
      success: false,
      message: 'Vercel 部署环境无法通过 API 修改环境变量。请前往 Vercel 控制台配置：\n'
        + '1. Project → Settings → Environment Variables\n'
        + '2. 设置 DEEPSEEK_BASE_URL / DEEPSEEK_API_KEY / DEEPSEEK_MODEL\n'
        + '3. 保存后必须 Redeploy 重新部署才能生效',
      vercel: true,
      submitted: { apiUrl, model, apiKeyMask: maskKey(apiKey) },
    });
  }

  // 本地开发：写到 runtime override 文件
  try {
    await writeRuntimeOverride({ apiUrl, apiKey, model });
    return NextResponse.json({
      success: true,
      source: 'runtime-override',
      message: '已写入 .runtime-ai-config.json（覆盖 process.env）。下次 AI 调用立即生效。',
      settings: { apiUrl, model, apiKeyMask: maskKey(apiKey) },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `写入失败：${err.message}` },
      { status: 500 },
    );
  }
}

// ─── DELETE — 清除运行时覆盖（恢复纯 env） ───────────────
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: '未授权，请检查 Bearer token' }, { status: 401 });
  }

  await deleteRuntimeOverride();
  return NextResponse.json({ success: true, message: '运行时覆盖已清除，下次读取回退到 process.env' });
}
