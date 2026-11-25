// The Most Boring Object, Reviewed in One Line — v2 (revised structure).
//
// The joke: a rubber band is the most loyal employee in the drawer —
// it holds everything together for months without complaint, then
// snaps on the one morning you actually need it. Six months of
// loyalty, undone in a single ping.
//
// This revision rebuilds the entry from semantic fragments (rating,
// observation, punchline) instead of one flat string literal, runs the
// result through a pipeline of small validators, and only then hands
// it to a writer that produces $MAKEFUN_OUTPUT_DIR/entry.txt with no
// trailing newline. stdout gets the entry plus a newline. Deterministic,
// stdlib only, no network.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Fragments — the entry is assembled from these, never hand-typed twice.
// ---------------------------------------------------------------------------

interface ReviewParts {
  rating: string;
  observation: string;
  punchline: string;
}

const PARTS: ReviewParts = {
  rating: "One star.",
  observation:
    "This rubber band held my papers together for six months, then snapped on the morning I actually needed it",
  punchline: "six months of loyalty, undone in a single ping.",
};

const SEPARATOR = " ";
const TURN = " — "; // em dash (U+2014) marks the turn into the punchline.

// ---------------------------------------------------------------------------
// Entry — assembles the fragments and exposes the finished text.
// ---------------------------------------------------------------------------

class Review {
  readonly #parts: ReviewParts;

  constructor(parts: ReviewParts) {
    this.#parts = parts;
  }

  render(): string {
    const { rating, observation, punchline } = this.#parts;
    return [rating, observation].join(SEPARATOR) + TURN + punchline;
  }
}

// ---------------------------------------------------------------------------
// Validators — each is a small named rule; all must pass before writing.
// ---------------------------------------------------------------------------

type Rule = (text: string) => string | null;

const MAX_CHARS = 200;

const rules: Rule[] = [
  (t) => (t.length === 0 ? "entry is empty" : null),
  (t) => (t.trim().length === 0 ? "entry is only whitespace" : null),
  (t) => (t.length > MAX_CHARS ? `entry is ${t.length} chars, over the ${MAX_CHARS} cap` : null),
  (t) => (t.includes("\n") || t.includes("\r") ? "entry must be a single line" : null),
  (t) => (t.split(SEPARATOR).some((w) => w === "") ? "entry has a doubled space" : null),
  (t) => (t.includes("—") ? null : "entry lost its em dash (U+2014)"),
  (t) => {
    const bytes = new TextEncoder().encode(t).length;
    return bytes > 0 && bytes < 1000 ? null : `entry is ${bytes} bytes, outside the sane range`;
  },
];

function validate(text: string): void {
  const failures = rules.map((rule) => rule(text)).filter((r): r is string => r !== null);
  if (failures.length > 0) {
    throw new Error(`entry failed validation: ${failures.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Writer — owns the output directory and the byte-exact file write.
// ---------------------------------------------------------------------------

class EntryWriter {
  readonly #dir: string;

  constructor(dir: string) {
    this.#dir = dir;
  }

  write(text: string): string {
    mkdirSync(this.#dir, { recursive: true });
    const target = join(this.#dir, "entry.txt");
    writeFileSync(target, text, "utf8");
    // Round-trip check: what landed on disk must be byte-exactly the text.
    if (readFileSync(target, "utf8") !== text) {
      throw new Error(`round-trip mismatch writing ${target}`);
    }
    return target;
  }
}

// ---------------------------------------------------------------------------
// Main — assemble, validate, write, report.
// ---------------------------------------------------------------------------

function resolveOutputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR;
  if (dir === undefined || dir.trim() === "") return "/output";
  return dir;
}

function main(): void {
  const entry = new Review(PARTS).render();
  validate(entry);
  const target = new EntryWriter(resolveOutputDir()).write(entry);
  process.stdout.write(`${entry}\n`);
  process.stderr.write(`wrote ${entry.length} chars to ${target}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
