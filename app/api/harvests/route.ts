import { writeRoute } from "@/lib/api";
import { recordHarvest } from "@/lib/trace";

export const POST = (req: Request) =>
  writeRoute(req, "harvest:create", "harvest", async (repo, s, body) => {
    const batch = await recordHarvest(repo, s, body);
    return { target: batch.code, result: batch };
  });
