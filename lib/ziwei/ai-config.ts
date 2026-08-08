import { readRuntimeOverride } from './runtime-override';

/**
 * AI 配置读取层
 *
 * 优先级（高 → 低）：
 *   1. 运行时覆盖文件 .runtime-ai-config.json（仅本地开发，管理员通过 POST /api/admin/ai-config 写入）
 *   2. process.env（DEEPSEEK_BASE_URL / DEEPSEEK_API_KEY / DEEPSEEK_MODEL）
 *
 * Vercel 上因为 process.env 是构建时烧死的，runtime-override 永远不会被写入
 * （管理员路由 POST 已拦截 → 返"请去 Vercel 控制台"指引），所以 Vercel 上
 * 永远走 process.env。
 *
 * ⚠️ 故意不缓存：
 *   - Vercel cold start 极快（毫秒级函数启动）
 *   - 文件读 1ms 不值得 5 秒缓存增加复杂度
 *   - 管理员 POST 写入后立即生效（不用等缓存失效）
 *
 * 来自 Ponytail Ladder 第 6 步（one-liner）：能不复杂就不复杂。
 */

export interface ResolvedAIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  source: 'runtime-override' | 'process.env';
}

export async function resolveAIConfig(): Promise<ResolvedAIConfig | null> {
  const override = await readRuntimeOverride();

  const apiUrl = override?.apiUrl || process.env.DEEPSEEK_BASE_URL || '';
  const apiKey = override?.apiKey || process.env.DEEPSEEK_API_KEY || '';
  const model = override?.model || process.env.DEEPSEEK_MODEL || '';

  if (!apiKey) return null;

  return {
    apiUrl,
    apiKey,
    model,
    source: override ? 'runtime-override' : 'process.env',
  };
}
