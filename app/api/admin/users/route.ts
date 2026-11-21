import { writeRoute } from "@/lib/api";
import { createUser } from "@/lib/admin";

export const POST = (req: Request) =>
  writeRoute(req, "user:manage", "create-user", async (repo, _s, body) => {
    const u = await createUser(repo, body);
    return { target: u.email, result: u };
  });
