/** Demo mode: in-memory sample data, no database. Defaults ON so a fresh clone runs with zero setup. */
export const isDemo = (env: Record<string, string | undefined> = process.env) =>
  env.NECTARA_DEMO !== "false";

export const SAMPLE_LABEL = "Sample data";
