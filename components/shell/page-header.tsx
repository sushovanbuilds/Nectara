/** Page title in Fraunces with an optional line of context and one primary action on the right. */
export function PageHeader({ title, description, action }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="t-h2">{title}</h1>
        {description && <p className="t-body mt-2 max-w-2xl text-ink2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
