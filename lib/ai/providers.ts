/**
 * One OpenAI-compatible client for both free providers: Gemini (through its OpenAI endpoint) and Groq.
 * The first configured provider answers; on an error, timeout or rate limit the next one is tried.
 * Keys stay on the server: nothing here is imported by client components.
 */

export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }
type Env = Record<string, string | undefined>;

interface Provider { id: "gemini" | "groq"; label: string; url: string; key: string; model: string; extra: Record<string, unknown> }

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
const GROQ_BASE = "https://api.groq.com/openai/v1";
const TIMEOUT_MS = 25_000;

export function providers(e: Env = process.env): Provider[] {
  const list: Provider[] = [];
  // Defaults measured on 22 Nov 2026: gemini-3.1-flash-lite answers in ~1.5 s (3.5 Flash-Lite took 14 s);
  // Groq's Llama models were retired, gpt-oss-120b at low reasoning answers in ~0.6 s.
  if (e.GEMINI_API_KEY) list.push({ id: "gemini", label: "Gemini", url: `${GEMINI_BASE}/chat/completions`, key: e.GEMINI_API_KEY, model: e.GEMINI_MODEL || "gemini-3.1-flash-lite", extra: {} });
  if (e.GROQ_API_KEY) list.push({ id: "groq", label: "Groq", url: `${GROQ_BASE}/chat/completions`, key: e.GROQ_API_KEY, model: e.GROQ_MODEL || "openai/gpt-oss-120b", extra: e.GROQ_MODEL ? {} : { reasoning_effort: "low" } });
  // AI_PROVIDER=groq puts Groq first; Gemini leads by default.
  return e.AI_PROVIDER === "groq" ? list.sort((a) => (a.id === "groq" ? -1 : 1)) : list;
}

export const aiConfigured = (e: Env = process.env) => providers(e).length > 0;

/** `status` follows HTTP: 503 not configured, 429 every provider rate-limited, 502 no usable answer. */
export class AiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export interface ChatResult { text: string; provider: string; model: string }

export async function chat(messages: ChatMessage[], opts: { env?: Env; fetchImpl?: typeof fetch; maxTokens?: number } = {}): Promise<ChatResult> {
  // Generous budget: on thinking models, reasoning tokens count against max_tokens and can leave the answer empty.
  const { env = process.env, fetchImpl = fetch, maxTokens = 2048 } = opts;
  const list = providers(env);
  if (list.length === 0) throw new AiError("No AI provider is configured.", 503);
  let limited = 0;
  for (const p of list) {
    try {
      const res = await fetchImpl(p.url, {
        method: "POST",
        headers: { authorization: `Bearer ${p.key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: p.model, messages, temperature: 0.2, max_tokens: maxTokens, ...p.extra }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 429) { limited++; continue; }
      if (!res.ok) continue;
      const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { text, provider: p.label, model: p.model };
    } catch {
      // Network error or timeout: fall through to the next provider.
    }
  }
  throw limited === list.length
    ? new AiError("The free AI quota is used up for now. Try again in a minute.", 429)
    : new AiError("The AI service did not answer. Try again in a minute.", 502);
}

/** Gemini embeddings for semantic retrieval. Returns null without a Gemini key or on any failure, so search falls back to keywords. */
export async function embed(texts: string[], opts: { env?: Env; fetchImpl?: typeof fetch } = {}): Promise<number[][] | null> {
  const { env = process.env, fetchImpl = fetch } = opts;
  if (!env.GEMINI_API_KEY || texts.length === 0) return null;
  const model = env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
  const out: number[][] = [];
  try {
    for (let i = 0; i < texts.length; i += 64) {
      const res = await fetchImpl(`${GEMINI_BASE}/embeddings`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.GEMINI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ model, input: texts.slice(i, i + 64) }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
      const rows = [...(data.data ?? [])].sort((a, b) => a.index - b.index);
      if (rows.length !== Math.min(64, texts.length - i)) return null;
      out.push(...rows.map((r) => r.embedding));
    }
    return out;
  } catch {
    return null;
  }
}
