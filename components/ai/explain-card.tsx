"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Banner, Loader } from "@/components/ui/states";
import { cx } from "@/lib/cx";
import { AnswerText } from "./answer-text";

const LANGS = [["en", "English"], ["bn", "বাংলা"], ["hi", "हिन्दी"]] as const;

/**
 * A plain-language summary of one record (a hive for its keeper, an incident for an investigator),
 * written by the AI only from the rule engine's output shown on the same page.
 */
export function ExplainCard({ kind, refId, title, intro, configured }: { kind: "hive" | "incident"; refId: string; title: string; intro: string; configured: boolean }) {
  const [lang, setLang] = useState<string>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ text: string; provider: string; lang: string } | null>(null);

  async function write() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/ai/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ref: refId, lang }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.error ?? "Could not write the summary. Try again.");
      else setOut({ text: data.text, provider: data.provider, lang });
    } catch {
      setError("You appear to be offline. Try again when connected.");
    } finally {
      setBusy(false);
    }
  }

  const id = `explain-${kind}-h`;
  return (
    <Card as="section" aria-labelledby={id}>
      <h2 id={id} className="t-h3">{title}</h2>
      <p className="t-small mt-1 text-ink2">{intro}</p>
      {!configured ? (
        <p className="t-small mt-4 rounded-[10px] bg-panel px-3 py-2.5 text-ink2">AI summaries are not set up on this server. An admin can add a Gemini or Groq API key to turn them on.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div role="radiogroup" aria-label="Language" className="inline-flex rounded-[10px] border border-line2 bg-paper p-0.5">
              {LANGS.map(([v, l]) => (
                <button
                  key={v} type="button" role="radio" aria-checked={lang === v} onClick={() => setLang(v)}
                  className={cx("min-h-11 rounded-[10px] px-3 t-small", lang === v ? "bg-ink text-ivory" : "text-ink2 hover:text-ink")}
                >{l}</button>
              ))}
            </div>
            <button type="button" onClick={write} disabled={busy} className={buttonClass("secondary")}>
              {busy ? "Writing…" : out && out.lang === lang ? "Write again" : "Write summary"}
            </button>
          </div>
          {busy && <Loader label="Writing the summary" className="py-8" />}
          {error && <Banner tone="danger" className="mt-4">{error}</Banner>}
          {out && !busy && (
            <div className="mt-5 border-t border-line pt-4" aria-live="polite" lang={out.lang}>
              <AnswerText text={out.text} />
              <p className="t-caption mt-3 text-ink3">Written by {out.provider} from this page&apos;s rule results. The state and factors above are the source of truth; AI can be wrong.</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
