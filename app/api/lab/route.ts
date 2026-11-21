import { writeRoute } from "@/lib/api";
import { recordLabResult } from "@/lib/lab";

export const POST = (req: Request) =>
  writeRoute(req, "lab:publish", "result", async (repo, s, body) => {
    const t = await recordLabResult(repo, s, body);
    return { target: t.labRef, result: t };
  });
