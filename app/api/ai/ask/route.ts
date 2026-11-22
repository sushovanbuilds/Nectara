import { buildCorpus } from "@/lib/ai/corpus";
import { hit, tooMany } from "@/lib/rate-limit";
import { AiError, aiConfigured, chat, embed } from "@/lib/ai/providers";
import { asciiDigits, askMessages, citedNumbers, isLang, retrieve } from "@/lib/ai/rag";
import { authorize } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";

/**
 * Ask Nectara: answers a question from the records the signed-in role may read, with numbered sources.
 * Without an AI key it still returns the matching records, so the feature degrades to search.
 */
export async function POST(req: Request) {
  const a = await authorize("batch:read"); // every role has it; the corpus itself is scoped by role below
  if (!a.ok) return a.res;
  const body = (await req.json().catch(() => null)) as { question?: unknown; lang?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 3 || question.length > 500) return Response.json({ error: "Ask a question between 3 and 500 characters." }, { status: 400 });
  const lang = isLang(body?.lang) ? body.lang : "en";

  const configured = aiConfigured();
  if (configured) {
    const slot = hit("ai", a.session.uid);
    if (!slot.ok) return tooMany(slot.retryAfter, "questions at once");
  }

  const repo = await getRepo();
  const docs = await buildCorpus(repo, a.session.role);
  const { hits, semantic } = await retrieve(docs, question, { embedder: configured ? (t) => embed(t) : undefined });
  const sources = hits.map((h, i) => ({ n: i + 1, title: h.doc.title, href: h.doc.href ?? null, kind: h.doc.kind }));

  if (!configured) return Response.json({ status: "not_configured", answer: null, cited: [], sources, semantic });
  if (hits.length === 0) return Response.json({ status: "no_sources", answer: null, cited: [], sources, semantic });

  try {
    const r = await chat(askMessages(question, hits.map((h) => h.doc), lang));
    r.text = asciiDigits(r.text);
    await repo.writeAudit({ actorId: a.session.uid, action: "ai:ask", target: `${r.provider}, ${hits.length} sources` });
    return Response.json({ status: "ok", answer: r.text, cited: citedNumbers(r.text, hits.length), sources, provider: r.provider, model: r.model, semantic });
  } catch (e) {
    if (e instanceof AiError) return Response.json({ error: e.message, sources }, { status: e.status });
    throw e;
  }
}
