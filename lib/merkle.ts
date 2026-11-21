import { sha256 } from "./hash";

/** Merkle root over hex hashes; an odd node is paired with itself. Empty list has no root. */
export function merkleRoot(hashes: string[]): string {
  if (!hashes.length) throw new Error("merkleRoot: no hashes");
  let level = hashes;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(sha256(level[i] + (level[i + 1] ?? level[i])));
    level = next;
  }
  return level[0];
}
