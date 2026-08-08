import fs from 'fs/promises';
import path from 'path';

/**
 * 运行时覆盖文件 IO（仅本地开发用）
 *
 * 文件路径：<projectRoot>/.runtime-ai-config.json
 * 优先级：.runtime-ai-config.json > process.env
 *
 * Vercel 上 process.env 只读，runtime override 永远不会被写入（管理员路由已拦截），
 * 所以 Vercel 上只走 resolveAIConfig() 的 process.env 路径。
 */

const RUNTIME_OVERRIDE_FILE = path.join(process.cwd(), '.runtime-ai-config.json');

export interface RuntimeOverrideData {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}

export async function readRuntimeOverride(): Promise<RuntimeOverrideData | null> {
  try {
    const raw = await fs.readFile(RUNTIME_OVERRIDE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeRuntimeOverride(data: RuntimeOverrideData): Promise<void> {
  await fs.writeFile(RUNTIME_OVERRIDE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function deleteRuntimeOverride(): Promise<void> {
  try {
    await fs.unlink(RUNTIME_OVERRIDE_FILE);
  } catch {
    // 文件不存在本来就算清除成功
  }
}

export async function hasRuntimeOverride(): Promise<boolean> {
  try {
    await fs.access(RUNTIME_OVERRIDE_FILE);
    return true;
  } catch {
    return false;
  }
}
