import { hiveDoc, incidentDoc } from "@/lib/ai/corpus";
import { hit, tooMany } from "@/lib/rate-limit";
import { AiError, aiConfigured, chat } from "@/lib/ai/providers";
import { asciiDigits, explainMessages, isLang } from "@/lib/ai/rag";
import { authorize } from "@/lib/auth/guard";
import { viewAll } from "@/lib/hives";
import { getRepo } from "@/lib/repo";

/**
 * Plain-language summary of one record, written only from the rule engine's own output:
 * a hive's health for its keeper, or an incident brief for an investigator. English, Bengali or Hindi.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { kind?: unknown; ref?: unknown; lang?: unknown } | null;
  const kind = body?.kind === "hive" || body?.kind === "incident" ? body.kind : null;
  const ref = typeof body?.ref === "string" ? body.ref : "";
  if (!kind || !ref) return Response.json({ error: "kind (hive or incident) and ref are required" }, { status: 400 });
  const a = await authorize(kind === "hive" ? "hiveos:view" : "risk:read");
  if (!a.ok) return a.res;
  const lang = isLang(body?.lang) ? body.lang : "en";
  if (!aiConfigured()) return Response.json({ error: "AI is not set up on this server. Add GEMINI_API_KEY or GROQ_API_KEY." }, { status: 503 });
  const slot = hit("ai", a.session.uid);
  if (!slot.ok) return tooMany(slot.retryAfter, "summaries at once");

  const repo = await getRepo();
  let doc;
  if (kind === "hive") {
    const v = (await viewAll(repo)).views.find((x) => x.hive.code === ref);
    doc = v && hiveDoc(v);
  } else {
    const i = await repo.getIncident(ref);
    doc = i && (await incidentDoc(repo, i));
  }
  if (!doc) return Response.json({ error: `No ${kind} ${ref}` }, { status: 404 });

  try {
    const r = await chat(explainMessages(kind, doc, lang));
    await repo.writeAudit({ actorId: a.session.uid, action: `ai:explain:${kind}`, target: ref });
    return Response.json({ text: asciiDigits(r.text.replace(/\s*\[1\]/g, "")), provider: r.provider, model: r.model });
  } catch (e) {
    if (e instanceof AiError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
