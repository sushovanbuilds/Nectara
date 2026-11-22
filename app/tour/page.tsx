import { notFound } from "next/navigation";
import { SimpleHeader } from "@/components/landing/simple-header";
import { buttonClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { isDemo } from "@/lib/demo";
import { ROLE_LABEL, TOUR, TOUR_MINUTES } from "@/lib/tour";

export const metadata = { title: "Guided tour · Nectara", description: `A ${TOUR.length}-stop guided tour of the Nectara demo, about ${TOUR_MINUTES} minutes.` };

export default function TourPage() {
  if (!isDemo()) notFound();
  return (
    <>
      <SimpleHeader />
      <main id="main" tabIndex={-1} className="wrap section-pad outline-none">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-10">
              <p className="t-small text-ink2">Guided tour · {TOUR.length} stops · about {TOUR_MINUTES} minutes</p>
              <h1 className="t-h1 mt-3 text-balance">See every role, in the order honey moves.</h1>
              <p className="t-body-lg mt-5 max-w-md text-ink2">Each stop signs you in as the right demo account and opens the right page. A strip at the top of the screen keeps the steps in view; press Next to move on.</p>
              <form method="post" action="/tour/1" className="mt-8"><button className={buttonClass("primary", "lg")}>Start the tour</button></form>
              <p className="t-caption mt-4 max-w-md text-ink3">Sample data only. Anything you change lives in memory and resets when the demo server restarts. You can also explore freely: every account uses the password demo1234.</p>
            </div>
          </div>
          <ol className="col-span-12 border-t border-line lg:col-span-7">
            {TOUR.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start">
                <span className="font-display text-2xl italic text-amber-ink">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h2 className="t-h3">{s.title}</h2>
                  <p className="t-small mt-1 text-ink2">{s.summary}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip>{s.role ? `As ${ROLE_LABEL[s.role]}` : "No account"}</Chip>
                    <span className="t-caption text-ink3">{s.minutes < 1 ? "30 s" : `${s.minutes} min`}</span>
                  </p>
                </div>
                <form method="post" action={`/tour/${i + 1}`} className="col-start-2 mt-3 sm:col-start-3 sm:mt-0">
                  <button className={buttonClass("ghost", "md", "px-3 underline-offset-4 hover:underline")}>Start here<span className="sr-only">: stop {i + 1}, {s.title}</span></button>
                </form>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}
