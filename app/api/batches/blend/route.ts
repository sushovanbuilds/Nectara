import { writeRoute } from "@/lib/api";
import { recordBlend } from "@/lib/trace";

export const POST = (req: Request) =>
  writeRoute(req, "blending:record", "blend", async (repo, s, body) => {
    const batch = await recordBlend(repo, s, body);
    return { target: batch.code, result: batch };
  });
