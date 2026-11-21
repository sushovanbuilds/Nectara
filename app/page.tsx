import Link from "next/link";
import { StateChip } from "@/components/hive-ui";
import { FlowDiagram } from "@/components/landing/flow-diagram";
import { HiveWhatIf } from "@/components/landing/hive-whatif";
import { JourneyMap } from "@/components/landing/journey-map";
import { RevealRoot } from "@/components/landing/reveal-root";
import { SealFlip } from "@/components/landing/seal-flip";
import { evaluate, observe } from "@/lib/hiveos";
import { SiteNav } from "@/components/landing/site-nav";
import { VerifyMini } from "@/components/landing/verify-mini";
import { buttonClass } from "@/components/ui/button";
import { BrowserFrame, PhoneFrame } from "@/components/ui/frames";
import { StatFigure } from "@/components/ui/stat-figure";
import { Wordmark } from "@/components/ui/wordmark";
import { isDemo, SAMPLE_LABEL } from "@/lib/demo";
import { sample } from "@/lib/sample";

const PIB = { label: "PIB, National Beekeeping & Honey Mission", href: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc2025112682601.pdf" };
const CSE = { label: "Centre for Science and Environment, Dec 2020", href: "https://www.cseindia.org/food-fraud-10493" };

const PIPELINE = ["BatchEvent", "SHA-256", "Merkle root", "Risk score", "Signed QR"];
const LADDER = ["Manual observation", "Basic sensor", "Multiple sensors", "Sensors plus a corroborating inspection"];
const ROLES: [string, string, string][] = [
  ["Brands", "A QR on every jar", "Buyers check origin, journey and lab status themselves, without an account."],
  ["Labs", "Certificates that stay put", "A certificate binds to the one batch it tested; reuse elsewhere is refused and flagged."],
  ["Investigators", "Clusters, not noise", "Related alerts are grouped within 72 hours, and every score is explained rule by rule."],
];
// Neutral ink tints, so no segment reads as good or bad.
const RISK: [string, number, string][] = [
  ["Lab results", 40, "#1F1D1A"], ["Traceability", 20, "#5F594F"], ["Supplier history", 15, "#8D8578"], ["Geo / timeline", 15, "#B8741A"], ["Process / sensor", 10, "#E3AB52"],
];
const CORE = ["HIVEOS hive health with reasons, actions and a trust ladder", "Append-only, hash-chained TRACE record", "HMAC-signed QR labels with revoke and clone detection",
  "Lab results bound to one batch", "Rule-based risk scores and 72-hour incident clusters", "Seven role workspaces and a public verify page"];
const PROPOSED = ["₹1,500 smart-hive kit (target cost)", "Acoustic alerts from hive sound", "Bengali and Hindi voice logging", "WhatsApp keeper bot",
  "Public-chain anchoring of seal roots", "Export and government-scheme bridge"];

const SAMPLE_ROOT = sample.anchors.find((a) => a.batchId === "b-124")!.merkleRoot;
// HIVEOS illustration uses the real engine on sample hive A-105, as of its newest reading.
const obsA105 = observe(sample.readings.filter((r) => r.hiveId === "hive-a105"), sample.inspections.filter((i) => i.hiveId === "hive-a105"), new Date("2026-08-21T06:00:00Z"));
const hive = evaluate(obsA105);
const TILES: [string, string][] = [["Temperature", `${obsA105.tempC}°C`], ["Humidity", `${obsA105.humidity}%`], ["Activity", `${obsA105.activity}`], ["Sound", `${obsA105.soundDb} dB`]];

const FACTS =["Hive-to-shelf event log", "HMAC-signed QR", "Lab evidence bound to one batch", "Works offline in demo mode"];

const BREAKS: [string, string][] = [
  ["Consumers", "A label says “pure”. Nothing on the jar lets you check."],
  ["Beekeepers", "Honest producers compete on price with syrup-cut honey and cannot prove the difference."],
  ["Labs", "A certificate can be copied onto batches it never tested."],
  ["Investigators", "Records sit in paper and spreadsheets that can be edited after the fact."],
];

/** Real events from sample batch HC-2026-00124, with their real chained hashes. */
function EventLog() {
  const events = sample.events.filter((e) => e.batchId === "b-124");
  const detail = (p: unknown) => {
    const o = p as Record<string, unknown>;
    return [o.hive, o.kg && `${o.kg} kg`, o.floralSource, o.collector].filter(Boolean).join(" · ");
  };
  return (
    <figure className="mt-5 overflow-hidden rounded-md border border-line bg-ivory">
      <figcaption className="t-caption border-b border-line px-3 py-2 text-ink3">Event log excerpt · HC-2026-00124 · sample data</figcaption>
      <ol className="divide-y divide-line font-mono text-[11.5px] leading-snug">
        {events.map((e) => (
          <li key={e.id} className="grid gap-0.5 px-3 py-2">
            <span className="flex justify-between gap-2"><span className="font-medium text-ink">{e.type}</span><span className="text-ink3">{e.hash.slice(0, 8)}</span></span>
            <span className="truncate text-ink2">{detail(e.payload)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Dots() {
  return (
    <figure className="mt-10 border-t border-line pt-6">
      <div role="img" aria-label="CSE's NMR test of 13 honey brands: 10 failed, 3 passed." className="flex flex-wrap gap-2 md:gap-2.5">
        {Array.from({ length: 13 }, (_, i) => i < 10
          ? <span key={i} className="size-4 rounded-full bg-terra md:size-6" />
          : <span key={i} className="size-4 rounded-full border-2 border-green md:size-6" />)}
      </div>
      <figcaption className="t-small mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-ink2">
        <span>CSE’s NMR test, 13 brands</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-full bg-terra" />Failed: 10</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-full border-2 border-green" />Passed: 3</span>
      </figcaption>
      <p className="t-caption mt-2 text-ink3">Several brands disputed the findings; CSE stood by its results.</p>
    </figure>
  );
}

export default function Landing() {
  return (
    <>
      <SiteNav />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section className="wrap overflow-x-clip pb-16 pt-10 md:pb-24 md:pt-16">
          <div className="grid-12 items-center gap-y-14">
            <div className="col-span-12 lg:col-span-7">
              <p className="t-small flex flex-wrap items-center gap-3 text-ink2">
                Honey traceability &amp; smart beekeeping
                {isDemo() && <span className="t-caption rounded-full bg-honeybg px-2.5 py-0.5 font-medium text-amber-ink">{SAMPLE_LABEL}</span>}
              </p>
              <h1 className="t-hero mt-5 text-balance">Proof in every jar.</h1>
              <p className="t-body-lg mt-6 max-w-xl text-ink2">
                Verified honey, from hive to shelf. Scan a jar to see where it came from, who handled it, and whether a lab actually tested it.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/login" className={buttonClass("primary", "lg")}>Try the demo</Link>
                <Link href="/verify/sample" className={buttonClass("secondary", "lg")}>Scan a sample jar</Link>
              </div>
            </div>
            <div className="col-span-12 flex justify-center lg:col-span-5">
              <div className="relative">
                <div aria-hidden className="absolute -right-6 top-12 size-56 rounded-full bg-amber md:-right-10 md:size-80" />
                <PhoneFrame label="Nectara verify screen for sample batch HC-2026-00124: label verified, lab test in progress, record seal intact." tilt={-4} width={268} className="relative">
                  <VerifyMini />
                </PhoneFrame>
              </div>
            </div>
          </div>
        </section>

        <div className="border-y border-line">
          <ul className="wrap t-small grid grid-cols-2 gap-x-6 gap-y-2 py-4 text-ink2 md:flex md:flex-wrap">
            {FACTS.map((f, i) => <li key={f} className="flex items-center gap-6">{i > 0 && <span aria-hidden className="hidden text-ink3 md:inline">·</span>}{f}</li>)}
          </ul>
        </div>

        {/* The problem */}
        <section id="problem" aria-labelledby="problem-h" className="wrap section-pad">
          <h2 id="problem-h" className="t-h2 max-w-3xl">India exports honey at scale. Buyers still can’t tell what’s in the jar.</h2>
          <div className="mt-12 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
            <StatFigure className="border-b border-line py-8 md:border-0 md:pr-8" value="1.4 lakh MT" context="Natural honey produced in India, 2024" source={PIB} />
            <StatFigure className="border-b border-line py-8 md:border-0 md:px-8" value="1.07 lakh MT" context="Exported in FY 2023-24" source={PIB} />
            <StatFigure className="py-8 md:pl-8" value="10 of 13" context="Brands failed NMR purity testing" source={CSE} />
          </div>
          <Dots />
          <ol className="mt-16 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {BREAKS.map(([who, line], i) => (
              <li key={who} className="flex gap-5 border-t border-line pt-5">
                <span className="font-display text-2xl italic text-amber-ink">{String(i + 1).padStart(2, "0")}</span>
                <p className="t-body text-ink2"><strong className="font-medium text-ink">{who}.</strong> {line}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-h" className="border-t border-line bg-paper">
          <div className="wrap section-pad">
            <h2 id="how-h" className="t-h2 max-w-2xl">Three capabilities around one sealed batch record</h2>
            <div className="mt-12"><FlowDiagram log={<EventLog />} /></div>
          </div>
        </section>

        {/* The journey */}
        <section id="journey" aria-labelledby="journey-h" className="wrap section-pad">
          <h2 id="journey-h" data-reveal className="t-h2 max-w-2xl">Seven stops. Every hand-off written once.</h2>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="t-body-lg mt-4 max-w-2xl text-ink2">The lab stop is green because it is the only place purity evidence can come from.</p>
          <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-14"><JourneyMap /></div>
          <div data-reveal className="mt-16 border-t border-line pt-8">
            <p className="t-small font-medium">The integrity pipeline</p>
            <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 font-mono text-[13px]">
              {PIPELINE.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-amber">→</span>}
                  <span className="rounded-full border border-line2 bg-paper px-3 py-1.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Integrity principle: the one dark section */}
        <section id="integrity" aria-labelledby="integrity-h" className="bg-ink text-ivory">
          <div className="wrap section-pad">
            <h2 id="integrity-h" data-reveal className="t-h2 max-w-2xl">Two questions. Two kinds of proof. Never mixed.</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2 md:divide-x md:divide-white/15">
              <div data-reveal>
                <p className="t-h3">Is the honey genuine?</p>
                <p className="t-body-lg mt-3 text-ivory/85"><span className="text-honey">Laboratory evidence.</span> A certificate attaches only to the batch it tested. Re-using it on another batch is refused and flagged.</p>
              </div>
              <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="md:pl-10">
                <p className="t-h3">Has the record been rewritten?</p>
                <p className="t-body-lg mt-3 text-ivory/85"><span className="text-honey">Cryptographic seal.</span> Every event is written once and hash-chained; any later edit is detectable.</p>
              </div>
            </div>
            <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
              <p data-reveal className="t-h3 italic text-terra-dark">“We never claim a blockchain proves purity.”</p>
              <div data-reveal style={{ "--i": 1 } as React.CSSProperties}><SealFlip root={SAMPLE_ROOT} /></div>
            </div>
          </div>
        </section>

        {/* For beekeepers: HIVEOS */}
        <section id="beekeepers" aria-labelledby="bee-h" className="wrap section-pad">
          <div className="grid-12 gap-y-12">
            <div className="col-span-12 lg:col-span-5">
              <p data-reveal className="t-small text-ink2">For beekeepers · HIVEOS</p>
              <h2 id="bee-h" data-reveal className="t-h2 mt-3">Know a hive is struggling before you open it.</h2>
              <p data-reveal className="t-body-lg mt-4 text-ink2">Each hive gets a health state with the reasons behind it and the next thing to do.</p>
              <div data-reveal className="mt-5 flex flex-wrap gap-2"><StateChip state="STABLE" /><StateChip state="WATCH" /><StateChip state="STRESSED" /><StateChip state="CRITICAL" /></div>
              <div data-reveal className="mt-10">
                <p className="t-small font-medium">Trust ladder</p>
                <ol className="mt-3 divide-y divide-line border-y border-line">
                  {LADDER.map((l, i) => (
                    <li key={l} className="flex items-baseline gap-4 py-3">
                      <span className="font-display text-xl italic text-amber-ink">{i + 1}</span><span className="t-small text-ink2">{l}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="col-span-12 space-y-5 lg:col-span-7 lg:pl-8">
              <div data-reveal>
                <BrowserFrame label="HIVEOS hive detail for sample hive A-105: Stable, health 100, with reassuring factors listed." url="nectara.app/hives/A-105">
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3"><p className="t-h3">A-105</p><StateChip state={hive.state} /><span className="t-small text-ink2">health {hive.score}/100 · trust level {hive.trustLevel}</span></div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TILES.map(([k, v]) => <div key={k} className="rounded-md bg-panel p-3"><p className="t-caption text-ink3">{k}</p><p className="font-display text-lg">{v}</p></div>)}
                    </div>
                    <ul className="mt-4 space-y-1.5">
                      {hive.factors.slice(0, 3).map((f) => (
                        <li key={f.id} className="t-small flex gap-2"><span className="t-caption h-fit shrink-0 rounded-full bg-greenbg px-2 py-0.5 font-medium text-green">reassuring</span><span className="text-ink2"><strong className="font-medium text-ink">{f.label}.</strong> {f.detail}</span></li>
                      ))}
                    </ul>
                    <p className="t-caption mt-4 text-ink3">Sample data</p>
                  </div>
                </BrowserFrame>
              </div>
              <div data-reveal style={{ "--i": 1 } as React.CSSProperties}><HiveWhatIf obs={obsA105} /></div>
            </div>
          </div>
        </section>

        {/* For brands, labs and investigators */}
        <section id="brands" aria-labelledby="brands-h" className="border-t border-line bg-paper">
          <div className="wrap section-pad">
            <h2 id="brands-h" data-reveal className="t-h2 max-w-2xl">For brands, labs and investigators</h2>
            <ul className="mt-10 border-t border-line">
              {ROLES.map(([who, gets, line], i) => (
                <li key={who} data-reveal style={{ "--i": i } as React.CSSProperties} className="grid gap-2 border-b border-line py-6 md:grid-cols-[12rem_18rem_1fr] md:gap-8">
                  <p className="t-h3">{who}</p>
                  <p className="t-body font-medium">{gets}</p>
                  <p className="t-body text-ink2">{line}</p>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-16">
              <p className="t-small font-medium">How a risk score is built</p>
              <div role="img" aria-label="Risk score weights: lab results 40, traceability 20, supplier history 15, geo and timeline 15, process and sensors 10." className="mt-4 flex h-3 overflow-hidden rounded-full">
                {RISK.map(([label, w, c]) => <span key={label} className="h-full border-r-2 border-paper last:border-0" style={{ width: `${w}%`, background: c }} />)}
              </div>
              <ul className="t-small mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                {RISK.map(([label, w, c]) => (
                  <li key={label} className="flex items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: c }} /><span><strong className="font-medium">{w}</strong> <span className="text-ink2">{label}</span></span></li>
                ))}
              </ul>
              <p className="t-body mt-6 max-w-2xl text-ink2">A score orders the investigation queue. A high score is not a verdict of fraud; a person reviews every case.</p>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" aria-labelledby="road-h" className="wrap section-pad">
          <h2 id="road-h" data-reveal className="t-h2 max-w-2xl">Built today, and proposed next</h2>
          <p data-reveal className="t-small mt-4 flex flex-wrap gap-6 text-ink2">
            <span className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-full bg-green" />Core platform: working in this demo</span>
            <span className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-full border-2 border-amber" />Proposed: not built</span>
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {([["Core platform", CORE, true], ["Proposed", PROPOSED, false]] as const).map(([title, items, core]) => (
              <div key={title} data-reveal>
                <h3 className="t-h3">{title}</h3>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {items.map((it) => (
                    <li key={it} className="t-body flex items-start gap-3 py-3">
                      <span aria-hidden className={core ? "mt-2 size-3 shrink-0 rounded-full bg-green" : "mt-2 size-3 shrink-0 rounded-full border-2 border-amber"} />
                      <span>{it}<span className="sr-only">{core ? " (working)" : " (proposed, not built)"}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section aria-labelledby="cta-h" className="border-t border-line bg-paper">
          <div className="wrap section-pad text-center">
            <h2 id="cta-h" data-reveal className="t-h1">Nectara. <em className="text-amber-ink">Proof in every jar.</em></h2>
            <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/login" className={buttonClass("primary", "lg")}>Try the demo</Link>
              <Link href="/verify" className={buttonClass("secondary", "lg")}>Verify a jar</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="wrap grid gap-8 py-12 md:grid-cols-[1fr_auto]">
          <div>
            <Wordmark />
            <p className="t-caption mt-3 text-ink3">Built for Orbix Hackathon 2026 by Sushovan Halder. All demo data is sample data.</p>
          </div>
          <nav aria-label="Footer" className="t-small flex flex-wrap gap-x-6 text-ink2 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
            <a href="#integrity" className="hover:text-ink">Integrity principle</a>
            <Link href="/login" className="hover:text-ink">Demo</Link>
            <a href="#sources" className="hover:text-ink">Sources</a>
          </nav>
          <div id="sources" className="md:col-span-2">
            <p className="t-caption font-medium text-ink2">Sources</p>
            <ul className="t-caption mt-1 space-y-1 text-ink3">
              <li><a className="underline underline-offset-2 hover:text-ink" href={PIB.href} target="_blank" rel="noopener noreferrer">PIB fact sheet, National Beekeeping &amp; Honey Mission (production 2024; exports FY 2023-24)</a></li>
              <li><a className="underline underline-offset-2 hover:text-ink" href={CSE.href} target="_blank" rel="noopener noreferrer">Centre for Science and Environment, honey adulteration investigation, Dec 2020</a></li>
            </ul>
          </div>
        </div>
      </footer>
      <RevealRoot />
    </>
  );
}
