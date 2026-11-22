import Link from "next/link";

export interface Source { n: number; title: string; href: string | null; kind: string }

/** Renders model output as plain text: paragraphs, "- " bullets, and [n] citations linked to their records. Never as HTML. */
export function AnswerText({ text, sources = [] }: { text: string; sources?: Source[] }) {
  const inline = (line: string, key: string) =>
    line.split(/(\[\d+\])/g).map((part, i) => {
      const m = /^\[(\d+)\]$/.exec(part);
      const src = m && sources.find((s) => s.n === Number(m[1]));
      if (!m) return <span key={`${key}-${i}`}>{part.replace(/\*\*/g, "")}</span>;
      return src?.href
        ? <Link key={`${key}-${i}`} href={src.href} className="t-caption align-super font-medium text-amber-ink underline-offset-2 hover:underline" aria-label={`Source ${m[1]}: ${src.title}`}>[{m[1]}]</Link>
        : <span key={`${key}-${i}`} className="t-caption align-super text-ink3">[{m[1]}]</span>;
    });

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    const k = `ul-${blocks.length}`;
    blocks.push(<ul key={k} className="list-disc space-y-1.5 pl-5">{bullets.map((b, i) => <li key={i}>{inline(b, `${k}-${i}`)}</li>)}</ul>);
    bullets = [];
  };
  text.split("\n").map((l) => l.trim()).forEach((line, i) => {
    if (/^[-*•]\s+/.test(line)) { bullets.push(line.replace(/^[-*•]\s+/, "")); return; }
    flush();
    if (line) blocks.push(<p key={`p-${i}`}>{inline(line.replace(/^#+\s*/, ""), `p-${i}`)}</p>);
  });
  flush();
  return <div className="t-body space-y-3 text-ink">{blocks}</div>;
}
