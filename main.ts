// The Most Boring Object, Reviewed in One Line.
// A one-line review of a doorstop — the dullest, most reliable employee in
// the building. The joke is the object's own dullness: it has sat on the
// same patch of floor for eleven years, unthanked, and never once asked
// for anything in return.
//
// Writes the entry to stdout and to $MAKEFUN_OUTPUT_DIR/entry.txt
// (default /output/entry.txt). The file holds the exact entry text with no
// trailing newline; stdout prints the entry plus a newline. Deterministic
// on every run: same text, same bytes.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "Five stars. This doorstop has held the same door open for eleven years without a complaint, a promotion, or a day off — the hardest-working employee in the building, and it gets paid in dust.";

const MAX_CHARS = 200;

if (
  ENTRY.trim().length === 0 ||
  ENTRY.length > MAX_CHARS ||
  ENTRY.includes("\n")
) {
  throw new Error(
    `entry must be a single non-blank line of 1-${MAX_CHARS} characters (got ${ENTRY.length})`,
  );
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), ENTRY, "utf8");
console.log(ENTRY);
