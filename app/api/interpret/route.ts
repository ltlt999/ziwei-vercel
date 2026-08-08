import { NextRequest } from 'next/server';
import {
  detectTopic,
  buildAIPrompt,
  callDeepSeek,
  chunkText,
  buildLocalInterpretation,
} from '@/lib/ziwei/interpret';
import type { ZiweiChart, InterpretMessage } from '@/lib/ziwei/types';
import { resolveAIConfig } from '@/lib/ziwei/ai-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 公开解读 API
 *
 * 流程：
 *  1. 接收 chart + messages
 *  2. detectTopic() 路由主题
 *  3. buildAIPrompt() 构建 system + user
 *  4. fetch DeepSeek（来自 Vercel env）→ SSE 流式输出
 *  5. 失败 → 自动降级到本地引擎
 *
 * 配置完全走 process.env（DEEPSEEK_BASE_URL / DEEPSEEK_API_KEY / DEEPSEEK_MODEL），
 * 访客永远看不到 Key，管理员走 /api/admin/ai-config 单独配置。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chart: ZiweiChart = body.chart;
    const messages: InterpretMessage[] = body.messages ?? [];

    if (!chart) {
      return new Response(JSON.stringify({ error: '缺少 chart 数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const question = lastUserMsg?.content ?? '请帮我解读命盘';
    const history = messages.slice(0, -1);  // 排除最后一轮 user 自身（与原项目保持一致）

    const topic = detectTopic(question);
    const { system, user } = buildAIPrompt(chart, question, topic, history);

    // ─── 读取 AI 配置（runtime-override > process.env） ───────
    const resolved = await resolveAIConfig();

    if (!resolved) {
      // 没配 Key → 直接走本地兜底，不报 500
      return streamLocalFallback(topic, chart, question);
    }

    const { apiUrl: baseUrl, apiKey, model } = resolved;

    // ─── 调 AI 流式输出 ─────────────────────────────────────
    const aiMessages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);  // maxDuration - 5s

    const upstreamSignal = req.signal;
    upstreamSignal?.addEventListener('abort', () => controller.abort());

    let aiResponse: Response;
    try {
      aiResponse = await callDeepSeek(aiMessages, { baseUrl, apiKey, model }, controller.signal);
    } catch (err) {
      clearTimeout(timeout);
      return streamLocalFallback(topic, chart, question);
    }

    if (!aiResponse.ok || !aiResponse.body) {
      clearTimeout(timeout);
      return streamLocalFallback(topic, chart, question);
    }

    // ─── SSE 流式转发 + 失败降级兜底 ────────────────────────
    const encoder = new TextEncoder();
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE 协议：data: {...}\n\n  → 解析 delta.text
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const json = JSON.parse(payload);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ delta: { text: delta } })}\n\n`)
                  );
                }
              } catch {
                // 忽略不完整帧
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearTimeout(timeout);
        } catch (err) {
          // 流中断 → 把已发送的部分保留，再追加本地兜底
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: { text: '\n\n⚠️ AI 流中断，已降级到本地引擎补充。\n\n' } })}\n\n`)
          );
          const localText = buildLocalInterpretation(chart, topic, question);
          for (const chunk of chunkText(localText, 12)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: { text: chunk } })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearTimeout(timeout);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── 本地兜底的流式输出（模拟真实流，便于前端无差别渲染） ──
function streamLocalFallback(topic: any, chart: any, question: string): Response {
  const fullText = buildLocalInterpretation(chart, topic, question);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunkText(fullText, 6)) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: { text: chunk } })}\n\n`)
        );
        await new Promise(r => setTimeout(r, 8));  // 模拟思考节奏（前端光标能动）
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
