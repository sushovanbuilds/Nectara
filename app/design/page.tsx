import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, STATUS_TONE } from "@/components/ui/chip";
import { BrowserFrame, PhoneFrame } from "@/components/ui/frames";
import { StatFigure } from "@/components/ui/stat-figure";
import { Wordmark } from "@/components/ui/wordmark";
import { VerifyMini } from "@/components/landing/verify-mini";

export const metadata = { title: "Design system · Nectara", robots: { index: false } };

const SWATCHES: [string, string, string][] = [
  ["ivory", "#F6F1E7", "Page background"], ["paper", "#FCFAF5", "Cards"], ["panel", "#EFE8DA", "Subtle panels"],
  ["line", "#E2D8C6", "Hairlines"], ["line2", "#D3C7B1", "Stronger hairlines"],
  ["ink", "#1F1D1A", "Text, sidebar, primary button"], ["ink2", "#5F594F", "Secondary text"], ["ink3", "#6F685C", "Captions (darkened for contrast)"],
  ["amber", "#B8741A", "Accent fills, focus ring"], ["amber-ink", "#8A5410", "Amber text"], ["honey", "#E3AB52", "Highlights"], ["honeybg", "#F6E6C8", "Amber tint"],
  ["green", "#4F6B48", "Verified, stable, intact"], ["greenbg", "#E1E8DA", "Green tint"], ["terra", "#A5432C", "Failed, broken, high risk"], ["terrabg", "#F3DED6", "Terracotta tint"],
];

const TYPE: [string, string, string][] = [
  ["t-hero", "Hero · 96 / 52", "Proof in every jar."], ["t-h1", "H1 · 56 / 36", "Seven stops. Every hand-off written once."],
  ["t-h2", "H2 · 40 / 30", "Two questions, answered separately"], ["t-h3", "H3 · 24 / 20", "Record seal"],
  ["t-body-lg", "Body large · 19 / 17", "Scan a jar to see where it came from, who handled it, and whether a lab actually tested it."],
  ["t-body", "Body · 16", "Every event is written once; any later edit is detectable."], ["t-small", "Small · 14", "Lab test in progress (LAB-2026-441)"],
  ["t-caption", "Caption · 12.5", "Source: Centre for Science and Environment, Dec 2020"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line py-12 first:border-0 first:pt-0">
      <h2 id={id} className="t-h2">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <main id="main" className="wrap section-pad">
      <header className="mb-12">
        <Wordmark className="text-3xl" />
        <h1 className="t-h1 mt-6">Design system</h1>
        <p className="t-body-lg mt-3 max-w-2xl text-ink2">Tokens and base components, built once and reused across the landing page and the app. Not linked from the product.</p>
      </header>

      <Section id="colour" title="Colour">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map(([name, hex, use]) => (
            <li key={name} className="overflow-hidden rounded-[10px] border border-line bg-paper">
              <div className="h-14 border-b border-line" style={{ background: hex }} />
              <div className="p-3"><p className="t-small font-medium">{name}</p><p className="t-caption font-mono text-ink3">{hex}</p><p className="t-caption text-ink2">{use}</p></div>
            </li>
          ))}
        </ul>
        <p className="t-small mt-4 text-ink2">Status language: <strong>green</strong> verified, stable or intact. <strong>Amber</strong> in progress or watch. <strong>Terracotta</strong> failed, broken, stressed or high risk. Always with a text label.</p>
      </Section>

      <Section id="type" title="Type">
        <ul className="space-y-8">
          {TYPE.map(([cls, label, sample]) => (
            <li key={cls} className="grid gap-2 md:grid-cols-[12rem_1fr] md:items-baseline">
              <p className="t-caption font-mono text-ink3">{label}</p>
              <p className={`${cls} min-w-0 break-words`}>{sample}</p>
            </li>
          ))}
          <li className="grid gap-2 md:grid-cols-[12rem_1fr] md:items-baseline">
            <p className="t-caption font-mono text-ink3">Italic accent</p>
            <p className="t-h1">Nectara. <em className="text-amber-ink">Proof in every jar.</em></p>
          </li>
        </ul>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Try the demo</Button>
          <Button variant="secondary">Scan a sample jar</Button>
          <Button variant="ghost">Verify a jar</Button>
          <Button size="sm" variant="secondary">Open case</Button>
          <Button size="lg">Issue QR label</Button>
          <Button disabled>Log harvest</Button>
          <Button href="/verify" variant="secondary">Link as button</Button>
        </div>
        <p className="t-small mt-3 text-ink2">Labels are verbs. Medium and large meet the 44px touch target.</p>
      </Section>

      <Section id="chips" title="Status chips">
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_TONE).map(([word, tone]) => <Chip key={word} tone={tone}>{word[0].toUpperCase() + word.slice(1)}</Chip>)}
          <Chip>Sample data</Chip>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><p className="t-h3">Paper</p><p className="t-small mt-2 text-ink2">Default surface. Hairline border, 10px radius.</p></Card>
          <Card tone="panel"><p className="t-h3">Panel</p><p className="t-small mt-2 text-ink2">Grouped or secondary content.</p></Card>
          <Card tone="ink"><p className="t-h3">Ink</p><p className="t-small mt-2 text-ivory/80">For the one dark trust moment.</p></Card>
        </div>
      </Section>

      <Section id="stats" title="Stat figures">
        <div className="grid gap-8 border-y border-line py-8 md:grid-cols-3 md:divide-x md:divide-line">
          <StatFigure value="10 of 13" context="Brands failed NMR purity testing" source={{ label: "Centre for Science and Environment, Dec 2020" }} />
          <StatFigure className="md:pl-8" value="420 kg" context="Mustard honey in batch HC-2026-00124" label="Sample data" />
          <StatFigure className="md:pl-8" value="Stable → Watch" context="+3°C for 5 days on hive A-105" label="Illustration" />
        </div>
        <p className="t-small mt-3 text-ink2">Every figure carries a source or an explicit Sample data or Illustration label; the component will not compile without one. Source links are added once each original page is confirmed.</p>
      </Section>

      <Section id="frames" title="Frames">
        <div className="flex flex-wrap items-start gap-10">
          <div className="relative px-6 py-4">
            <div aria-hidden className="absolute right-0 top-10 size-56 rounded-full bg-honey" />
            <PhoneFrame label="Nectara verify screen: label verified, lab test in progress, record seal intact. Sample data." tilt={-4} width={260} className="relative">
              <VerifyMini />
            </PhoneFrame>
          </div>
          <BrowserFrame label="HIVEOS hive detail for A-105, Stable at 100. Sample data." url="nectara.app/hives/A-105" className="w-full max-w-xl">
            <div className="p-5">
              <div className="flex items-center gap-3"><p className="t-h3">A-105</p><Chip tone="green">Stable</Chip></div>
              <p className="t-small mt-1 text-ink2">Saharanpur Apiary · health 100/100 · sample data</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[["Temperature", "35.0°C"], ["Humidity", "57%"], ["Activity", "0.85"], ["Sound", "43 dB"]].map(([k, v]) => (
                  <div key={k} className="rounded-md bg-panel p-3"><p className="t-caption text-ink3">{k}</p><p className="font-display text-lg">{v}</p></div>
                ))}
              </div>
            </div>
          </BrowserFrame>
        </div>
      </Section>

      <Section id="wordmark" title="Wordmark">
        <div className="flex flex-wrap items-center gap-6">
          <Wordmark className="text-4xl" />
          <span className="rounded-[10px] bg-ink px-6 py-4"><Wordmark tone="dark" className="text-4xl" /></span>
        </div>
      </Section>
    </main>
  );
}
