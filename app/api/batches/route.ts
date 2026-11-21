import { authorize } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";

export async function GET() {
  const a = await authorize("batch:read");
  if (!a.ok) return a.res;
  return Response.json(await (await getRepo()).listBatches());
}
