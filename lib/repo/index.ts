import { isDemo } from "@/lib/demo";
import { demoRepo } from "./demo";
import type { Repository } from "./types";

// Dynamic import keeps the Prisma client (and any DB connection) out of demo mode entirely.
export async function getRepo(): Promise<Repository> {
  return isDemo() ? demoRepo : (await import("./prisma")).prismaRepo;
}
export type * from "./types";
