import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { InspectionForm } from "@/components/inspection-form";
import { StateChip, TrustLadder } from "@/components/hive-ui";
import { PageHeader } from "@/components/shell/page-header";
import { WhatIf } from "@/components/what-if";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import { referenceNow, viewHive } from "@/lib/hives";
import { getRepo } from "@/lib/repo";

const PRIORITY = { high: "terra", medium: "amber", low: "green" } as const;

export default async function HivePage(props: PageProps<"/hives/[code]">) {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "hiveos:view")) return <Denied who="honey keepers" />;
  const { code } = await props.params;
  const repo = await getRepo();
  const hive = await repo.getHive(code);
  if (!hive) notFound();
  const { farm, obs, health, asOf } = await viewHive(repo, hive, await repo.listFarms(), await referenceNow(repo));

  const tiles: [string, string | null, string][] = [
    ["Temperature", obs.tempC === null ? null : `${obs.tempC}°C`, "brood, healthy 33–36°C"],
    ["Humidity", obs.humidity === null ? null : `${obs.humidity}%`, "healthy 50–65%"],
    ["Weight change", obs.weightChangeKg === null ? null : `${obs.weightChangeKg >= 0 ? "+" : ""}${obs.weightChangeKg.toFixed(1)} kg`, "over recent readings"],
    ["Activity", obs.activity === null ? null : String(obs.activity), "foraging index, 0–1"],
    ["Sound", obs.soundDb === null ? null : `${obs.soundDb} dB`, "calm under 48 dB"],
  ];
  const concerning = health.factors.filter((f) => f.effect === "concerning");
  const reassuring = health.factors.filter((f) => f.effect === "reassuring");

  return (
    <>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Hive {hive.code} <StateChip state={health.state} /></span>}
        description={`${farm.name}, ${farm.state} · health ${health.score}/100 · data as of ${fmtDate(asOf)}`}
        action={can(s.role, "inspection:log") ? <Button href="#inspection" variant="secondary">Log inspection</Button> : undefined}
      />

      <section aria-label="Latest sensor readings" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="rounded-[10px] border border-line bg-paper p-4">
            <p className="t-small text-ink2">{label}</p>
            <p className={value === null ? "t-small mt-2 text-ink3" : "t-h3 mt-1"}>{value ?? "No sensor"}</p>
            <p className="t-caption mt-1 text-ink3">{hint}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card as="section" aria-labelledby="why-h">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="why-h" className="t-h3">Why {health.state.toLowerCase()}</h2>
            <span className="t-small text-ink2">{health.score}/100</span>
          </div>
          {[["Concerning", concerning, "terra"], ["Reassuring", reassuring, "green"]].map(([title, list, tone]) =>
            (list as typeof concerning).length > 0 && (
              <div key={title as string} className="mt-5">
                <p className="t-small font-medium">{title as string}</p>
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {(list as typeof concerning).map((f) => (
                    <li key={f.id} className="t-small flex items-start justify-between gap-4 py-2.5">
                      <span><span className="font-medium">{f.label}.</span> <span className="text-ink2">{f.detail}</span></span>
                      {f.penalty > 0 ? <Chip tone={tone as "terra"}>−{f.penalty}</Chip> : <Chip tone={tone as "green"}>OK</Chip>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </Card>

        <div className="space-y-6">
          <Card as="section" aria-labelledby="next-h">
            <h2 id="next-h" className="t-h3">Next actions</h2>
            <ol className="mt-4 space-y-3">
              {health.actions.map((a, i) => (
                <li key={i} className="t-small flex items-start gap-3"><Chip tone={PRIORITY[a.priority]}>{a.priority}</Chip><span className="text-ink2">{a.text}</span></li>
              ))}
            </ol>
          </Card>
          <Card as="section" aria-labelledby="trust-h">
            <h2 id="trust-h" className="t-h3">Trust ladder</h2>
            <p className="t-caption mt-1 text-ink3">How much evidence stands behind this state</p>
            <div className="mt-4"><TrustLadder level={health.trustLevel} confidence={health.confidence} /></div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <WhatIf obs={obs} />
        {can(s.role, "inspection:log") && <div id="inspection" className="scroll-mt-20"><InspectionForm hiveCode={hive.code} /></div>}
      </div>
    </>
  );
}
