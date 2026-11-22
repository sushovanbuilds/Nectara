"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Banner, Loader } from "@/components/ui/states";
import { AnswerText, type Source } from "./answer-text";

const EVENT = "nectara:ask";
export const openAsk = () => window.dispatchEvent(new Event(EVENT));

const LANG_OPTIONS = [["en", "English"], ["bn", "বাংলা"], ["hi", "हिन्दी"]] as const;
const KIND = { batch: "Batch", hive: "Hive", incident: "Incident", guide: "How it works" } as Record<string, string>;

type Reply =
  | { status: "ok"; answer: string; cited: number[]; sources: Source[]; provider: string; model: string; semantic: boolean }
  | { status: "not_configured" | "no_sources"; answer: null; sources: Source[] };

/** Side panel that answers questions from the records the signed-in role may read, citing each one. */
export function AskPanel({ configured, suggestions }: { configured: boolean; suggestions: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [lang, setLang] = useState<string>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);

  useEffect(() => {
    const open = () => { if (!dialog.current?.open) dialog.current?.showModal(); input.current?.focus(); };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 3 || busy) return;
    setBusy(true); setError(""); setReply(null); setAsked(text);
    try {
      const res = await fetch("/api/ai/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text, lang }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.error ?? "Something went wrong. Try again.");
      else { setReply(data as Reply); setQuestion(""); }
    } catch {
      setError("You appear to be offline. Try again when connected.");
    } finally {
      setBusy(false);
    }
  }

  const sources = reply?.sources ?? [];
  const shown = reply?.status === "ok" && reply.cited.length ? sources.filter((s) => reply.cited.includes(s.n)) : sources;

  return (
    <dialog ref={dialog} aria-labelledby="ask-h" className="m-0 ml-auto h-dvh max-h-none w-full max-w-[28rem] border-l border-line bg-ivory p-0 text-ink backdrop:bg-ink/35">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id="ask-h" className="t-h3">Ask Nectara</h2>
          <button type="button" onClick={() => dialog.current?.close()} className={buttonClass("ghost", "md", "px-3")}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="t-small text-ink2">Answers come only from records your role can open, with a link to each one. Check the record before you act on an answer.</p>

          {!reply && !busy && !error && (
            <div className="mt-6">
              <p className="t-small font-medium">Try asking</p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {suggestions.map((s) => (
                  <li key={s}><button type="button" onClick={() => ask(s)} className="t-small flex min-h-11 w-full items-center py-2 text-left text-ink2 hover:text-ink">{s}</button></li>
                ))}
              </ul>
            </div>
          )}

          {asked && (busy || reply || error) && <p className="t-small mt-6 font-medium text-ink">{asked}</p>}
          {busy && <Loader label="Reading the records" className="py-10" />}
          {error && <Banner tone="danger" className="mt-4">{error}</Banner>}

          {reply && (
            <div className="mt-3" aria-live="polite">
              {reply.status === "ok" && <AnswerText text={reply.answer} sources={sources} />}
              {reply.status === "not_configured" && <Banner className="mt-1">AI answers are not set up on this server, so here are the records that match your question. An admin can add a Gemini or Groq API key to turn answers on.</Banner>}
              {reply.status === "no_sources" && <p className="t-body text-ink2">No records match that question. Try a batch code like HC-2026-00124 or a hive code like A-105.</p>}

              {shown.length > 0 && (
                <div className="mt-6">
                  <p className="t-small font-medium">{reply.status === "ok" ? "Sources" : "Matching records"}</p>
                  <ol className="mt-2 divide-y divide-line border-y border-line">
                    {shown.map((s) => (
                      <li key={s.n}>
                        {s.href ? (
                          <Link href={s.href} onClick={() => dialog.current?.close()} className="flex min-h-11 items-baseline gap-3 py-2.5 hover:bg-paper">
                            <span className="w-6 shrink-0 font-display italic text-amber-ink">{s.n}</span>
                            <span className="min-w-0"><span className="t-small block text-ink">{s.title}</span><span className="t-caption text-ink3">{KIND[s.kind] ?? s.kind}</span></span>
                          </Link>
                        ) : <span className="t-small flex min-h-11 items-center gap-3 py-2.5"><span className="w-6 font-display italic text-amber-ink">{s.n}</span>{s.title}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {reply.status === "ok" && <p className="t-caption mt-4 text-ink3">Written by {reply.provider} ({reply.model}) from {sources.length} records{reply.semantic ? ", found by meaning and keywords" : ", found by keywords"}. AI can be wrong.</p>}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="shrink-0 border-t border-line bg-paper px-5 py-4">
          <label htmlFor="ask-q" className="sr-only">Your question</label>
          <textarea
            id="ask-q" ref={input} rows={2} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(question); } }}
            placeholder={configured ? "Ask about a batch, hive or incident" : "Search the records"}
            className="t-body block w-full resize-none rounded-[10px] border border-line2 bg-ivory px-3 py-2.5"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="t-small flex items-center gap-2 text-ink2">Answer in
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="min-h-11 rounded-[10px] border border-line2 bg-ivory px-2 text-ink">
                {LANG_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <button type="submit" disabled={busy || question.trim().length < 3} className={buttonClass("primary")}>{busy ? "Asking…" : "Ask"}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
